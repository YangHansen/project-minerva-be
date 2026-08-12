import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { config } from './config/env'
import { databaseHealth } from './db/mongo'
import { asAppError } from './lib/errors'
import { authRoutes } from './modules/auth/routes'
import { profileRoutes } from './modules/profiles/routes'
import { scholarshipRoutes } from './modules/scholarships/routes'
import { applicationRoutes } from './modules/applications/routes'
import { checklistRoutes } from './modules/checklists/routes'
import { documentRoutes } from './modules/documents/routes'
import { ieltsRoutes } from './modules/ielts/routes'
import { mentorsRoutes } from './modules/mentors/routes'
import { createMinervaAiRoutes } from './modules/ai/routes'
import { adminRoutes } from './modules/admin/routes'

export const app = new Elysia({ name: 'minerva-api' })
  .use(cors({
    origin: config.frontendOrigin,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID'],
  }))
  .onRequest(({ request, set }) => {
    set.headers['x-request-id'] = request.headers.get('x-request-id') || crypto.randomUUID()
    set.headers['x-content-type-options'] = 'nosniff'
    set.headers['referrer-policy'] = 'no-referrer'
  })
  .onError(({ code, error, request, set }) => {
    const requestId = String(set.headers['x-request-id'] || request.headers.get('x-request-id') || crypto.randomUUID())

    if (code === 'VALIDATION') {
      set.status = 422
      const detail = error instanceof Error ? error.message : String(error)
      console.warn(`[${requestId}] VALIDATION_ERROR`, detail)
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: detail && detail !== 'VALIDATION' ? detail : 'The request did not match the expected format',
          details: detail,
        },
        requestId,
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
        requestId,
      }
    }

    const appError = asAppError(error)
    set.status = appError.status
    if (appError.status >= 500) {
      console.error(`[${requestId}] ${appError.errorCode}`, error)
    }
    return {
      error: {
        code: appError.errorCode,
        message: appError.message,
        ...(appError.details === undefined ? {} : { details: appError.details }),
      },
      requestId,
    }
  })
  .get('/api/health', () => {
    const database = databaseHealth()
    return {
      status: database.status === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database,
    }
  })
  .get('/media/*', async ({ params, set }) => {
    const relative = params['*']
    if (typeof relative !== 'string' || relative.includes('..') || relative.includes('\0')) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'File not found' } }
    }
    const file = Bun.file(`public/${relative}`)
    if (!(await file.exists())) {
      set.status = 404
      return { error: { code: 'NOT_FOUND', message: 'File not found' } }
    }
    return new Response(file)
  })
  .use(authRoutes)
  .use(profileRoutes)
  .use(scholarshipRoutes)
  .use(applicationRoutes)
  .use(checklistRoutes)
  .use(documentRoutes)
  .use(ieltsRoutes)
  .use(mentorsRoutes)
  .use(createMinervaAiRoutes())
  .use(adminRoutes)

export type App = typeof app
