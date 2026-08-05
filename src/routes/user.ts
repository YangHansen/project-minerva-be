import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { User } from '../models/User'
import { UserProfile } from '../models/UserProfile'
// ponytail: aggregation imports, uncomment with the dashboard aggregation below
// import { Shortlist } from '../models/Shortlist'
// import { AIReview } from '../models/AIReview'
// import { IELTSSubmission } from '../models/IELTS'
// import { Booking, Mentor } from '../models/Mentor'
// import { Scholarship } from '../models/Scholarship'
import { getConfig } from '../config'

const onboardingFields = {
  name: t.String({ minLength: 1 }),
  age: t.Optional(t.Number({ minimum: 0, maximum: 120 })),
  country: t.Optional(t.String()),
  destinationCountry: t.Optional(t.String()),
  currentEducationLevel: t.Optional(t.String()),
  targetEducationLevel: t.Optional(t.Union([t.Literal("Master's"), t.Literal('Doctoral')])),
  fieldOfStudy: t.Optional(t.String()),
  gpa: t.Optional(t.Number({ minimum: 0, maximum: 4 })),
  ieltsScore: t.Optional(t.Number({ minimum: 0, maximum: 9 })),
  toeflScore: t.Optional(t.Number({ minimum: 0, maximum: 120 })),
  topikScore: t.Optional(t.Number({ minimum: 0, maximum: 6 })),
  workExperienceYears: t.Optional(t.Number({ minimum: 0 })),
  scholarshipType: t.Optional(t.String()),
  fundingPreference: t.Optional(t.String()),
  enrollmentYear: t.Optional(t.Number({ minimum: 2000, maximum: 2100 })),
  emailNotificationsEnabled: t.Optional(t.Boolean())
}

const messageResponse = t.Object({ success: t.Boolean(), message: t.String() })

const profileResponse = t.Object({
  _id: t.String(),
  userId: t.String(),
  name: t.String(),
  age: t.Optional(t.Nullable(t.Number())),
  country: t.Optional(t.Nullable(t.String())),
  destinationCountry: t.Optional(t.Nullable(t.String())),
  currentEducationLevel: t.Optional(t.Nullable(t.String())),
  targetEducationLevel: t.Optional(t.Nullable(t.String())),
  fieldOfStudy: t.Optional(t.Nullable(t.String())),
  gpa: t.Optional(t.Nullable(t.Number())),
  ieltsScore: t.Optional(t.Nullable(t.Number())),
  toeflScore: t.Optional(t.Nullable(t.Number())),
  topikScore: t.Optional(t.Nullable(t.Number())),
  workExperienceYears: t.Optional(t.Nullable(t.Number())),
  scholarshipType: t.Optional(t.Nullable(t.String())),
  fundingPreference: t.Optional(t.Nullable(t.String())),
  enrollmentYear: t.Optional(t.Nullable(t.Number())),
  emailNotificationsEnabled: t.Optional(t.Nullable(t.Boolean())),
  createdAt: t.String(),
  updatedAt: t.String(),
  __v: t.Number()
})

const dashboardResponse = t.Object({
  success: t.Boolean(),
  data: t.Object({
    tokenBalance: t.Number(),
    profileSummary: t.Nullable(
      t.Object({ name: t.String(), targetEducationLevel: t.Nullable(t.String()) })
    )
  })
})

const protectedDetail = {
  tags: ['User'],
  security: [{ bearerAuth: [] }]
}

export const userRoutes = new Elysia({ prefix: '/api/user' })
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
    '/onboarding',
    async ({ body, userId }) => {
      await UserProfile.findOneAndUpdate(
        { userId },
        { ...body, userId },
        { upsert: true, new: true }
      )
      return { success: true, message: 'Onboarding profile saved successfully' }
    },
    {
      body: t.Object(onboardingFields),
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Simpan atau perbarui profil onboarding',
        description: 'Membuat atau memperbarui profil onboarding pengguna (satu profil per pengguna).'
      }
    }
  )
  .get(
    '/profile',
    async ({ userId, set }) => {
      const profile = await UserProfile.findOne({ userId })
      if (!profile) {
        set.status = 404
        throw new Error('Profile not found.')
      }
      return { success: true, profile: JSON.parse(JSON.stringify(profile)) }
    },
    {
      response: t.Object({ success: t.Boolean(), profile: profileResponse }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil profil onboarding',
        description: 'Mengambil profil onboarding pengguna yang terautentikasi.'
      }
    }
  )
  .put(
    '/profile',
    async ({ body, userId }) => {
      await UserProfile.findOneAndUpdate({ userId }, body)
      return { success: true, message: 'Profile updated successfully' }
    },
    {
      body: t.Object(onboardingFields),
      response: messageResponse,
      detail: {
        ...protectedDetail,
        summary: 'Perbarui profil onboarding',
        description: 'Memperbarui profil onboarding. Kolom yang tidak dikirim tidak diubah.'
      }
    }
  )
  .get(
    '/dashboard',
    async ({ userId }) => {
      const [user, profile] = await Promise.all([User.findById(userId), UserProfile.findOne({ userId })])
      return {
        success: true,
        data: {
          tokenBalance: user?.tokenBalance ?? 0,
          profileSummary: profile ? { name: profile.name, targetEducationLevel: profile.targetEducationLevel } : null
        }
      }
    },
    {
      response: dashboardResponse,
      detail: {
        ...protectedDetail,
        summary: 'Ambil ringkasan dashboard',
        description: 'Mengambil saldo token dan ringkasan profil untuk dashboard pengguna.'
      }
    }
    // ponytail: full aggregation (kept, commented out — re-enable when modules land):
    // const [user, profile, shortlists, submissions, bookings] = await Promise.all([
    //   User.findById(userId),
    //   UserProfile.findOne({ userId }),
    //   Shortlist.find({ userId }),
    //   IELTSSubmission.find({ userId }),
    //   Booking.find({ userId, status: 'approved', dateTime: { $gte: new Date() } }).sort({ dateTime: 1 }).limit(1)
    // ])
    //
    // const scholarshipIds = shortlists.map((s) => String(s.scholarshipId))
    // const scholarships = await Scholarship.find({ _id: { $in: scholarshipIds } })
    // const upcoming = shortlists
    //   .map((s) => {
    //     const sch = scholarships.find((x) => x.id === String(s.scholarshipId))
    //     return sch && sch.deadline > new Date()
    //       ? { scholarshipId: String(s.scholarshipId), name: sch.name, deadline: sch.deadline }
    //       : null
    //   })
    //   .filter(Boolean)
    //   .sort((a, b) => new Date(a!.deadline).getTime() - new Date(b!.deadline).getTime())[0]
    //
    // const selectedScholarshipId = upcoming ? upcoming.scholarshipId : null
    // const selectedShortlist = selectedScholarshipId
    //   ? shortlists.find((s) => String(s.scholarshipId) === selectedScholarshipId)
    //   : null
    // const checklistOfSelected = selectedShortlist?.items ?? []
    // const completed = checklistOfSelected.filter((c) => c.isCompleted).length
    //
    // const avgIelts = submissions.length
    //   ? submissions.reduce((sum, s) => sum + (s.score / s.totalQuestions) * 9, 0) / submissions.length
    //   : 0
    //
    // const nextBooking = bookings[0]
    // const mentor = nextBooking ? await Mentor.findById(nextBooking.mentorId) : null
    //
    // return {
    //   success: true,
    //   data: {
    //     tokenBalance: user?.tokenBalance ?? 0,
    //     profileSummary: profile ? { name: profile.name, targetEducationLevel: profile.targetEducationLevel } : null,
    //     selectedScholarship: upcoming
    //       ? { id: upcoming.scholarshipId, name: upcoming.name, deadline: upcoming.deadline }
    //       : null,
    //     checklistProgress:
    //       checklistOfSelected.length > 0
    //         ? {
    //             completed,
    //             total: checklistOfSelected.length,
    //             percentage: Math.round((completed / checklistOfSelected.length) * 100)
    //           }
    //         : null,
    //     ieltsProgress: submissions.length ? { completedExercises: submissions.length, averageScore: Math.round(avgIelts * 10) / 10 } : null,
    //     nextBooking: nextBooking
    //       ? { mentorName: mentor?.name ?? null, dateTime: nextBooking.dateTime, status: nextBooking.status }
    //       : null
    //   }
    // }
  )
