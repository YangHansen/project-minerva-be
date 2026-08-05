import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId, Types } from 'mongoose'
import { Shortlist, SHORTLIST_ITEM_TYPES } from '../models/Shortlist'
import { Scholarship } from '../models/Scholarship'
import { getConfig } from '../config'

const shortlistItemResponse = t.Object({
  _id: t.String(),
  itemType: t.String(),
  isCompleted: t.Boolean(),
  documentId: t.Nullable(t.String())
})

const shortlistDetailResponse = t.Object({
  _id: t.String(),
  scholarshipId: t.String(),
  scholarshipName: t.String(),
  deadline: t.Nullable(t.String()),
  status: t.String(),
  progress: t.Object({ completed: t.Number(), total: t.Number() }),
  items: t.Array(shortlistItemResponse)
})

const messageResponse = t.Object({ success: t.Boolean(), message: t.String() })

const protectedDetail = {
  tags: ['Shortlists'],
  security: [{ bearerAuth: [] }]
}

export const shortlistRoutes = new Elysia({ prefix: '/api/shortlists' })
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

  // ── GET /api/shortlists ──────────────────────────────────────────────────────
  .get(
    '/',
    async ({ userId }) => {
      const shortlists = await Shortlist.find({ userId }).sort({ createdAt: -1 })
      const ids = shortlists.map((s) => s.scholarshipId)
      const scholarships = await Scholarship.find({ _id: { $in: ids } })
      const byId = new Map(scholarships.map((s) => [String(s._id), s]))
      const result = shortlists.map((sl) => {
        const scholarship = byId.get(String(sl.scholarshipId))
        const items = sl.items.map((item) => ({
          _id: String(item._id),
          itemType: item.itemType,
          isCompleted: item.isCompleted,
          documentId: item.documentId ? String(item.documentId) : null
        }))
        return {
          _id: String(sl._id),
          scholarshipId: String(sl.scholarshipId),
          scholarshipName: scholarship?.name ?? 'Unknown',
          deadline: scholarship?.deadline ? scholarship.deadline.toISOString() : null,
          status: sl.status,
          progress: {
            completed: items.filter((i) => i.isCompleted).length,
            total: items.length
          },
          items
        }
      })
      return { success: true, shortlists: result }
    },
    {
      response: t.Object({ success: t.Boolean(), shortlists: t.Array(shortlistDetailResponse) }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil shortlist & progress pengguna',
        description: 'Mengambil seluruh beasiswa yang disimpan pengguna terautentikasi beserta progress checklist item-nya.'
      }
    }
  )

  // ── DELETE /api/shortlists/:id ───────────────────────────────────────────────
  .delete(
    '/:id',
    async ({ params, userId, set }) => {
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid shortlist id')
      }
      const deleted = await Shortlist.findOneAndDelete({ _id: params.id, userId })
      if (!deleted) {
        set.status = 404
        throw new Error('Shortlist not found')
      }
      return { success: true, message: 'Shortlist removed successfully' }
    },
    {
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Hapus beasiswa dari shortlist',
        description: 'Menghapus beasiswa dari shortlist pengguna beserta seluruh item checklist-nya.'
      }
    }
  )

  // ── PATCH /api/shortlists/:id/items/:itemType ────────────────────────────────
  .patch(
    '/:id/items/:itemType',
    async ({ params, body, userId, set }) => {
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid shortlist id')
      }
      const shortlist = await Shortlist.findOne({ _id: params.id, userId })
      if (!shortlist) {
        set.status = 404
        throw new Error('Shortlist not found')
      }
      const item = (shortlist.items ?? []).find((i) => i.itemType === params.itemType)
      if (!item) {
        set.status = 404
        throw new Error('Item not found in shortlist')
      }
      if (body.documentId && params.itemType !== 'cv' && params.itemType !== 'essay') {
        set.status = 422
        throw new Error('documentId only allowed for cv and essay items')
      }
      if (body.documentId && !isValidObjectId(body.documentId)) {
        set.status = 422
        throw new Error('Invalid document id.')
      }
      if (body.isCompleted !== undefined) item.isCompleted = body.isCompleted
      if (body.documentId !== undefined) {
        item.documentId = body.documentId ? new Types.ObjectId(body.documentId) : null
      }
      await shortlist.save()
      return { success: true, message: 'Item updated successfully' }
    },
    {
      params: t.Object({ id: t.String(), itemType: t.Union(SHORTLIST_ITEM_TYPES.map((v) => t.Literal(v))) }),
      body: t.Object({
        isCompleted: t.Optional(t.Boolean()),
        documentId: t.Optional(t.String())
      }),
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Perbarui status item checklist',
        description: 'Memperbarui status penyelesaian satu item checklist. documentId hanya berlaku untuk itemType cv dan essay.'
      }
    }
  )
