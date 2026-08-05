import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { User } from '../models/User'
import { Document } from '../models/Document'
import { AIReview } from '../models/AIReview'
import { Transaction } from '../models/Transaction'
import { getSupabase } from '../lib/supabase'
import { reviewPdf, reviewText, type ReviewResult } from '../lib/aiReviewer'
import { getConfig } from '../config'

const ESSAY_MAX_LENGTH = 20000

const feedbackSchema = t.Record(t.String(), t.String())

const reviewResponse = t.Object({
  success: t.Boolean(),
  review: t.Object({ feedback: feedbackSchema }),
  remainingTokens: t.Number()
})

const reviewsResponse = t.Object({
  success: t.Boolean(),
  reviews: t.Array(
    t.Object({
      id: t.String(),
      reviewType: t.String(),
      feedback: feedbackSchema,
      documentId: t.Nullable(t.String()),
      essayText: t.Nullable(t.String()),
      createdAt: t.String()
    })
  )
})

const protectedDetail = {
  tags: ['AI Review'],
  security: [{ bearerAuth: [] }]
}

type ReviewInput = {
  documentId?: string
  essayText?: string
  targetScholarshipId?: string
}

async function runReview(
  reviewType: 'cv' | 'essay',
  input: ReviewInput,
  userId: string,
  set: { status?: unknown }
) {
  const { documentId, essayText, targetScholarshipId } = input
  if (documentId && essayText) {
    set.status = 422
    throw new Error('Provide either documentId or essayText, not both')
  }
  if (!documentId && !essayText) {
    set.status = 422
    throw new Error('Provide documentId or essayText')
  }

  const config = getConfig()
  if (!config.openaiApiKey) {
    set.status = 503
    throw new Error('AI review is unavailable')
  }

  const user = await User.findById(userId)
  if (!user || user.tokenBalance < 1) {
    set.status = 402
    throw new Error('You do not have enough tokens to request an AI review.')
  }

  let result: ReviewResult
  let storedDocId: string | null = null

  if (documentId) {
    const doc = await Document.findOne({ _id: documentId, userId })
    if (!doc) {
      set.status = 404
      throw new Error('Document not found')
    }
    if (!doc.fileType.includes('pdf')) {
      set.status = 400
      throw new Error('Document must be a PDF file')
    }
    const { data, error } = await getSupabase().storage.from('documents').download(doc.fileUrl)
    if (error || !data) {
      set.status = 502
      throw new Error('Failed to download document')
    }
    const pdfBytes = await data.arrayBuffer()
    try {
      result = await reviewPdf(pdfBytes, { reviewType, targetScholarshipId }, config.openaiApiKey)
    } catch (err) {
      set.status = 502
      const msg = err instanceof Error ? err.message : ''
      throw new Error(
        msg.includes('upload failed') || msg.includes('file upload')
          ? 'Failed to upload document'
          : 'AI review failed'
      )
    }
    storedDocId = documentId
  } else {
    try {
      result = await reviewText(essayText!, { reviewType, targetScholarshipId }, config.openaiApiKey)
    } catch {
      set.status = 502
      throw new Error('AI review failed')
    }
  }

  const updated = await User.findOneAndUpdate(
    { _id: userId, tokenBalance: { $gte: 1 } },
    { $inc: { tokenBalance: -1 } },
    { new: true }
  )
  if (!updated) {
    set.status = 402
    throw new Error('You do not have enough tokens to request an AI review.')
  }

  await Transaction.create({
    userId,
    amount: -1,
    type: reviewType === 'cv' ? 'cv_review' : 'essay_review',
    status: 'success'
  })

  await AIReview.create({
    userId,
    documentId: storedDocId ?? undefined,
    essayText: essayText ?? undefined,
    reviewType,
    targetScholarshipId: targetScholarshipId ?? undefined,
    feedback: result.feedback
  })

  return { success: true, review: { feedback: result.feedback }, remainingTokens: updated.tokenBalance }
}

export const aiRoutes = new Elysia({ prefix: '/api/ai' })
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

  // ── POST /api/ai/review-cv ───────────────────────────────────────────────────
  .post(
    '/review-cv',
    async ({ body, userId, set }) => {
      if (!isValidObjectId(body.documentId)) {
        set.status = 400
        throw new Error('Invalid document id')
      }
      return runReview('cv', body, userId, set)
    },
    {
      body: t.Object({
        documentId: t.String(),
        targetScholarshipId: t.Optional(t.String())
      }),
      response: reviewResponse,
      detail: {
        ...protectedDetail,
        summary: 'Review CV berbasis AI',
        description: 'Mengunduh PDF CV dari Supabase, mengirim ke AI untuk feedback, dan memotong 1 token.'
      }
    }
  )

  // ── POST /api/ai/review-essay ────────────────────────────────────────────────
  .post(
    '/review-essay',
    async ({ body, userId, set }) => {
      if (body.documentId && !isValidObjectId(body.documentId)) {
        set.status = 400
        throw new Error('Invalid document id')
      }
      return runReview('essay', body, userId, set)
    },
    {
      body: t.Object({
        documentId: t.Optional(t.String()),
        essayText: t.Optional(t.String({ maxLength: ESSAY_MAX_LENGTH })),
        targetScholarshipId: t.Optional(t.String())
      }),
      response: reviewResponse,
      detail: {
        ...protectedDetail,
        summary: 'Review esai berbasis AI',
        description: 'Mereview esai dari teks tempel atau PDF, dan memotong 1 token.'
      }
    }
  )

  // ── GET /api/ai/reviews ──────────────────────────────────────────────────────
  .get(
    '/reviews',
    async ({ userId }) => {
      const reviews = await AIReview.find({ userId }).sort({ createdAt: -1 })
      const normalized = reviews.map((r) => ({
        id: String(r._id),
        reviewType: r.reviewType,
        feedback: r.feedback,
        documentId: r.documentId ? String(r.documentId) : null,
        essayText: r.essayText ?? null,
        createdAt: r.createdAt.toISOString()
      }))
      return { success: true, reviews: normalized }
    },
    {
      response: reviewsResponse,
      detail: {
        ...protectedDetail,
        summary: 'Ambil riwayat review AI',
        description: 'Mengambil seluruh riwayat review AI pengguna terautentikasi, terbaru terlebih dahulu.'
      }
    }
  )
