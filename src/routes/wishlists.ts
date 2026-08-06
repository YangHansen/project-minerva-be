import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { Wishlist } from '../models/Wishlist'
import { Scholarship } from '../models/Scholarship'
import { getConfig } from '../config'

const wishlistItemResponse = t.Object({
  _id: t.String(),
  scholarshipId: t.String(),
  savedAt: t.String(),
  scholarship: t.Object({
    id: t.String(),
    name: t.String(),
    provider: t.String(),
    country: t.String(),
    university: t.Optional(t.String()),
    educationLevel: t.Optional(t.String()),
    fieldOfStudy: t.String(),
    fundingType: t.String(),
    deadline: t.Nullable(t.String())
  })
})

const messageResponse = t.Object({ success: t.Boolean(), message: t.String() })

const protectedDetail = {
  tags: ['Wishlists'],
  security: [{ bearerAuth: [] }]
}

function toScholarshipFields(doc: InstanceType<typeof Scholarship>) {
  return {
    id: String(doc._id),
    name: doc.name,
    provider: doc.provider,
    country: doc.country,
    university: doc.university ?? undefined,
    educationLevel: doc.educationLevel ?? undefined,
    fieldOfStudy: doc.fieldOfStudy,
    fundingType: doc.fundingType,
    deadline: doc.deadline ? doc.deadline.toISOString() : null
  }
}

export const wishlistRoutes = new Elysia({ prefix: '/api/wishlists' })
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

  // ── POST /api/wishlists ──────────────────────────────────────────────────────
  .post(
    '/',
    async ({ body, userId, set }) => {
      if (!isValidObjectId(body.scholarshipId)) {
        set.status = 400
        throw new Error('Invalid scholarship id')
      }
      const scholarship = await Scholarship.findById(body.scholarshipId)
      if (!scholarship) {
        set.status = 404
        throw new Error('Scholarship not found')
      }
      const existing = await Wishlist.findOne({ userId, scholarshipId: body.scholarshipId })
      if (existing) {
        return { success: true, message: 'Scholarship already in wishlist' }
      }
      await Wishlist.create({ userId, scholarshipId: body.scholarshipId })
      set.status = 201
      return { success: true, message: 'Scholarship added to wishlist' }
    },
    {
      body: t.Object({ scholarshipId: t.String() }),
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Simpan beasiswa ke wishlist',
        description: 'Menandai beasiswa sebagai wishlist (bookmark ringan tanpa checklist). Idempotent.'
      }
    }
  )

  // ── DELETE /api/wishlists/:scholarshipId ─────────────────────────────────────
  .delete(
    '/:scholarshipId',
    async ({ params, userId, set }) => {
      if (!isValidObjectId(params.scholarshipId)) {
        set.status = 400
        throw new Error('Invalid scholarship id')
      }
      const deleted = await Wishlist.findOneAndDelete({ userId, scholarshipId: params.scholarshipId })
      if (!deleted) {
        set.status = 404
        throw new Error('Wishlist item not found')
      }
      return { success: true, message: 'Scholarship removed from wishlist' }
    },
    {
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Hapus beasiswa dari wishlist',
        description: 'Menghapus bookmark beasiswa dari wishlist pengguna.'
      }
    }
  )

  // ── GET /api/wishlists ───────────────────────────────────────────────────────
  .get(
    '/',
    async ({ userId }) => {
      const wishlists = await Wishlist.find({ userId }).sort({ createdAt: -1 })
      const ids = wishlists.map((w) => w.scholarshipId)
      const scholarships = await Scholarship.find({ _id: { $in: ids } })
      const byId = new Map(scholarships.map((s) => [String(s._id), s]))
      const result = wishlists.map((w) => {
        const scholarship = byId.get(String(w.scholarshipId))
        return {
          _id: String(w._id),
          scholarshipId: String(w.scholarshipId),
          savedAt: w.createdAt ? w.createdAt.toISOString() : new Date().toISOString(),
          scholarship: scholarship ? toScholarshipFields(scholarship) : {
            id: String(w.scholarshipId),
            name: 'Unknown',
            provider: 'Unknown',
            country: 'Unknown',
            fieldOfStudy: 'Unknown',
            fundingType: 'Unknown',
            deadline: null
          }
        }
      })
      return { success: true, wishlists: result }
    },
    {
      response: t.Object({ success: t.Boolean(), wishlists: t.Array(wishlistItemResponse) }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil wishlist pengguna',
        description: 'Mengambil seluruh beasiswa yang di-bookmark pengguna terautentikasi, terbaru terlebih dahulu.'
      }
    }
  )
