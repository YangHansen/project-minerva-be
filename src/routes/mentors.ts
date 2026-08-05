import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { Mentor } from '../models/Mentor'
import { getConfig } from '../config'

const protectedDetail = {
  tags: ['Mentors'],
  security: [{ bearerAuth: [] }]
}

export const mentorRoutes = new Elysia({ prefix: '/api/mentors' })
  .use(jwt({ name: 'jwt', secret: getConfig().jwtSecret }))
  .derive(async ({ headers, jwt, set }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    const verified = token ? await jwt.verify(token) : false
    const sub = verified && typeof verified !== 'boolean' ? verified.sub : null
    if (!sub) {
      set.status = 401
      throw new Error('Authentication required. Please sign in.')
    }
    return { userId: sub as string }
  })
  .get(
    '/',
    async () => {
      const mentors = await Mentor.find({})
      return {
        success: true,
        mentors: mentors.map((m) => ({
          id: String(m._id),
          name: m.name,
          avatarUrl: m.avatarUrl ?? null,
          expertise: m.expertise ?? [],
          scholarshipExperience: m.scholarshipExperience ?? [],
          availableDays: m.availableDays ?? [],
          availableTimeSlots: m.availableTimeSlots ?? [],
          priceInTokens: m.priceInTokens ?? 10
        }))
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        mentors: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(),
            avatarUrl: t.Nullable(t.String()),
            expertise: t.Array(t.String()),
            scholarshipExperience: t.Array(t.String()),
            availableDays: t.Array(t.String()),
            availableTimeSlots: t.Array(t.String()),
            priceInTokens: t.Number()
          })
        )
      }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil daftar mentor dan slot waktu',
        description: 'Mengembalikan seluruh data mentor beserta keahlian, pengalaman beasiswa, dan slot hari/jam yang tersedia.'
      }
    }
  )
