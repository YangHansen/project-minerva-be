import { Elysia, t } from 'elysia'
import { requireAuth } from '../../auth/session'
import { requireDatabase } from '../../db/mongo'
import { AppError, assertFound } from '../../lib/errors'
import { IELTSExercise, IELTSSubmission } from '../../models'
import { scoreAnswers } from './scoring'

type IeltsSection = 'reading' | 'listening' | 'writing' | 'speaking'

type IeltsExercise = {
  id: string
  section: IeltsSection
  title: string
  content: string
  audioUrl: string | null
  order: number
  questions: Array<{ questionText: string; type: 'gap-fill' | 'mcq' | 'matching'; options: string[] }>
}

type IeltsSubmissionResult = {
  id: string
  exerciseId: string
  section: IeltsSection
  score: number
  totalQuestions: number
}

function exerciseJson(exercise: Record<string, any>): IeltsExercise {
  return {
    id: String(exercise._id),
    section: exercise.section,
    title: exercise.title,
    content: exercise.content,
    audioUrl: exercise.audioUrl || null,
    order: exercise.order,
    questions: (exercise.questions || []).map((question: Record<string, any>) => ({
      questionText: question.questionText,
      type: question.type || 'gap-fill',
      options: question.options || [],
    })),
  }
}

export const ieltsRoutes = new Elysia({ name: 'ielts-routes' })
  .get('/api/ielts/sets/:setNumber', async ({ request, params }) => {
    requireDatabase()
    await requireAuth(request)
    const setNumber = Number(params.setNumber)
    if (!Number.isInteger(setNumber) || setNumber < 1) {
      throw new AppError(400, 'INVALID_SET', 'Test set must be a positive integer')
    }
    const exercises = await IELTSExercise.find({ setNumber }).sort({ order: 1 }).lean()
    if (!exercises.length) throw new AppError(404, 'NOT_FOUND', 'Test set not found')
    return { set: { setNumber, exercises: exercises.map(exerciseJson) } }
  })
  .post(
    '/api/ielts/sets/:setNumber/submissions',
    async ({ request, params, body, set }) => {
      requireDatabase()
      const { userId } = await requireAuth(request)
      const setNumber = Number(params.setNumber)
      if (!Number.isInteger(setNumber) || setNumber < 1) {
        throw new AppError(400, 'INVALID_SET', 'Test set must be a positive integer')
      }
      const submissions = await Promise.all(
        body.exercises.map(async ({ exerciseId, answers }) => {
          const exercise = await IELTSExercise.findById(exerciseId).lean() as Record<string, any> | null
          assertFound(exercise, 'Exercise not found')
          const { score, totalQuestions } = scoreAnswers(exercise.questions || [], answers)
          const record = await IELTSSubmission.create({
            userId,
            exerciseId,
            section: exercise.section,
            answers,
            score,
            totalQuestions,
          })
          const submission: IeltsSubmissionResult = {
            id: String(record._id),
            exerciseId,
            section: exercise.section,
            score,
            totalQuestions,
          }
          return submission
        }),
      )
      set.status = 201
      return { submissions }
    },
    {
      body: t.Object({
        exercises: t.Array(
          t.Object({
            exerciseId: t.String({ minLength: 1 }),
            answers: t.Array(t.Union([t.String(), t.Number()])),
          }),
        ),
      }),
    },
  )
  .get(
    '/api/ielts/submissions',
    async ({ request, query }) => {
      requireDatabase()
      const { userId } = await requireAuth(request)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 30))
      const items = await IELTSSubmission.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean()
      return {
        submissions: items.map((item) => ({
          id: String(item._id),
          exerciseId: String(item.exerciseId),
          section: item.section,
          score: item.score,
          totalQuestions: item.totalQuestions,
          createdAt: item.createdAt,
        })),
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String({ pattern: '^\\d+$' })),
      }),
    },
  )
