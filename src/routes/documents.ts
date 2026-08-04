import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { Document } from '../models/Document'
import { getSupabase } from '../lib/supabase'
import { getConfig } from '../config'

const DOCUMENT_TYPE_ENUM = {
  cv: 'cv', essay: 'essay', research_plan: 'research_plan', personal_statement: 'personal_statement',
  study_plan: 'study_plan', recommendation_letter: 'recommendation_letter', transcript: 'transcript',
  ielts_cert: 'ielts_cert', passport: 'passport', portfolio: 'portfolio', writing_sample: 'writing_sample',
  thesis_abstract: 'thesis_abstract', health_certificate: 'health_certificate',
  family_relationship_proof: 'family_relationship_proof', citizenship_proof: 'citizenship_proof'
} as const

export const documentRoutes = new Elysia({ prefix: '/api/documents' })
  .use(jwt({ name: 'jwt', secret: getConfig().jwtSecret }))
  .derive(async ({ headers, jwt, set }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    const verified = token ? await jwt.verify(token) : false
    const sub = verified && typeof verified !== 'boolean' ? verified.sub : null
    if (!sub) {
      set.status = 401
      throw new Error('Unauthorized')
    }
    return { userId: sub as string }
  })
  .post(
    '/upload-url',
    async ({ body, userId }) => {
      const path = `${userId}/${body.fileName}`
      const { data, error } = await getSupabase().storage.from('documents').createSignedUploadUrl(path)
      if (error) throw new Error(error.message)
      return { success: true, uploadUrl: data.signedUrl, path }
    },
    { body: t.Object({ fileName: t.String() }) }
  )
  .post(
    '/upload',
    async ({ body, userId }) => {
      const document = await Document.create({
        userId,
        fileName: body.fileName,
        fileUrl: body.path,
        fileType: body.fileType,
        documentType: body.documentType
      })
      return { success: true, document }
    },
    {
      body: t.Object({
        fileName: t.String(),
        path: t.String(),
        fileType: t.String(),
        documentType: t.Enum(DOCUMENT_TYPE_ENUM)
      })
    }
  )
  .get('/', async ({ userId }) => {
    const documents = await Document.find({ userId }).sort({ createdAt: -1 })
    // ponytail: signed URL per request, 1h expiry; no caching
    const withUrls = await Promise.all(
      documents.map(async (doc) => {
        const { data } = await getSupabase().storage.from('documents').createSignedUrl(doc.fileUrl, 3600)
        return { ...doc.toObject(), url: data?.signedUrl ?? null }
      })
    )
    return { success: true, documents: withUrls }
  })
