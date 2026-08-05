import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { getConfig } from './config'
import { connectDB } from './lib/db'
import { getSupabase, ensureDocumentsBucket } from './lib/supabase'
import { getResend } from './lib/resend'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/user'
import { documentRoutes } from './routes/documents'
import { scholarshipRoutes } from './routes/scholarships'
import { shortlistRoutes } from './routes/shortlists'

const config = getConfig()

await connectDB(config.mongodbUri)
await ensureDocumentsBucket()

export const supabase = getSupabase()
export const resend = getResend()

const app = new Elysia()
  .use(cors({ origin: 'http://localhost:5173' }))
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Project Minerva API',
          description: 'Dokumentasi API backend Project Minerva (as-built).',
          version: '1.0.0'
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        }
      }
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwtSecret
    })
  )
  .onError(({ code, error, set }) => {
    const status =
      typeof set.status === 'number' && set.status >= 400
        ? set.status
        : code === 'NOT_FOUND'
          ? 404
          : code === 'VALIDATION'
            ? 422
            : 500
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ success: false, message }), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  })
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(userRoutes)
  .use(documentRoutes)
  .use(scholarshipRoutes)
  .use(shortlistRoutes)
  .listen(3000)

console.log(`🦊 Elysia server running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
