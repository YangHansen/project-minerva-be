import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'

describe('Auth Security Tests', () => {
  const testEmail = 'hacker@example.com'
  const testPassword = 'Password123!'

  beforeAll(async () => {
    await User.deleteOne({ email: testEmail })
    await User.create({
      email: testEmail,
      password: await Bun.password.hash(testPassword)
    })
  })

  afterAll(async () => {
    await User.deleteOne({ email: testEmail })
  })

  test('NoSQL Injection: login payload', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: { "$gt": "" },
          password: testPassword
        })
      })
    )
    
    // TypeBox validation should catch this and return 422
    expect(res.status).toBe(422)
  })

  test('Brute Force Defense: trigger rate limiter', async () => {
    let lastStatus = 200
    for (let i = 0; i < 20; i++) {
      const res = await app.handle(
        new Request('http://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: 'wrongpassword'
          })
        })
      )
      lastStatus = res.status
    }
    // Expected 429 Too Many Requests after 5 attempts
    expect(lastStatus).toBe(429)
  })

  test('JWT Tampering: send invalid JWT to profile', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token'
        }
      })
    )
    
    expect(res.status).toBe(401)
  })
})
