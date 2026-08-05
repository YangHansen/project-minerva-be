import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { Mentor, Booking } from '../models/Mentor'
import { User } from '../models/User'
import { Transaction } from '../models/Transaction'
import { isSlotAvailable } from '../lib/mentor'
import { getConfig } from '../config'

const protectedDetail = {
  tags: ['Mentors'],
  security: [{ bearerAuth: [] }]
}

export const bookingRoutes = new Elysia({ prefix: '/api/bookings' })
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

  // ── POST /api/bookings ───────────────────────────────────────────────────────
  .post(
    '/',
    async ({ body, userId, set }) => {
      // 1. Guard: invalid mentorId format
      if (!isValidObjectId(body.mentorId)) {
        set.status = 400
        throw new Error('Invalid mentor id.')
      }

      // 2. Guard: mentor not found
      const mentor = await Mentor.findById(body.mentorId)
      if (!mentor) {
        set.status = 404
        throw new Error('Mentor not found.')
      }

      // 3. Guard: unparseable dateTime
      const date = new Date(body.dateTime)
      if (isNaN(date.getTime())) {
        set.status = 422
        throw new Error('Invalid date and time format.')
      }

      // 4. Guard: past dateTime
      if (date.getTime() <= Date.now()) {
        set.status = 422
        throw new Error('Booking time must be in the future.')
      }

      // 5. Guard: slot not in mentor availability
      if (!isSlotAvailable(mentor.availableDays, mentor.availableTimeSlots, date)) {
        set.status = 422
        throw new Error('The selected slot is not available for this mentor.')
      }

      // 6. Guard: slot already booked (pre-check)
      const existingBooking = await Booking.findOne({ mentorId: mentor._id, dateTime: date })
      if (existingBooking) {
        set.status = 409
        throw new Error('This slot is already booked. Please choose another time.')
      }

      const price = mentor.priceInTokens ?? 10

      // 7. Atomic token debit
      const user = await User.findOneAndUpdate(
        { _id: userId, tokenBalance: { $gte: price } },
        { $inc: { tokenBalance: -price } },
        { new: true }
      )
      if (!user) {
        set.status = 402
        throw new Error('You do not have enough tokens for this booking. Please top up first.')
      }

      // 8. Create booking (E11000 race guard -> refund)
      let booking
      try {
        booking = await Booking.create({
          userId,
          mentorId: mentor._id,
          dateTime: date,
          status: 'approved',
          tokensCharged: price
        })
      } catch (err: unknown) {
        // Refund tokens on failure
        await User.updateOne({ _id: userId }, { $inc: { tokenBalance: price } })

        const isDuplicate = typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000
        if (isDuplicate) {
          set.status = 409
          throw new Error('This slot is already booked. Please choose another time.')
        }
        throw err
      }

      // 9. Record transaction
      await Transaction.create({
        userId,
        amount: -price,
        type: 'mentor_booking'
      })

      set.status = 201
      return {
        success: true,
        message: 'Mentor booking request submitted.',
        bookingId: String(booking._id),
        remainingTokens: user.tokenBalance
      }
    },
    {
      body: t.Object({
        mentorId: t.String(),
        dateTime: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        bookingId: t.String(),
        remainingTokens: t.Number()
      }),
      detail: {
        ...protectedDetail,
        summary: 'Request booking mentor',
        description: 'Membuat janji bimbingan dengan mentor, memotong saldo token secara eksplisit dan atomik, dan menandai status booking sebagai approved.'
      }
    }
  )

  // ── GET /api/bookings ────────────────────────────────────────────────────────
  .get(
    '/',
    async ({ userId }) => {
      const bookings = await Booking.find({ userId }).sort({ createdAt: -1 })

      const mentorIds = bookings.map((b) => b.mentorId)
      const mentors = await Mentor.find({ _id: { $in: mentorIds } })
      const mentorMap = new Map(mentors.map((m) => [String(m._id), m]))

      return {
        success: true,
        bookings: bookings.map((b) => {
          const m = mentorMap.get(String(b.mentorId))
          return {
            id: String(b._id),
            mentorId: String(b.mentorId),
            mentorName: m?.name ?? 'Unknown',
            avatarUrl: m?.avatarUrl ?? null,
            dateTime: b.dateTime.toISOString(),
            status: b.status,
            tokensCharged: b.tokensCharged,
            createdAt: b.createdAt.toISOString()
          }
        })
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        bookings: t.Array(
          t.Object({
            id: t.String(),
            mentorId: t.String(),
            mentorName: t.String(),
            avatarUrl: t.Nullable(t.String()),
            dateTime: t.String(),
            status: t.String(),
            tokensCharged: t.Number(),
            createdAt: t.String()
          })
        )
      }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil riwayat booking mentor',
        description: 'Mengembalikan riwayat janji bimbingan pengguna yang diurutkan dari yang terbaru, disertai informasi nama dan avatar mentor.'
      }
    }
  )
