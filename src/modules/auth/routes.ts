import { Elysia, t } from 'elysia'
import { requireDatabase } from '../../db/mongo'
import { User } from '../../models/User'
import { UserProfile } from '../../models/UserProfile'
import { AppError, assertFound } from '../../lib/errors'
import {
  createSessionToken,
  expiredSessionCookie,
  requireAuth,
  requireTrustedMutationOrigin,
  sessionCookie,
} from '../../auth/session'
import { config } from '../../config/env'
import { enforceAuthAttemptLimit, withArgon2Capacity } from './abuse-control'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Z])(?=.*\d).{8,128}$/

async function publicUser(user: { _id: unknown; email: string; role: 'user' | 'admin'; tokenBalance: number }) {
  const profile = await UserProfile.findOne({ userId: user._id }).lean()
  return {
    id: String(user._id),
    name: profile?.name ?? '',
    email: user.email,
    role: user.role,
    tokenBalance: user.tokenBalance,
    profileCompleted: Boolean(
      profile?.name &&
      profile.country &&
      profile.currentEducationLevel &&
      profile.targetEducationLevel &&
      profile.fieldOfStudy,
    ),
  }
}

export const authRoutes = new Elysia({ name: 'auth-routes' })
  .post(
    '/api/auth/register',
    async ({ request, server, body, set }) => {
      requireTrustedMutationOrigin(request)
      enforceAuthAttemptLimit(request, 'register', server?.requestIP(request)?.address)
      requireDatabase()
      const email = body.email.trim().toLowerCase()
      const name = body.name.trim()

      if (!emailPattern.test(email)) throw new AppError(422, 'INVALID_EMAIL', 'Enter a valid email address')
      if (name.length < 2) throw new AppError(422, 'INVALID_NAME', 'Name must contain at least two characters')
      if (!passwordPattern.test(body.password)) {
        throw new AppError(422, 'WEAK_PASSWORD', 'Password must contain 8+ characters, one uppercase letter, and one number')
      }
      if (await User.exists({ email })) throw new AppError(409, 'EMAIL_IN_USE', 'An account already exists for this email')

      const passwordHash = await withArgon2Capacity(() =>
        Bun.password.hash(body.password, { algorithm: 'argon2id' }),
      )
      const user = await User.create({ email, passwordHash })
      try {
        await UserProfile.create({ userId: user._id, name })
      } catch (error) {
        await User.deleteOne({ _id: user._id })
        throw error
      }

      const token = await createSessionToken({ userId: String(user._id), role: user.role })
      set.headers['set-cookie'] = sessionCookie(token)
      set.status = 201
      return { user: await publicUser(user) }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 120 }),
        email: t.String({ minLength: 3, maxLength: 254 }),
        password: t.String({ minLength: 8, maxLength: 128 }),
      }),
    },
  )
  .post(
    '/api/auth/login',
    async ({ request, server, body, set }) => {
      requireTrustedMutationOrigin(request)
      enforceAuthAttemptLimit(request, 'login', server?.requestIP(request)?.address)
      requireDatabase()
      const email = body.email.trim().toLowerCase()
      const user = await User.findOne({ email }).select('+passwordHash')
      const passwordMatches = user
        ? await withArgon2Capacity(() => Bun.password.verify(body.password, user.passwordHash))
        : false
      if (!user || !passwordMatches) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect')
      }

      const ttl = body.remember === false ? 60 * 60 * 24 : config.sessionTtlSeconds
      const token = await createSessionToken({ userId: String(user._id), role: user.role }, ttl)
      set.headers['set-cookie'] = sessionCookie(token, ttl)
      return { user: await publicUser(user) }
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3, maxLength: 254 }),
        password: t.String({ minLength: 1, maxLength: 128 }),
        remember: t.Optional(t.Boolean()),
      }),
    },
  )
  .post('/api/auth/logout', async ({ request, set }) => {
    await requireAuth(request)
    set.headers['set-cookie'] = expiredSessionCookie()
    return { success: true as const }
  })
  .get('/api/auth/me', async ({ request }) => {
    requireDatabase()
    const session = await requireAuth(request)
    const user = await User.findById(session.userId)
    assertFound(user, 'Account not found')
    return { user: await publicUser(user) }
  })
