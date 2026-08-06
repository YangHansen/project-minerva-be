import { expect, test, describe, beforeAll, afterAll } from 'bun:test'
import { app } from '../src/index'
import { User } from '../src/models/User'
import { Mentor } from '../src/models/Mentor'
import { Booking } from '../src/models/Mentor'
import { Transaction } from '../src/models/Transaction'

describe('Economy Resilience Tests', () => {
  let userToken: string
  let userId: string
  let mentorId: string
  const testEmail = 'economyuser@example.com'
  const futureDate = new Date(Date.now() + 86400 * 1000 * 7) // 7 days in future

  beforeAll(async () => {
    // Cleanup
    await User.deleteOne({ email: testEmail })
    
    // Create user with exactly 10 tokens
    const user = await User.create({
      email: testEmail,
      password: await Bun.password.hash('Password123!'),
      tokenBalance: 10
    })
    userId = String(user._id)

    // Login to get token
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-forwarded-for': 'economy-test'
        },
        body: JSON.stringify({ email: testEmail, password: 'Password123!' })
      })
    )
    const data = await res.json()
    userToken = data.token

    // Create a mock Mentor that is available for the future date
    // Make them available on all days to ensure the test passes regardless of the current day
    const mentor = await Mentor.create({
      name: 'Test Mentor',
      specialization: ['Computer Science'],
      expertise: ['AI'],
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      availableTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
      priceInTokens: 10
    })
    mentorId = String(mentor._id)
    
    // Hardcode the future time slot to one of the available times
    futureDate.setUTCHours(10, 0, 0, 0) // 10:00 UTC
  })

  afterAll(async () => {
    await User.deleteOne({ email: testEmail })
    await Mentor.deleteOne({ _id: mentorId })
    await Booking.deleteMany({ mentorId })
    await Transaction.deleteMany({ userId })
  })

  test('Race Condition (Double-Spending): booking slot 10 times', async () => {
    // We mock mentor's isSlotAvailable if needed, but our mentor is available every day at 10:00 UTC.
    // The main test is the atomic transaction on User tokenBalance.
    
    const requests = Array.from({ length: 10 }).map(() => {
      return app.handle(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            mentorId,
            dateTime: futureDate.toISOString()
          })
        })
      )
    })

    const responses = await Promise.all(requests)
    
    let successCount = 0
    let failureCount = 0
    
    for (const res of responses) {
      if (res.status === 201) successCount++
      else failureCount++
    }
    
    const updatedUser = await User.findById(userId)
    
    // Only 1 should succeed
    expect(successCount).toBe(1)
    expect(failureCount).toBe(9)
    
    // Token balance should drop from 10 to 0, not -90
    expect(updatedUser?.tokenBalance).toBe(0)
    
    // Only 1 booking should be created
    const bookings = await Booking.find({ mentorId, dateTime: futureDate })
    expect(bookings.length).toBe(1)
  })
})
