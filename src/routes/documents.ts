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
      throw new Error('Authentication required. Please sign in.')
    }
    return { userId: sub as string }
  })
  .post(
    '/upload',
    async ({ body, userId, set }) => {
      const file = body.file
      const path = `${userId}/${file.name}`
      
      const arrayBuffer = await file.arrayBuffer()
      const { error } = await getSupabase().storage.from('documents').upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: true
      })
      
      if (error) {
        set.status = 502
        throw new Error('Failed to upload file to storage')
      }

      const document = await Document.create({
        userId,
        fileName: file.name,
        fileUrl: path,
        fileType: file.type,
        documentType: body.documentType
      })
      return { success: true, document: JSON.parse(JSON.stringify(document)) }
    },
    {
      body: t.Object({
        file: t.File({
          type: ['application/pdf', 'image/jpeg', 'image/png'],
          maxSize: 5 * 1024 * 1024
        }),
        documentType: t.Enum(DOCUMENT_TYPE_ENUM)
      }),
      response: t.Object({ success: t.Boolean(), document: documentResponse }),
      detail: {
        ...protectedDetail,
        summary: 'Unggah file dan simpan metadata',
        description: 'Mengunggah file (PDF/Image, max 5MB) ke Supabase dan menyimpan metadata ke MongoDB.'
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
  .get(
    '/:id',
    async ({ params, userId, set }) => {
      const document = await Document.findOne({ _id: params.id, userId })
      if (!document) {
        set.status = 404
        throw new Error('Document not found')
      }
      
      const { data } = await getSupabase().storage.from('documents').createSignedUrl(document.fileUrl, 3600)
      return { success: true, document: { ...JSON.parse(JSON.stringify(document)), url: data?.signedUrl ?? null } }
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({
        success: t.Boolean(),
        document: t.Composite([documentResponse, t.Object({ url: t.Nullable(t.String()) })])
      }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil detail dokumen',
        description: 'Mengambil detail dokumen spesifik milik pengguna.'
      }
    }
  )
  .delete(
    '/:id',
    async ({ params, userId, set }) => {
      const document = await Document.findOne({ _id: params.id, userId })
      if (!document) {
        set.status = 404
        throw new Error('Document not found')
      }
      
      const { error } = await getSupabase().storage.from('documents').remove([document.fileUrl])
      if (error) {
        console.error('Supabase delete error:', error)
      }
      
      await document.deleteOne()
      return { success: true, message: 'Document deleted successfully' }
    },
    {
      params: t.Object({ id: t.String() }),
      response: t.Object({ success: t.Boolean(), message: t.String() }),
      detail: {
        ...protectedDetail,
        summary: 'Hapus dokumen',
        description: 'Menghapus dokumen dari database dan file dari Supabase. Memastikan IDOR protection dengan userId.'
      }
    }
  )
