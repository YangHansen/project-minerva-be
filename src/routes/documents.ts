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

const documentResponse = t.Object({
  _id: t.String(),
  userId: t.String(),
  fileName: t.String(),
  fileUrl: t.String(),
  fileType: t.String(),
  documentType: t.String(),
  isApostilled: t.Boolean(),
  status: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  __v: t.Number()
})

const protectedDetail = {
  tags: ['Documents'],
  security: [{ bearerAuth: [] }]
}

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
    {
      body: t.Object({ fileName: t.String() }),
      response: t.Object({ success: t.Boolean(), uploadUrl: t.String(), path: t.String() }),
      detail: {
        ...protectedDetail,
        summary: 'Buat signed upload URL',
        description: 'Membuat signed URL untuk mengunggah file langsung ke Supabase Storage. Path: {userId}/{fileName}.'
      }
    }
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
      return { success: true, document: JSON.parse(JSON.stringify(document)) }
    },
    {
      body: t.Object({
        fileName: t.String(),
        path: t.String(),
        fileType: t.String(),
        documentType: t.Enum(DOCUMENT_TYPE_ENUM)
      }),
      response: t.Object({ success: t.Boolean(), document: documentResponse }),
      detail: {
        ...protectedDetail,
        summary: 'Simpan metadata dokumen',
        description: 'Menyimpan metadata dokumen setelah file berhasil diunggah ke Supabase.'
      }
    }
  )
  .get(
    '/',
    async ({ userId }) => {
      const documents = await Document.find({ userId }).sort({ createdAt: -1 })
      // ponytail: signed URL per request, 1h expiry; no caching
      const withUrls = await Promise.all(
        documents.map(async (doc) => {
          const { data } = await getSupabase().storage.from('documents').createSignedUrl(doc.fileUrl, 3600)
          return { ...JSON.parse(JSON.stringify(doc.toObject())), url: data?.signedUrl ?? null }
        })
      )
      return { success: true, documents: withUrls }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        documents: t.Array(t.Composite([documentResponse, t.Object({ url: t.Nullable(t.String()) })]))
      }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil daftar dokumen pengguna',
        description: 'Mengambil seluruh dokumen pengguna terautentikasi dengan signed URL unduh (berlaku 1 jam).'
      }
    }
  )
