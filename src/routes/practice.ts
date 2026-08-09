import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { PracticeExercise, PracticeSubmission } from '../models/Practice'
import { getConfig } from '../config'

export const practiceRoutes = new Elysia({ prefix: '/api/practice' })
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
  .get(
    '/exercises',
    async ({ query }) => {
      const filter: any = {}
      if (query.type) filter.type = query.type
      
      const exercises = await PracticeExercise.find(filter).limit(10)
      return { success: true, exercises: exercises.map(ex => ({
        id: String(ex._id),
        type: ex.type,
        prompt: ex.prompt,
        content: ex.content
      }))}
    },
    {
      query: t.Object({
        type: t.Optional(t.String())
      }),
      response: t.Object({
        success: t.Boolean(),
        exercises: t.Array(t.Object({
          id: t.String(),
          type: t.String(),
          prompt: t.String(),
          content: t.Optional(t.String())
        }))
      })
    }
  )
  .post(
    '/evaluate',
    async ({ body, userId, set }) => {
      if (!isValidObjectId(body.exerciseId)) {
        set.status = 400
        throw new Error('Invalid exercise id')
      }

      // Mock AI Evaluation
      const score = Math.round(Math.random() * 50 + 50)
      const feedback = `Your answer was evaluated successfully. You scored ${score}/100. Keep practicing to improve.`

      const submission = await PracticeSubmission.create({
        userId,
        exerciseId: body.exerciseId,
        answer: body.answer,
        score,
        feedback
      })

      return {
        success: true,
        submission: {
          id: String(submission._id),
          exerciseId: String(submission.exerciseId),
          answer: submission.answer,
          score: submission.score,
          feedback: submission.feedback
        }
      }
    },
    {
      body: t.Object({
        exerciseId: t.String(),
        answer: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        submission: t.Object({
          id: t.String(),
          exerciseId: t.String(),
          answer: t.String(),
          score: t.Number(),
          feedback: t.String()
        })
      })
    }
  )
