import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { Mentor } from '../models/Mentor'
import { User } from '../models/User'
import { getSupabase } from '../lib/supabase'
import { getConfig } from '../config'

const protectedDetail = {
  tags: ['Mentors'],
  security: [{ bearerAuth: [] }]
}

const mentorDetail = {
  ...protectedDetail,
  security: [{ bearerAuth: [] }]
}

const mentorBody = {
  name: t.String(),
  expertise: t.Optional(t.Array(t.String())),
  scholarshipExperience: t.Optional(t.Array(t.String())),
  availableDays: t.Optional(t.Array(t.String())),
  availableTimeSlots: t.Optional(t.Array(t.String())),
  services: t.Optional(t.Array(t.String())),
  biography: t.Optional(t.String()),
  rating: t.Optional(t.Number()),
  sessionPrice: t.Optional(t.Number()),
  priceInTokens: t.Optional(t.Number())
}

const mentorUpdateBody = {
  name: t.Optional(t.String()),
  expertise: t.Optional(t.Array(t.String())),
  scholarshipExperience: t.Optional(t.Array(t.String())),
  availableDays: t.Optional(t.Array(t.String())),
  availableTimeSlots: t.Optional(t.Array(t.String())),
  services: t.Optional(t.Array(t.String())),
  biography: t.Optional(t.String()),
  rating: t.Optional(t.Number()),
  sessionPrice: t.Optional(t.Number()),
  priceInTokens: t.Optional(t.Number())
}

const mentorResponse = t.Object({
  id: t.String(),
  name: t.String(),
  avatarUrl: t.Nullable(t.String()),
  expertise: t.Array(t.String()),
  scholarshipExperience: t.Array(t.String()),
  availableDays: t.Array(t.String()),
  availableTimeSlots: t.Array(t.String()),
  services: t.Array(t.String()),
  biography: t.String(),
  rating: t.Number(),
  sessionPrice: t.Number(),
  priceInTokens: t.Number()
})

const messageResponse = t.Object({ success: t.Boolean(), message: t.String() })

async function requireAdmin(userId: string, set: { status?: number | string }) {
  const user = await User.findById(userId)
  if (!user || user.role !== 'admin') {
    set.status = 403
    throw new Error('You do not have permission to manage mentors.')
  }
}

async function signedAvatarUrl(avatarPath: string): Promise<string | null> {
  if (!avatarPath) return null
  const { data } = await getSupabase().storage.from('avatars').createSignedUrl(avatarPath, 3600)
  return data?.signedUrl ?? null
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

  // ── GET /api/mentors ─────────────────────────────────────────────────────────
  .get(
    '/',
    async ({ query }) => {
      const filter: any = {}
      if (query.service) {
        filter.services = query.service
      }
      const mentors = await Mentor.find(filter)
      const withAvatars = await Promise.all(
        mentors.map(async (m) => ({
          id: String(m._id),
          name: m.name,
          avatarUrl: await signedAvatarUrl(m.avatarUrl ?? ''),
          expertise: m.expertise ?? [],
          scholarshipExperience: m.scholarshipExperience ?? [],
          availableDays: m.availableDays ?? [],
          availableTimeSlots: m.availableTimeSlots ?? [],
          services: m.services ?? [],
          biography: m.biography ?? '',
          rating: m.rating ?? 0,
          sessionPrice: m.sessionPrice ?? 0,
          priceInTokens: m.priceInTokens ?? 10
        }))
      )
      return { success: true, mentors: withAvatars }
    },
    {
      query: t.Object({
        service: t.Optional(t.String())
      }),
      response: t.Object({ success: t.Boolean(), mentors: t.Array(mentorResponse) }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil daftar mentor dan slot waktu',
        description: 'Mengembalikan seluruh data mentor beserta keahlian, pengalaman beasiswa, dan slot hari/jam yang tersedia.'
      }
    }
  )

  // ── POST /api/mentors (admin) ────────────────────────────────────────────────
  .post(
    '/',
    async ({ body, userId, set }) => {
      await requireAdmin(userId, set)
      const mentor = await Mentor.create(body)
      set.status = 201
      return { success: true, message: 'Mentor created successfully', id: String(mentor._id) }
    },
    {
      body: t.Object(mentorBody),
      response: t.Object({ success: t.Boolean(), message: t.String(), id: t.String() }),
      detail: {
        ...mentorDetail,
        summary: 'Tambah mentor (admin)',
        description: 'Membuat mentor baru. Hanya pengguna dengan role admin.'
      }
    }
  )

  // ── PUT /api/mentors/:id (admin) ─────────────────────────────────────────────
  .put(
    '/:id',
    async ({ params, body, userId, set }) => {
      await requireAdmin(userId, set)
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid mentor id')
      }
      const mentor = await Mentor.findById(params.id)
      if (!mentor) {
        set.status = 404
        throw new Error('Mentor not found')
      }
      mentor.set(body)
      await mentor.save()
      return { success: true, message: 'Mentor updated successfully' }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object(mentorUpdateBody),
      response: messageResponse,
      detail: {
        ...mentorDetail,
        summary: 'Perbarui mentor (admin)',
        description: 'Memperbarui data mentor. Kolom yang tidak dikirim tidak diubah.'
      }
    }
  )

  // ── DELETE /api/mentors/:id (admin) ──────────────────────────────────────────
  .delete(
    '/:id',
    async ({ params, userId, set }) => {
      await requireAdmin(userId, set)
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid mentor id')
      }
      const mentor = await Mentor.findById(params.id)
      if (!mentor) {
        set.status = 404
        throw new Error('Mentor not found')
      }
      if (mentor.avatarUrl) {
        const { error } = await getSupabase().storage.from('avatars').remove([mentor.avatarUrl])
        if (error) console.error('Supabase avatar delete error:', error)
      }
      await mentor.deleteOne()
      return { success: true, message: 'Mentor deleted successfully' }
    },
    {
      params: t.Object({ id: t.String() }),
      response: messageResponse,
      detail: {
        ...mentorDetail,
        summary: 'Hapus mentor (admin)',
        description: 'Menghapus mentor beserta file avatar-nya dari Supabase.'
      }
    }
  )

  // ── POST /api/mentors/:id/avatar-url (admin) ────────────────────────────────
  .post(
    '/:id/avatar-url',
    async ({ params, body, userId, set }) => {
      await requireAdmin(userId, set)
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid mentor id')
      }
      const mentor = await Mentor.findById(params.id)
      if (!mentor) {
        set.status = 404
        throw new Error('Mentor not found')
      }
      const path = `${params.id}/${body.fileName}`
      const { data, error } = await getSupabase().storage.from('avatars').createSignedUploadUrl(path)
      if (error) {
        set.status = 502
        throw new Error('Failed to create upload URL')
      }
      return { success: true, uploadUrl: data.signedUrl, path }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ fileName: t.String() }),
      response: t.Object({ success: t.Boolean(), uploadUrl: t.String(), path: t.String() }),
      detail: {
        ...mentorDetail,
        summary: 'Buat signed upload URL avatar (admin)',
        description: 'Membuat signed upload URL agar frontend dapat mengunggah avatar langsung ke Supabase Storage.'
      }
    }
  )

  // ── POST /api/mentors/:id/avatar (admin) ─────────────────────────────────────
  .post(
    '/:id/avatar',
    async ({ params, body, userId, set }) => {
      await requireAdmin(userId, set)
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid mentor id')
      }
      const mentor = await Mentor.findById(params.id)
      if (!mentor) {
        set.status = 404
        throw new Error('Mentor not found')
      }
      const { data: probe } = await getSupabase().storage.from('avatars').createSignedUrl(body.path, 60)
      if (!probe) {
        set.status = 404
        throw new Error('Upload not found')
      }
      const oldPath = mentor.avatarUrl
      mentor.avatarUrl = body.path
      await mentor.save()
      if (oldPath && oldPath !== body.path) {
        const { error } = await getSupabase().storage.from('avatars').remove([oldPath])
        if (error) console.error('Supabase old avatar delete error:', error)
      }
      return { success: true, message: 'Avatar updated successfully' }
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ fileName: t.String(), path: t.String() }),
      response: messageResponse,
      detail: {
        ...mentorDetail,
        summary: 'Simpan path avatar mentor (admin)',
        description: 'Menyimpan path avatar ke mentor setelah frontend selesai mengunggah file ke Supabase.'
      }
    }
  )
