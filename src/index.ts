import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { getConfig } from './config'
import { connectDB } from './lib/db'
import { getSupabase } from './lib/supabase'
import { getResend } from './lib/resend'
import { authRoutes } from './routes/auth'

const config = getConfig()

await connectDB(config.mongodbUri)

export const supabase = getSupabase()
export const resend = getResend()

const app = new Elysia()
  .use(cors({ origin: 'http://localhost:5173' }))
  .use(
    jwt({
      name: 'jwt',
      secret: config.jwtSecret
    })
  )
  .onError(({ code, error }) => {
    const status = code === 'NOT_FOUND' ? 404 : code === 'VALIDATION' ? 422 : 500
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return new Response(JSON.stringify({ success: false, message }), {
      status,
      headers: { 'content-type': 'application/json' }
    })
  })
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .listen(3000)

console.log(`🦊 Elysia server running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
