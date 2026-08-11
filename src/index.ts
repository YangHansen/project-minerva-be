import { app } from './app'
import { config } from './config/env'
import { connectDatabase, disconnectDatabase } from './db/mongo'
import { seedScholarships, seedIelts, seedMentors } from './db/seed'

async function start() {
  const connected = await connectDatabase()
  if (connected) {
    try {
      await Promise.all([seedIelts(), seedMentors()])
      console.info('[database] scholarship catalog, IELTS content, and mentor catalog are ready')
    } catch (error) {
      if (config.isProduction) throw error
      console.warn('[database] seed failed', error)
    }
  }

  app.listen({ port: config.port, hostname: '0.0.0.0' })
  console.info(`Minerva API running at http://localhost:${app.server?.port}`)
}

async function shutdown(signal: string) {
  console.info(`[server] received ${signal}; shutting down`)
  await app.stop()
  await disconnectDatabase()
  process.exit(0)
}

if (import.meta.main) {
  process.once('SIGINT', () => void shutdown('SIGINT'))
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
  await start()
}

export { app }
export type { App } from './app'
