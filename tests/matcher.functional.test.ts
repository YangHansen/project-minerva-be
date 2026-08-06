import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { UserProfile } from '../src/models/UserProfile'
import { Scholarship } from '../src/models/Scholarship'

describe('Matcher Functional Tests', () => {
  let userToken: string
  const testEmail = 'matcher@example.com'
  let scholarshipId: string

  beforeAll(async () => {
    await User.deleteOne({ email: testEmail })
    const user = await User.create({ email: testEmail, password: await Bun.password.hash('Password123!') })
    
    // Create Profile with 3.0 GPA and 6.0 IELTS
    await UserProfile.create({
      userId: user._id,
      name: 'Matcher Test',
      targetEducationLevel: "Master's",
      fieldOfStudy: 'Computer Science',
      gpa: 3.0,
      ieltsScore: 6.0
    })

    // Create Mock Scholarship requiring 3.5 GPA and 7.0 IELTS
    const scholarship = await Scholarship.create({
      name: 'High Achievers Tech Scholarship',
      provider: 'Tech Foundation',
      country: 'South Korea',
      university: 'Seoul National University',
      program: 'Master of Computer Science',
      educationLevel: "Master's",
      fieldOfStudy: 'Computer Science',
      fundingType: 'fully_funded',
      submissionMethod: 'online',
      deadline: new Date(Date.now() + 86400 * 1000 * 30).toISOString(),
      minGpa: 3.5,
      minIeltsScore: 7.0
    })
    scholarshipId = String(scholarship._id)

    // Login
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': 'matcher-test'
        },
        body: JSON.stringify({ email: testEmail, password: 'Password123!' })
      })
    )
    const data = await res.json()
    userToken = data.token
  })

  afterAll(async () => {
    await User.deleteOne({ email: testEmail })
    await UserProfile.deleteOne({ name: 'Matcher Test' })
    await Scholarship.deleteOne({ _id: scholarshipId })
  })

  test('Heuristic Matcher Accuracy: flags as ineligible due to low GPA/IELTS', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/scholarships/recommendations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      })
    )
    
    const data = await res.json()
    expect(data.success).toBe(true)
    
    // We expect the 'High Achievers Tech Scholarship' to be completely filtered out
    // because its matchScore would be heavily penalized (< 0) by our rankByPreference logic
    const found = data.recommendations.find((r: any) => String(r.scholarship.id) === scholarshipId)
    expect(found).toBeUndefined()
  })
})
