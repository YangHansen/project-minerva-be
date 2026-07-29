// server/src/index.ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors({ origin: 'http://localhost:5173' }))
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .get('/api/users', () => [
    { id: 1, name: 'Alex' },
    { id: 2, name: 'Taylor' }
  ])
  .listen(3000)

console.log(`🦊 Elysia server running at http://${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app