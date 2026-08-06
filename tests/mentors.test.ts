import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { Mentor } from '../src/models/Mentor'
import { getSupabase } from '../src/lib/supabase'

describe('Mentor Management Tests', () => {
  let adminToken: string
  let userToken: string
  let mentorId: string

  const adminEmail = 'mentor-admin@example.com'
  const userEmail = 'mentor-user@example.com'

  beforeAll(async () => {
    await User.deleteMany({ email: { $in: [adminEmail, userEmail] } })
    await Mentor.deleteMany({ name: /Mentor Test/ })

    const admin = await User.create({ email: adminEmail, password: await Bun.password.hash('Password123!'), role: 'admin' })
    const user = await User.create({ email: userEmail, password: await Bun.password.hash('Password123!') })

    const login = async (email: string) => {
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'mentor-test' },
          body: JSON.stringify({ email, password: 'Password123!' })
        })
      )
      return (await res.json()).token
    }
    adminToken = await login(adminEmail)
    userToken = await login(userEmail)
  })

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [adminEmail, userEmail] } })
    await Mentor.deleteMany({ name: /Mentor Test/ })
  })

  const adminHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` })
  const userHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` })

  test('admin creates mentor -> 201', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          name: 'Mentor Test A',
          expertise: ['Chevening'],
          priceInTokens: 15
        })
      })
    )
    expect(res.status).toBe(201)
    mentorId = (await res.json()).id
  })

  test('non-admin cannot create mentor -> 403', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors', {
        method: 'POST',
        headers: userHeaders(),
        body: JSON.stringify({ name: 'Mentor Test B' })
      })
    )
    expect(res.status).toBe(403)
  })

  test('admin updates mentor -> 200', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/mentors/${mentorId}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ priceInTokens: 20 })
      })
    )
    expect(res.status).toBe(200)

    const list = await app.handle(new Request('http://localhost/api/mentors', { headers: adminHeaders() }))
    const data = await list.json()
    expect(data.mentors.find((m: { id: string }) => m.id === mentorId).priceInTokens).toBe(20)
  })

  test('update nonexistent mentor -> 404', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors/000000000000000000000001', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ priceInTokens: 5 })
      })
    )
    expect(res.status).toBe(404)
  })

  test('update invalid mentor id -> 400', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors/not-an-id', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ priceInTokens: 5 })
      })
    )
    expect(res.status).toBe(400)
  })

  test('avatar-url then avatar metadata saves path', async () => {
    const avUrl = await app.handle(
      new Request(`http://localhost/api/mentors/${mentorId}/avatar-url`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ fileName: 'avatar.jpg' })
      })
    )
    expect(avUrl.status).toBe(200)
    const { uploadUrl, path } = await avUrl.json()
    expect(path).toBe(`${mentorId}/avatar.jpg`)

    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: new TextEncoder().encode('fake-jpeg')
    })
    expect(put.status).toBe(200)

    const meta = await app.handle(
      new Request(`http://localhost/api/mentors/${mentorId}/avatar`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ fileName: 'avatar.jpg', path })
      })
    )
    expect(meta.status).toBe(200)
  })

  test('GET /api/mentors returns signed avatar URL', async () => {
    const res = await app.handle(new Request('http://localhost/api/mentors', { headers: adminHeaders() }))
    const data = await res.json()
    const mentor = data.mentors.find((m: { id: string }) => m.id === mentorId)
    expect(mentor.avatarUrl).toContain('/avatars/')
    expect(mentor.avatarUrl).toContain('token=')
  })

  test('avatar metadata for missing upload -> 404', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/mentors/${mentorId}/avatar`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ fileName: 'ghost.jpg', path: `${mentorId}/ghost.jpg` })
      })
    )
    expect(res.status).toBe(404)
  })

  test('replacing avatar deletes the old file from the bucket', async () => {
    const setup = async (fileName: string) => {
      const avUrl = await app.handle(
        new Request(`http://localhost/api/mentors/${mentorId}/avatar-url`, {
          method: 'POST',
          headers: adminHeaders(),
          body: JSON.stringify({ fileName })
        })
      )
      const { uploadUrl, path } = await avUrl.json()
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: new TextEncoder().encode('bytes') })
      const meta = await app.handle(
        new Request(`http://localhost/api/mentors/${mentorId}/avatar`, {
          method: 'POST',
          headers: adminHeaders(),
          body: JSON.stringify({ fileName, path })
        })
      )
      expect(meta.status).toBe(200)
    }

    await setup('first.jpg')
    await setup('second.jpg')

    const { data } = await getSupabase().storage.from('avatars').list(mentorId)
    const names = (data ?? []).map((f) => f.name)
    expect(names).toContain('second.jpg')
    expect(names).not.toContain('first.jpg')
  })

  test('admin deletes mentor -> 200', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/mentors/${mentorId}`, {
        method: 'DELETE',
        headers: adminHeaders()
      })
    )
    expect(res.status).toBe(200)
  })

  test('no token -> 401', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Mentor Test C' })
      })
    )
    expect(res.status).toBe(401)
  })

  test('delete nonexistent -> 404', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/mentors/000000000000000000000001', {
        method: 'DELETE',
        headers: adminHeaders()
      })
    )
    expect(res.status).toBe(404)
  })
})
