import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { Scholarship } from '../src/models/Scholarship'
import { Wishlist } from '../src/models/Wishlist'

describe('Wishlist Tests', () => {
  let token: string
  let userId: string
  let scholarshipId: string
  let otherScholarshipId: string

  const email = 'wishlist@example.com'

  beforeAll(async () => {
    await User.deleteMany({ email })
    await Wishlist.deleteMany({})
    await Scholarship.deleteMany({ provider: 'wishlist-test' })

    const user = await User.create({ email, password: await Bun.password.hash('Password123!') })
    userId = String(user._id)

    const login = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'wishlist-test' },
        body: JSON.stringify({ email, password: 'Password123!' })
      })
    )
    token = (await login.json()).token

    const createScholarship = (name: string) =>
      Scholarship.create({
        name,
        provider: 'wishlist-test',
        country: 'Japan',
        university: 'Tokyo University',
        program: 'Master',
        fieldOfStudy: 'Engineering',
        fundingType: 'fully_funded',
        deadline: new Date('2026-12-31'),
        submissionMethod: 'online'
      })

    scholarshipId = String((await createScholarship('Wishlist Test A'))._id)
    otherScholarshipId = String((await createScholarship('Wishlist Test B'))._id)
  })

  afterAll(async () => {
    await User.deleteMany({ email })
    await Wishlist.deleteMany({})
    await Scholarship.deleteMany({ provider: 'wishlist-test' })
  })

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` })

  test('POST adds scholarship to wishlist -> 201', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scholarshipId })
      })
    )
    expect(res.status).toBe(201)
  })

  test('POST duplicate is idempotent -> 200', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scholarshipId })
      })
    )
    expect(res.status).toBe(200)
  })

  test('POST invalid scholarship id -> 400', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scholarshipId: 'not-an-object-id' })
      })
    )
    expect(res.status).toBe(400)
  })

  test('POST nonexistent scholarship -> 404', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scholarshipId: '000000000000000000000001' })
      })
    )
    expect(res.status).toBe(404)
  })

  test('GET lists saved scholarships with joined details', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', { headers: authHeaders() })
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.wishlists).toHaveLength(1)
    expect(data.wishlists[0].scholarship.name).toBe('Wishlist Test A')
    expect(data.wishlists[0].scholarshipId).toBe(scholarshipId)
  })

  test('DELETE removes scholarship -> 200, then GET is empty', async () => {
    const del = await app.handle(
      new Request(`http://localhost/api/wishlists/${scholarshipId}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    )
    expect(del.status).toBe(200)

    const list = await app.handle(
      new Request('http://localhost/api/wishlists', { headers: authHeaders() })
    )
    expect((await list.json()).wishlists).toHaveLength(0)
  })

  test('DELETE nonexistent -> 404', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/wishlists/${scholarshipId}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
    )
    expect(res.status).toBe(404)
  })

  test('catalog reflects isSaved for bookmarked scholarship', async () => {
    await app.handle(
      new Request('http://localhost/api/wishlists', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ scholarshipId })
      })
    )

    const catalog = await app.handle(
      new Request('http://localhost/api/scholarships?search=Wishlist Test', { headers: authHeaders() })
    )
    const data = await catalog.json()
    const saved = data.scholarships.find((s: { name: string }) => s.name === 'Wishlist Test A')
    const unsaved = data.scholarships.find((s: { name: string }) => s.name === 'Wishlist Test B')
    expect(saved.isSaved).toBe(true)
    expect(unsaved.isSaved).toBe(false)
  })

  test('detail reflects isSaved', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/scholarships/${scholarshipId}`, { headers: authHeaders() })
    )
    const data = await res.json()
    expect(data.isSaved).toBe(true)

    const other = await app.handle(
      new Request(`http://localhost/api/scholarships/${otherScholarshipId}`, { headers: authHeaders() })
    )
    expect((await other.json()).isSaved).toBe(false)
  })

  test('no token -> 401', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/wishlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scholarshipId }) })
    )
    expect(res.status).toBe(401)
  })
})
