import { Elysia } from 'elysia'

export const rateLimiter = (options: { max: number; duration: number; skip?: (request: Request) => boolean }) => (app: Elysia) => {
  const store = new Map<string, { count: number; resetTime: number }>()

  return app.onBeforeHandle(({ request, set }) => {
    if (options.skip?.(request)) {
      return
    }
    
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()
    
    let record = store.get(ip)
    
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + options.duration }
      store.set(ip, record)
      return
    }

    record.count++
    
    if (record.count > options.max) {
      set.status = 429
      return { success: false, message: 'Too Many Requests' }
    }
  })
}
