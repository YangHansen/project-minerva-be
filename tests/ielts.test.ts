import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { UserProfile } from '../src/models/UserProfile'
import { IeltsResult } from '../src/models/IELTS'

describe('IELTS API Tests', () => {
  let userAToken: string
  let userAId: string

  const userAEmail = 'ielts_test_student@example.com'

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

    // Create an initial user profile with a low score
    await UserProfile.deleteMany({ userId: userAId })
    await UserProfile.create({
      userId: userAId,
      name: 'IELTS Student',
      ieltsScore: 5.0
    })

    await IeltsResult.deleteMany({ userId: userAId })
  })

  afterAll(async () => {
    await User.deleteMany({ email: userAEmail })
    await UserProfile.deleteMany({ userId: userAId })
    await IeltsResult.deleteMany({ userId: userAId })
  })

  test('POST /api/ielts/submit rejects invalid scores', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/ielts/submit', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listeningScore: 10, // Invalid > 9
          readingScore: 6.5,
          writingScore: 6.0,
          speakingScore: 6.5,
          overallBand: 7.0
        })
      })
    )
    expect(res.status).toBe(422) // Validation error
  })

  test('POST /api/ielts/submit creates result and updates max score', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/ielts/submit', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listeningScore: 7.5,
          readingScore: 8.0,
          writingScore: 6.5,
          speakingScore: 7.0,
          overallBand: 7.5
        })
      })
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.resultId).toBeDefined()

    // Verify profile score was updated (5.0 -> 7.5)
    const profile = await UserProfile.findOne({ userId: userAId })
    expect(profile?.ieltsScore).toBe(7.5)
  })

  test('POST /api/ielts/submit respects $max operator (does not lower score)', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/ielts/submit', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${userAToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listeningScore: 6.0,
          readingScore: 6.0,
          writingScore: 6.0,
          speakingScore: 6.0,
          overallBand: 6.0
        })
      })
    )
    expect(res.status).toBe(201)

    // Verify profile score remains 7.5
    const profile = await UserProfile.findOne({ userId: userAId })
    expect(profile?.ieltsScore).toBe(7.5)
  })

  test('GET /api/ielts/results fetches user history correctly', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/ielts/results', {
        headers: { 'Authorization': `Bearer ${userAToken}` }
      })
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBe(2) // We submitted two results
    // Results are sorted by newest first, so the first one should be the 6.0 overall band
    expect(data.results[0].overallBand).toBe(6.0)
    expect(data.results[1].overallBand).toBe(7.5)
  })
})
