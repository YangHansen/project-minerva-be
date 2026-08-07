import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { Scholarship } from '../src/models/Scholarship'
import { Shortlist } from '../src/models/Shortlist'

describe('Scholarships and Shortlists API Tests', () => {
  let userAToken: string
  let userAId: string
  let testScholarshipId: string

  const userAEmail = 'test_student@example.com'

  beforeAll(async () => {
    // 1. Setup User and Token
    await User.deleteMany({ email: userAEmail })
    const userA = await User.create({ email: userAEmail, password: await Bun.password.hash('Password123!') })
    userAId = String(userA._id)

    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': 'api-test' },
        body: JSON.stringify({ email: userAEmail, password: 'Password123!' })
      })
    )
    const data = await res.json()
    userAToken = data.token

    // 2. Clean up previous test data
    await Scholarship.deleteMany({ name: 'Test Scholarship 101' })
    await Shortlist.deleteMany({ userId: userAId })

    // 3. Create mock scholarship
    const sch = await Scholarship.create({
      name: 'Test Scholarship 101',
      provider: 'Test Provider',
      country: 'United Kingdom',
      university: 'Oxford',
      program: 'Master',
      fieldOfStudy: 'Computer Science',
      fundingType: 'fully_funded',
      deadline: new Date('2027-12-31'),
      requiredDocuments: ['cv', 'essay'],
      submissionMethod: 'online'
    })
    testScholarshipId = String(sch._id)
  })

  afterAll(async () => {
    await User.deleteMany({ email: userAEmail })
    await Scholarship.deleteMany({ _id: testScholarshipId })
    await Shortlist.deleteMany({ userId: userAId })
  })

  test('GET /api/scholarships returns catalog', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/scholarships', {
        headers: { 'Authorization': `Bearer ${userAToken}` }
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.scholarships)).toBe(true)
    const found = data.scholarships.find((s: any) => s.id === testScholarshipId)
    expect(found).toBeDefined()
    expect(found.name).toBe('Test Scholarship 101')
  })

  test('GET /api/scholarships/recommendations handles missing profile gracefully', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/scholarships/recommendations', {
        headers: { 'Authorization': `Bearer ${userAToken}` }
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.recommendations).toEqual([]) 
  })

  test('POST /api/shortlists creates shortlist correctly', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/shortlists', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scholarshipId: testScholarshipId })
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.shortlist).toBeDefined()
    expect(data.shortlist.scholarshipId).toBe(testScholarshipId)
    expect(data.shortlist.items.length).toBe(2) // cv and essay
    expect(data.shortlist.items[0].itemType).toBe('cv')
  })

  test('GET /api/shortlists returns shortlists with progress', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/shortlists', {
        headers: { 'Authorization': `Bearer ${userAToken}` }
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.shortlists.length).toBeGreaterThan(0)
    const sl = data.shortlists.find((s: any) => s.scholarshipId === testScholarshipId)
    expect(sl).toBeDefined()
    expect(sl.scholarshipName).toBe('Test Scholarship 101')
    expect(sl.progress.total).toBe(2)
  })

  test('DELETE /api/shortlists/:scholarshipId removes shortlist', async () => {
    const res = await app.handle(
      new Request(`http://localhost/api/shortlists/${testScholarshipId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userAToken}` }
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toBe('Shortlist removed successfully')
  })
})
