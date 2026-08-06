import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { Document } from '../src/models/Document'
import { jwt } from '@elysiajs/jwt'
import { getConfig } from '../src/config'

describe('Documents Security Tests', () => {
  let userAId: string
  let userAToken: string
  let userBToken: string
  let userADocId: string

  const userAEmail = 'userA@example.com'
  const userBEmail = 'userB@example.com'

  beforeAll(async () => {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } })
    const userA = await User.create({ email: userAEmail, password: await Bun.password.hash('Password123!') })
    const userB = await User.create({ email: userBEmail, password: await Bun.password.hash('Password123!') })

    // Generate tokens manually instead of going through login
    const jwtPlugin = require('@elysiajs/jwt').jwt({
      name: 'jwt',
      secret: getConfig().jwtSecret
    })
    
    // Quick way to sign:
    const sign = async (id: string, role: string) => {
      // Just call login to get token to avoid manually calling plugin logic
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-forwarded-for': 'doc-test'
          },
          body: JSON.stringify({ email: id === String(userA._id) ? userAEmail : userBEmail, password: 'Password123!' })
        })
      )
      const data = await res.json()
      return data.token
    }

    userAToken = await sign(String(userA._id), userA.role)
    userBToken = await sign(String(userB._id), userB.role)

    // Create a mock document for User A directly in DB
    const doc = await Document.create({
      userId: userA._id,
      fileName: 'secret.pdf',
      fileUrl: `${String(userA._id)}/secret.pdf`,
      fileType: 'application/pdf',
      documentType: 'cv'
    })
    userADocId = String(doc._id)
    userAId = String(userA._id)
  })

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } })
    await Document.deleteMany({ fileName: 'secret.pdf' })
  })

  test('IDOR: User B attempts to GET User A document', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/documents/${userADocId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userBToken}` }
      })
    )
    
    // Expect 404 because findOne adds { userId: userBId } which won't match
    expect(res.status).toBe(404)
  })

  test('IDOR: User B attempts to DELETE User A document', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/documents/${userADocId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userBToken}` }
      })
    )
    
    expect(res.status).toBe(404)
  })

  test('Metadata upload rejects invalid documentType', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: 'cv.pdf',
          path: `${userAId}/cv.pdf`,
          fileType: 'application/pdf',
          documentType: 'not-a-type'
        })
      })
    )

    expect(res.status).toBe(422)
  })

  test('Metadata upload rejects file that was never uploaded', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: 'ghost.pdf',
          path: `${userAId}/ghost.pdf`,
          fileType: 'application/pdf',
          documentType: 'cv'
        })
      })
    )

    expect(res.status).toBe(404)
  })
})
