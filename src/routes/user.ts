import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { User } from '../models/User'
import { UserProfile } from '../models/UserProfile'
// ponytail: aggregation imports, uncomment with the dashboard aggregation below
// import { Shortlist, Checklist } from '../models/Pipeline'
// import { AIReview } from '../models/AIReview'
// import { IELTSSubmission } from '../models/IELTS'
// import { Booking, Mentor } from '../models/Mentor'
// import { Scholarship } from '../models/Scholarship'
import { getConfig } from '../config'

const onboardingFields = {
  name: t.String(),
  age: t.Optional(t.Number()),
  country: t.Optional(t.String()),
  destinationCountry: t.Optional(t.String()),
  currentEducationLevel: t.Optional(t.String()),
  targetEducationLevel: t.Optional(t.Union([t.Literal("Master's"), t.Literal('Doctoral')])),
  fieldOfStudy: t.Optional(t.String()),
  gpa: t.Optional(t.Number()),
  ieltsScore: t.Optional(t.Number()),
  toeflScore: t.Optional(t.Number()),
  topikScore: t.Optional(t.Number()),
  workExperienceYears: t.Optional(t.Number()),
  scholarshipType: t.Optional(t.String()),
  fundingPreference: t.Optional(t.String()),
  enrollmentYear: t.Optional(t.Number()),
  emailNotificationsEnabled: t.Optional(t.Boolean())
}

export const userRoutes = new Elysia({ prefix: '/api/user' })
  .use(jwt({ name: 'jwt', secret: getConfig().jwtSecret }))
  .derive(async ({ headers, jwt, set }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    const verified = token ? await jwt.verify(token) : false
    const sub = verified && typeof verified !== 'boolean' ? verified.sub : null
    if (!sub) {
      set.status = 401
      throw new Error('Unauthorized')
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
    { body: t.Object(onboardingFields) }
  )
  .get('/profile', async ({ userId }) => {
    const profile = await UserProfile.findOne({ userId })
    if (!profile) throw new Error('Profile not found')
    return { success: true, profile }
  })
  .put(
    '/profile',
    async ({ body, userId }) => {
      await UserProfile.findOneAndUpdate({ userId }, body)
      return { success: true, message: 'Profile updated successfully' }
    },
    { body: t.Object(onboardingFields) }
  )
  .get('/dashboard', async ({ userId }) => {
    const [user, profile] = await Promise.all([User.findById(userId), UserProfile.findOne({ userId })])
    return {
      success: true,
      data: {
        tokenBalance: user?.tokenBalance ?? 0,
        profileSummary: profile ? { name: profile.name, targetEducationLevel: profile.targetEducationLevel } : null
      }
    }
    // ponytail: full aggregation (kept, commented out — re-enable when modules land):
    // const [user, profile, shortlists, checklists, reviews, submissions, bookings] = await Promise.all([
    //   User.findById(userId),
    //   UserProfile.findOne({ userId }),
    //   Shortlist.find({ userId }),
    //   Checklist.find({ userId }),
    //   AIReview.find({ userId }).sort({ createdAt: -1 }),
    //   IELTSSubmission.find({ userId }),
    //   Booking.find({ userId, status: 'approved', dateTime: { $gte: new Date() } }).sort({ dateTime: 1 }).limit(1)
    // ])
    //
    // const scholarshipIds = shortlists.map((s) => s.scholarshipId)
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
    // const checklistOfSelected = selectedScholarshipId
    //   ? checklists.filter((c) => String(c.scholarshipId) === selectedScholarshipId)
    //   : []
    // const completed = checklistOfSelected.filter((c) => c.isCompleted).length
    //
    // const cvReview = reviews.find((r) => r.reviewType === 'cv')
    // const essayReview = reviews.find((r) => r.reviewType === 'essay')
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
    //     latestCvReviewScore: cvReview?.score ?? null,
    //     latestEssayReviewScore: essayReview?.score ?? null,
    //     ieltsProgress: submissions.length ? { completedExercises: submissions.length, averageScore: Math.round(avgIelts * 10) / 10 } : null,
    //     nextBooking: nextBooking
    //       ? { mentorName: mentor?.name ?? null, dateTime: nextBooking.dateTime, status: nextBooking.status }
    //       : null
    //   }
    // }
  })
