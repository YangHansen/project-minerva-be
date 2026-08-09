import { Elysia, t } from 'elysia'
import { requireAuth } from '../../../auth/session'
import { AppError } from '../../../lib/errors'
import { InterviewSession, toStoredMetadata } from '../models'
import { runPaidAiOperation } from '../paid-operation'
import { recordCompletedUsage, recordFailedUsage } from '../usage'
import {
  resolveScholarship,
  throwRouteError,
  validateAudio,
  type AiRouteDependencies,
} from './shared'

const withoutMetadata = <T extends { metadata: unknown }>(value: T): Omit<T, 'metadata'> => {
  const { metadata: _metadata, ...result } = value
  return result
}

type QuestionLike = {
  _id: unknown
  text: string
  focus: string
  position: number
}

type EvaluationLike = {
  relevance: number
  clarity: number
  structure: number
  specificity: number
  scholarshipAlignment: number
  highlights: string[]
  improvements: string[]
  strongerAnswerExample: string
}

type AnswerLike = {
  questionId: unknown
  durationSeconds: number
  transcript: { text: string; chunks: Array<{ timestamp: number[]; text: string }>; language?: string }
  evaluation: EvaluationLike
  createdAt: Date
}

const average = (values: number[]): number =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0

const aggregateAnswers = (answers: AnswerLike[]) => {
  if (!answers.length) throw new AppError(409, 'NO_INTERVIEW_ANSWERS', 'Record at least one answer before completing the interview')
  const relevance = average(answers.map((answer) => answer.evaluation.relevance))
  const clarity = average(answers.map((answer) => answer.evaluation.clarity))
  const structure = average(answers.map((answer) => answer.evaluation.structure))
  const specificity = average(answers.map((answer) => answer.evaluation.specificity))
  const scholarshipAlignment = average(
    answers.map((answer) => answer.evaluation.scholarshipAlignment),
  )
  return {
    overall: average([relevance, clarity, structure, specificity, scholarshipAlignment]),
    relevance,
    clarity,
    structure,
    specificity,
    scholarshipAlignment,
    highlights: [...new Set(answers.flatMap((answer) => answer.evaluation.highlights))].slice(0, 8),
    improvements: [...new Set(answers.flatMap((answer) => answer.evaluation.improvements))].slice(0, 8),
    answeredQuestions: answers.length,
  }
}

export const createInterviewRoutes = ({ getAi }: AiRouteDependencies) =>
  new Elysia({ name: 'minerva-ai-interviews' })
    .post(
      '/api/interviews',
      async ({ request, body, set }) => {
        const { userId } = await requireAuth(request)
        const persisted = await resolveScholarship(body.scholarshipId) as Record<string, unknown> | null
        const scholarshipName = typeof persisted?.name === 'string' ? persisted.name : body.scholarshipName
        const provider = typeof persisted?.provider === 'string' ? persisted.provider : body.provider
        const country = typeof persisted?.country === 'string' ? persisted.country : body.country

        const paidResult = await runPaidAiOperation(userId, () =>
          getAi().generateInterview({
            scholarshipName,
            provider,
            country,
            language: body.language,
            context: body.context,
          }),
        ).catch(async (error) => {
          await recordFailedUsage({
            userId,
            operation: 'interview_questions',
            model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra',
            error,
          })
          return throwRouteError(error)
        })
        const plan = paidResult.value
        await recordCompletedUsage({
          userId,
          operation: 'interview_questions',
          metadata: plan.metadata,
        })
        const session = await InterviewSession.create({
          userId,
          scholarshipId: body.scholarshipId,
          scholarshipName,
          provider,
          country,
          language: body.language,
          context: body.context,
          status: 'active',
          questions: plan.questions.map((question, position) => ({ ...question, position })),
          answers: [],
        })
        set.status = 201
        return {
          sessionId: String(session._id),
          questions: (session.questions as unknown as QuestionLike[])
            .sort((left, right) => left.position - right.position)
            .map((question) => ({ id: String(question._id), text: question.text })),
          tokenBalance: paidResult.tokenBalance,
        }
      },
      {
        body: t.Object({
          scholarshipId: t.String({ minLength: 1, maxLength: 100 }),
          scholarshipName: t.String({ minLength: 1, maxLength: 300 }),
          provider: t.String({ minLength: 1, maxLength: 300 }),
          country: t.String({ minLength: 1, maxLength: 120 }),
          language: t.Union([t.Literal('en'), t.Literal('id')]),
          context: t.Optional(t.String({ maxLength: 12_000 })),
        }),
      },
    )
    .get('/api/interviews/:sessionId', async ({ request, params }) => {
      const { userId } = await requireAuth(request)
      const session = await InterviewSession.findOne({ _id: params.sessionId, userId }).lean()
      if (!session) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found')
      const questions = session.questions as unknown as QuestionLike[]
      const answers = session.answers as unknown as AnswerLike[]
      return {
        session: {
          id: String(session._id),
          scholarshipId: session.scholarshipId,
          scholarshipName: session.scholarshipName,
          provider: session.provider,
          country: session.country,
          language: session.language,
          status: session.status,
          questions: questions
            .sort((left, right) => left.position - right.position)
            .map((question) => ({ id: String(question._id), text: question.text, focus: question.focus })),
          answers: answers.map((answer) => ({
            questionId: String(answer.questionId),
            durationSeconds: answer.durationSeconds,
            transcript: answer.transcript,
            evaluation: answer.evaluation,
            createdAt: answer.createdAt,
          })),
          aggregate: session.aggregate,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
        },
      }
    })
    .post(
      '/api/interviews/:sessionId/answers',
      async ({ request, params, body, set }) => {
        const { userId } = await requireAuth(request)
        const session = await InterviewSession.findOne({ _id: params.sessionId, userId })
        if (!session) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found')
        if (session.status !== 'active') {
          throw new AppError(409, 'INTERVIEW_COMPLETED', 'This interview has already been completed')
        }
        validateAudio(body.audio)

        const questions = session.questions as unknown as QuestionLike[]
        const question = questions.find((item) => String(item._id) === body.questionId)
        if (!question) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Interview question not found')
        const answers = session.answers as unknown as AnswerLike[]
        if (answers.some((answer) => String(answer.questionId) === body.questionId)) {
          throw new AppError(409, 'ANSWER_ALREADY_SUBMITTED', 'An answer has already been submitted for this question')
        }

        const paidResult = await runPaidAiOperation(userId, async () => {
          const transcript = await getAi().transcribe({
            audio: body.audio,
            filename: body.audio.name || 'interview-answer.webm',
            language: session.language === 'en' ? 'english' : undefined,
            returnTimestamps: 'word',
          }).catch(async (error) => {
            await recordFailedUsage({
              userId,
              operation: 'transcription',
              model: process.env.ELICE_WHISPER_MODEL || 'whisper-large-v3',
              error,
              audioSeconds: body.durationSeconds,
            })
            throw error
          })
          await recordCompletedUsage({
            userId,
            operation: 'transcription',
            metadata: transcript.metadata,
            audioSeconds: body.durationSeconds,
          })

          const evaluation = await getAi().evaluateInterviewAnswer({
            scholarshipName: session.scholarshipName,
            provider: session.provider,
            question: question.text,
            transcript: transcript.text,
            durationSeconds: body.durationSeconds,
            language: session.language,
          }).catch(async (error) => {
            await recordFailedUsage({
              userId,
              operation: 'interview_answer',
              model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra',
              error,
              audioSeconds: body.durationSeconds,
            })
            throw error
          })
          await recordCompletedUsage({
            userId,
            operation: 'interview_answer',
            metadata: evaluation.metadata,
            audioSeconds: body.durationSeconds,
          })
          return { transcript, evaluation }
        }).catch((error) => throwRouteError(error))
        const { transcript, evaluation } = paidResult.value

        session.answers.push({
          questionId: question._id,
          durationSeconds: body.durationSeconds,
          transcript: {
            text: transcript.text,
            chunks: transcript.chunks,
            language: transcript.language,
          },
          evaluation: withoutMetadata(evaluation),
          transcriptionMetadata: toStoredMetadata(transcript.metadata),
          evaluationMetadata: toStoredMetadata(evaluation.metadata),
          createdAt: new Date(),
        })
        await session.save()
        set.status = 201
        return {
          transcript: {
            text: transcript.text,
            chunks: transcript.chunks,
            language: transcript.language,
          },
          evaluation: withoutMetadata(evaluation),
          tokenBalance: paidResult.tokenBalance,
        }
      },
      {
        body: t.Object({
          questionId: t.String({ minLength: 1, maxLength: 100 }),
          audio: t.File(),
          durationSeconds: t.Numeric({ minimum: 1, maximum: 1_800 }),
        }),
      },
    )
    .post('/api/interviews/:sessionId/complete', async ({ request, params }) => {
      const { userId } = await requireAuth(request)
      const session = await InterviewSession.findOne({ _id: params.sessionId, userId })
      if (!session) throw new AppError(404, 'INTERVIEW_NOT_FOUND', 'Interview session not found')
      if (session.status === 'completed' && session.aggregate) return { aggregate: session.aggregate }

      const aggregate = aggregateAnswers(session.answers as unknown as AnswerLike[])
      session.aggregate = aggregate
      session.status = 'completed'
      session.completedAt = new Date()
      await session.save()
      return { aggregate }
    })
