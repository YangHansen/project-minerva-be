import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { IELTSExercise, IELTSSubmission } from '../models/IELTS'
import { UserProfile } from '../models/UserProfile'
import { gradeAnswers, toBandScore } from '../lib/ielts'
import { getConfig } from '../config'

const protectedDetail = {
  tags: ['IELTS'],
  security: [{ bearerAuth: [] }]
}

export const ieltsRoutes = new Elysia({ prefix: '/api/ielts' })
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

  // ── GET /api/ielts/exercises ─────────────────────────────────────────────────
  .get(
    '/exercises',
    async () => {
      const exercises = await IELTSExercise.find(
        {},
        { section: 1, title: 1 }   // project only list fields
      ).sort({ section: 1, title: 1 })

      return {
        success: true,
        exercises: exercises.map((ex) => ({
          id: String(ex._id),
          section: ex.section,
          title: ex.title
        }))
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        exercises: t.Array(
          t.Object({
            id: t.String(),
            section: t.String(),
            title: t.String()
          })
        )
      }),
      detail: {
        ...protectedDetail,
        summary: 'Ambil daftar latihan IELTS',
        description: 'Mengembalikan semua latihan IELTS diurutkan per section lalu judul. Kunci jawaban tidak disertakan.'
      }
    }
  )

  // ── GET /api/ielts/exercises/:id ─────────────────────────────────────────────
  .get(
    '/exercises/:id',
    async ({ params, set }) => {
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid exercise id')
      }

      const ex = await IELTSExercise.findById(params.id)
      if (!ex) {
        set.status = 404
        throw new Error('Exercise not found')
      }

      return {
        success: true,
        exercise: {
          id: String(ex._id),
          section: ex.section,
          title: ex.title,
          content: ex.content,
          // Strip correctAnswer and explanation — spec §API
          questions: ex.questions.map((q: { questionText: string; options: string[] }) => ({
            questionText: q.questionText,
            options: q.options
          }))
        }
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        exercise: t.Object({
          id: t.String(),
          section: t.String(),
          title: t.String(),
          content: t.String(),
          questions: t.Array(
            t.Object({
              questionText: t.String(),
              options: t.Array(t.String())
            })
          )
        })
      }),
      detail: {
        ...protectedDetail,
        summary: 'Detail soal latihan IELTS',
        description: 'Mengembalikan konten dan daftar soal latihan. Kunci jawaban dan penjelasan tidak disertakan.'
      }
    }
  )

  // ── POST /api/ielts/exercises/:id/submit ─────────────────────────────────────
  .post(
    '/exercises/:id/submit',
    async ({ params, body, userId, set }) => {
      if (!isValidObjectId(params.id)) {
        set.status = 400
        throw new Error('Invalid exercise id')
      }

      const ex = await IELTSExercise.findById(params.id)
      if (!ex) {
        set.status = 404
        throw new Error('Exercise not found')
      }

      const { score, results } = gradeAnswers(ex.questions as Array<{ correctAnswer: number; explanation?: string | null }>, body.answers)
      const totalQuestions = ex.questions.length
      const band = toBandScore(score, totalQuestions)

      // Persist submission
      await IELTSSubmission.create({
        userId,
        exerciseId: ex._id,
        answers: body.answers,
        score,
        totalQuestions
      })

      // Update user best band score ($max — only raises, never lowers)
      await UserProfile.updateOne({ userId }, { $max: { ieltsScore: band } })

      return {
        success: true,
        score,
        totalQuestions,
        bandScore: band,
        results
      }
    },
    {
      body: t.Object({
        answers: t.Array(t.Number())
      }),
      response: t.Object({
        success: t.Boolean(),
        score: t.Number(),
        totalQuestions: t.Number(),
        bandScore: t.Number(),
        results: t.Array(
          t.Object({
            questionIndex: t.Number(),
            isCorrect: t.Boolean(),
            correctAnswer: t.Number(),
            explanation: t.Nullable(t.String())
          })
        )
      }),
      detail: {
        ...protectedDetail,
        summary: 'Submit jawaban latihan IELTS',
        description: 'Menilai jawaban secara otomatis, menyimpan IELTSSubmission, dan memperbarui ieltsScore terbaik di profil pengguna. Pengiriman ulang diperbolehkan.'
      }
    }
  )
