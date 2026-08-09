import { Elysia, t } from 'elysia'
import type { Types } from 'mongoose'
import { requireAuth } from '../../../auth/session'
import { AppError } from '../../../lib/errors'
import { stripHtml } from '../../../lib/serialize'
import { Document } from '../../../models/Document'
import { DocumentAiReview, toStoredMetadata } from '../models'
import { runPaidAiOperation } from '../paid-operation'
import { recordCompletedUsage, recordFailedUsage } from '../usage'
import {
  resolveScholarship,
  scholarshipContext,
  sha256,
  throwRouteError,
  type AiRouteDependencies,
} from './shared'

type SuggestionPlain = {
  _id: unknown
  category: string
  title: string
  detail: string
  originalText: string
  replacement: string
  priority: 'high' | 'medium' | 'low'
  tone: 'purple' | 'yellow' | 'blue' | 'green'
  status: 'pending' | 'accepted' | 'dismissed'
}

type OwnedDocument = {
  _id: Types.ObjectId
  applicationId?: Types.ObjectId
}

type ReviewPlain = {
  _id: unknown
  overall: number
  clarity: number
  grammar: number
  structure: number
  impact: number
  scholarshipAlignment: number
  summary: string
  strengths: string[]
  suggestions: SuggestionPlain[]
  reviewedContentHash: string
  createdAt: Date
}

const serializeSuggestion = (suggestion: SuggestionPlain) => ({
  id: String(suggestion._id),
  category: suggestion.category,
  title: suggestion.title,
  detail: suggestion.detail,
  originalText: suggestion.originalText,
  replacement: suggestion.replacement,
  priority: suggestion.priority,
  tone: suggestion.tone,
  dismissed: suggestion.status === 'dismissed',
  accepted: suggestion.status === 'accepted',
})

const serializeReview = (review: ReviewPlain) => ({
  id: String(review._id),
  overall: review.overall,
  clarity: review.clarity,
  grammar: review.grammar,
  structure: review.structure,
  impact: review.impact,
  scholarshipAlignment: review.scholarshipAlignment,
  summary: review.summary,
  strengths: review.strengths,
  suggestions: review.suggestions.map(serializeSuggestion),
  reviewedContentHash: review.reviewedContentHash,
  reviewedAt: review.createdAt,
})

type MutableSuggestion = SuggestionPlain & {
  resolvedAt?: Date
}

const resolveSuggestion = async (input: {
  userId: string
  documentId: string
  suggestionId: string
  status: 'accepted' | 'dismissed'
}) => {
  const review = await DocumentAiReview.findOne({
    userId: input.userId,
    documentId: input.documentId,
    'suggestions._id': input.suggestionId,
  })
  if (!review) throw new AppError(404, 'SUGGESTION_NOT_FOUND', 'Review suggestion not found')

  const suggestions = review.suggestions as unknown as MutableSuggestion[]
  const suggestion = suggestions.find((item) => String(item._id) === input.suggestionId)
  if (!suggestion) throw new AppError(404, 'SUGGESTION_NOT_FOUND', 'Review suggestion not found')
  suggestion.status = input.status
  suggestion.resolvedAt = new Date()
  review.markModified('suggestions')
  await review.save()
  return serializeSuggestion(suggestion)
}

export const createDocumentReviewRoutes = ({ getAi }: AiRouteDependencies) =>
  new Elysia({ name: 'minerva-document-ai-reviews' })
    .get('/api/documents/:id/reviews', async ({ request, params }) => {
      const { userId } = await requireAuth(request)
      const document = await Document.findOne({ _id: params.id, userId })
        .select('_id')
        .lean() as unknown as OwnedDocument | null
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      const reviews = await DocumentAiReview.find({ userId, documentId: document._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean() as unknown as ReviewPlain[]
      return { reviews: reviews.map(serializeReview) }
    })
    .post(
      '/api/documents/:id/reviews',
      async ({ request, params, body, set }) => {
        const { userId } = await requireAuth(request)
        const document = await Document.findOne({ _id: params.id, userId })
          .select('_id applicationId')
          .lean() as unknown as OwnedDocument | null
        if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')

        const contentText = stripHtml(body.content)
        if (!contentText) throw new AppError(422, 'EMPTY_DOCUMENT', 'Add document content before requesting a review')
        const scholarship = await resolveScholarship(body.scholarshipId)
        const context = scholarshipContext(scholarship as Record<string, unknown> | null)
        const prompt = [body.prompt?.trim(), body.focus?.trim() ? `Requested review focus: ${body.focus.trim()}` : '']
          .filter(Boolean)
          .join('\n')

        const paidResult = await runPaidAiOperation(userId, () =>
          getAi().reviewDocument({
            title: body.title,
            prompt,
            content: contentText,
            scholarshipContext: context,
          }),
        ).catch(async (error) => {
          await recordFailedUsage({
            userId,
            operation: 'document_review',
            model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra',
            error,
          })
          return throwRouteError(error)
        })
        const result = paidResult.value
        await recordCompletedUsage({
          userId,
          operation: 'document_review',
          metadata: result.metadata,
        })

        const review = await DocumentAiReview.create({
          userId,
          documentId: document._id,
          scholarshipId: body.scholarshipId,
          reviewedContentHash: await sha256(contentText),
          overall: result.overall,
          clarity: result.clarity,
          grammar: result.grammar,
          structure: result.structure,
          impact: result.impact,
          scholarshipAlignment: result.scholarshipAlignment,
          summary: result.summary,
          strengths: result.strengths,
          suggestions: result.suggestions.map((suggestion) => ({
            ...suggestion,
            status: 'pending',
          })),
          metadata: toStoredMetadata(result.metadata),
        })
        set.status = 201
        return {
          review: serializeReview(review.toObject() as unknown as ReviewPlain),
          tokenBalance: paidResult.tokenBalance,
        }
      },
      {
        body: t.Object({
          content: t.String({ minLength: 1, maxLength: 1_000_000 }),
          title: t.String({ minLength: 1, maxLength: 300 }),
          prompt: t.Optional(t.String({ maxLength: 4_000 })),
          scholarshipId: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
          focus: t.Optional(t.String({ maxLength: 1_000 })),
        }),
      },
    )
    .post('/api/documents/:id/suggestions/:suggestionId/accept', async ({ request, params }) => {
      const { userId } = await requireAuth(request)
      const document = await Document.findOne({ _id: params.id, userId }).select('_id').lean()
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      const suggestion = await resolveSuggestion({
        userId,
        documentId: params.id,
        suggestionId: params.suggestionId,
        status: 'accepted',
      })
      return { suggestion }
    })
    .post('/api/documents/:id/suggestions/:suggestionId/dismiss', async ({ request, params }) => {
      const { userId } = await requireAuth(request)
      const document = await Document.findOne({ _id: params.id, userId }).select('_id').lean()
      if (!document) throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found')
      const suggestion = await resolveSuggestion({
        userId,
        documentId: params.id,
        suggestionId: params.suggestionId,
        status: 'dismissed',
      })
      return { suggestion }
    })
