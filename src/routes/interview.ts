import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { InterviewQuestion, InterviewResult } from '../models/Interview'
import { getConfig } from '../config'

export const interviewRoutes = new Elysia({ prefix: '/api/prep/interview' })
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
    '/questions',
    async ({ query }) => {
      const filter: any = {}
      if (query.scholarshipId) filter.scholarshipId = query.scholarshipId
      const questions = await InterviewQuestion.find(filter).limit(10)
      return { success: true, questions: questions.map(q => ({
        id: String(q._id),
        category: q.category,
        scholarshipId: q.scholarshipId ? String(q.scholarshipId) : undefined,
        questionText: q.questionText
      }))}
    },
    {
      query: t.Object({
        scholarshipId: t.Optional(t.String())
      }),
      response: t.Object({
        success: t.Boolean(),
        questions: t.Array(t.Object({
          id: t.String(),
          category: t.String(),
          scholarshipId: t.Optional(t.String()),
          questionText: t.String()
        }))
      })
    }
  )
  .post(
    '/analyze',
    async ({ body, set }) => {
      if (!isValidObjectId(body.sessionId)) {
        set.status = 400
        throw new Error('Invalid session id')
      }

      // Mock AI Evaluation
      const mockedResult = {
        metrics: { clarity: 85, pace: 78, engagement: 82 },
        feedback: {
          highlights: ['Good clarity in the first response', 'Strong closing statement'],
          improvements: ['Pace was a bit fast', 'Could improve engagement by maintaining steady structure']
        }
      }

      const result = await InterviewResult.create({
        sessionId: body.sessionId,
        metrics: mockedResult.metrics,
        feedback: mockedResult.feedback
      })

      return {
        success: true,
        result: {
          id: String(result._id),
          sessionId: String(result.sessionId),
          metrics: result.metrics,
          feedback: result.feedback
        }
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        transcript: t.Array(t.Object({
          role: t.String(),
          message: t.String()
        }))
      }),
      response: t.Object({
        success: t.Boolean(),
        result: t.Object({
          id: t.String(),
          sessionId: t.String(),
          metrics: t.Object({
            clarity: t.Number(),
            pace: t.Number(),
            engagement: t.Number()
          }),
          feedback: t.Object({
            highlights: t.Array(t.String()),
            improvements: t.Array(t.String())
          })
        })
      })
    }
  )
