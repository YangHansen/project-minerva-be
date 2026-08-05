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
import { aiRoutes } from './routes/ai'
import { ieltsRoutes } from './routes/ielts'
import { mentorRoutes } from './routes/mentors'
import { bookingRoutes } from './routes/bookings'
import { transactionRoutes } from './routes/transactions'
import { scanAndSendReminders } from './lib/reminder'

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
    const message =
      code === 'VALIDATION' && Array.isArray((error as any).all) && (error as any).all.length > 0
        ? (error as any).all[0].message
        : error instanceof Error
          ? error.message
          : 'Unexpected error'
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
  .listen(3000)

// ponytail: Bun cron is UTC; 0 19 = 19:00 UTC. Shift the hour if you need local 7 PM.
Bun.cron('0 19 * * *', () => {
  scanAndSendReminders().catch(console.error)
})

console.log(`🦊 Elysia server running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
