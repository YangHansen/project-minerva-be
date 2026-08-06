import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { rateLimiter } from './middleware/rateLimiter'
import { getConfig } from './config'
import { connectDB } from './lib/db'
import { getSupabase, ensureDocumentsBucket } from './lib/supabase'
import { getResend } from './lib/resend'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/user'
import { documentRoutes } from './routes/documents'
import { scholarshipRoutes } from './routes/scholarships'
import { shortlistRoutes } from './routes/shortlists'
import { aiRoutes } from './routes/ai'
import { ieltsRoutes } from './routes/ielts'
import { mentorRoutes } from './routes/mentors'
import { bookingRoutes } from './routes/bookings'
import { transactionRoutes } from './routes/transactions'
import { scanAndSendReminders } from './lib/reminder'
import { friendlyValidationMessage } from './lib/validation'

const config = getConfig()

await connectDB(config.mongodbUri)
await ensureDocumentsBucket()

export const supabase = getSupabase()
export const resend = getResend()

export const app = new Elysia()
  .use(rateLimiter({ 
    max: 100, 
    duration: 60000, 
    // Bypass global rate limit in test mode so tests don't randomly fail
    skip: () => process.env.NODE_ENV === 'test' 
  }))
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
    const explicitStatus = typeof set.status === 'number' && set.status >= 400 ? set.status : null
    const status =
      explicitStatus !== null
        ? explicitStatus
        : code === 'NOT_FOUND'
          ? 404
          : code === 'VALIDATION'
            ? 422
            : 500
    const validationError = code === 'VALIDATION' && Array.isArray((error as any).all)
      ? (error as any).all[0]
      : null
    const message = validationError
      ? friendlyValidationMessage(validationError)
      : code === 'NOT_FOUND'
        ? 'Endpoint not found.'
        : explicitStatus !== null && error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
    if (!validationError && code !== 'NOT_FOUND' && explicitStatus === null) console.error('[error]', error)
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
  .use(aiRoutes)
  .use(ieltsRoutes)
  .use(mentorRoutes)
  .use(bookingRoutes)
  .use(transactionRoutes)

if (process.env.NODE_ENV !== 'test') {
  app.listen(3000)
  console.log(`🦊 Elysia server running at http://${app.server?.hostname}:${app.server?.port}`)
}

// ponytail: Bun cron is UTC; 0 19 = 19:00 UTC. Shift the hour if you need local 7 PM.
Bun.cron('0 19 * * *', () => {
  scanAndSendReminders().catch(console.error)
})

export type App = typeof app
