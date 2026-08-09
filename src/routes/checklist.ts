import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { Shortlist } from '../models/Shortlist'
import { Document } from '../models/Document'
import { getConfig } from '../config'

export const checklistRoutes = new Elysia({ prefix: '/api/checklist' })
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
    '/:itemId/document',
    async ({ params, body, userId, set }) => {
      if (!isValidObjectId(params.itemId)) {
        set.status = 400
        throw new Error('Invalid checklist item id')
      }

      const shortlist = await Shortlist.findOne({ 'items._id': params.itemId, userId })
      if (!shortlist) {
        set.status = 404
        throw new Error('Checklist item not found')
      }

      const item = (shortlist.items ?? []).find(i => String(i._id) === params.itemId)
      if (!item) {
        set.status = 404
        throw new Error('Checklist item not found')
      }

      const file = body.file as File
      const fileUrl = `mock-uploads/${Date.now()}-${file.name || 'doc.pdf'}`

      const document = await Document.create({
        userId,
        fileName: file.name || 'Checklist Document',
        fileUrl,
        fileType: file.type || 'application/pdf',
        documentType: item.itemType,
        status: 'uploaded'
      })

      item.documentId = document._id
      item.isCompleted = true
      await shortlist.save()

      return {
        success: true,
        message: 'Document uploaded and linked successfully',
        item: {
          _id: String(item._id),
          itemType: item.itemType,
          isCompleted: item.isCompleted,
          documentId: String(item.documentId)
        },
        document: {
          id: String(document._id),
          fileName: document.fileName,
          fileUrl: document.fileUrl
        }
      }
    },
    {
      body: t.Object({
        file: t.File()
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        item: t.Object({
          _id: t.String(),
          itemType: t.String(),
          isCompleted: t.Boolean(),
          documentId: t.String()
        }),
        document: t.Object({
          id: t.String(),
          fileName: t.String(),
          fileUrl: t.String()
        })
      })
    }
  )
