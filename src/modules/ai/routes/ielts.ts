import { Elysia, t } from 'elysia'
import { requireAuth } from '../../../auth/session'
import { IeltsAiEvaluation, toStoredMetadata } from '../models'
import { runPaidAiOperation } from '../paid-operation'
import { recordCompletedUsage, recordFailedUsage } from '../usage'
import { throwRouteError, validateAudio, type AiRouteDependencies } from './shared'

const withoutMetadata = <T extends { metadata: unknown }>(value: T): Omit<T, 'metadata'> => {
  const { metadata: _metadata, ...result } = value
  return result
}

type EvaluationListItem = {
  _id: unknown
  kind: 'writing' | 'speaking'
  task?: string
  prompt: string
  transcript?: string
  durationSeconds?: number
  result: unknown
  createdAt: Date
}

export const createIeltsAiRoutes = ({ getAi }: AiRouteDependencies) =>
  new Elysia({ name: 'minerva-ai-ielts' })
    .get('/api/ielts/evaluations', async ({ request, query }) => {
      const { userId } = await requireAuth(request)
      const kind = query.kind === 'writing' || query.kind === 'speaking' ? query.kind : undefined
      const evaluations = await IeltsAiEvaluation.find({ userId, ...(kind ? { kind } : {}) })
        .sort({ createdAt: -1 })
        .limit(30)
        .select('kind task prompt transcript durationSeconds result createdAt')
        .lean() as unknown as EvaluationListItem[]
      return {
        evaluations: evaluations.map((evaluation) => ({
          id: String(evaluation._id),
          kind: evaluation.kind,
          task: evaluation.task,
          prompt: evaluation.prompt,
          transcript: evaluation.transcript,
          durationSeconds: evaluation.durationSeconds,
          result: evaluation.result,
          createdAt: evaluation.createdAt,
        })),
      }
    })
    .post(
      '/api/ielts/speaking/turn',
      async ({ request, body, set }) => {
        const { userId } = await requireAuth(request)
        validateAudio(body.audio)
        const paidResult = await runPaidAiOperation(userId, async () => {
          const transcript = await getAi().transcribe({ audio: body.audio, filename: body.audio.name || 'ielts-speaking-turn.webm', language: 'english', returnTimestamps: 'word' })
          const previousTurns = body.history ? JSON.parse(body.history) : []
          const reply = await getAi().replyToIeltsSpeaking({ part: body.part, prompt: body.prompt, transcript: transcript.text, previousTurns: Array.isArray(previousTurns) ? previousTurns.slice(-24) : [] })
          return { transcript, reply }
        }).catch(async (error) => {
          await recordFailedUsage({ userId, operation: 'ielts_speaking', model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra', error, audioSeconds: body.durationSeconds })
          return throwRouteError(error)
        })
        const { transcript, reply } = paidResult.value
        await recordCompletedUsage({ userId, operation: 'ielts_speaking', metadata: reply.metadata, audioSeconds: body.durationSeconds })
        const record = await IeltsAiEvaluation.create({ userId, kind: 'speaking', prompt: body.prompt, transcript: transcript.text, durationSeconds: body.durationSeconds, result: { conversational: true, part: body.part, reply: reply.text, nextQuestion: reply.nextQuestion, shouldContinue: reply.shouldContinue }, metadata: toStoredMetadata(reply.metadata), transcriptionMetadata: toStoredMetadata(transcript.metadata) })
let voice: { dataUrl: string; contentType: string } | undefined
        try {
          const spokenText = reply.nextQuestion ? `${reply.text} ${reply.nextQuestion}` : reply.text
          const speech = await getAi().synthesizeSpeech({ text: spokenText, language: 'a', voice: 'en-US-Wavenet-F', speed: 1 })
          voice = { dataUrl: speech.dataUrl, contentType: speech.contentType }
        } catch { /* Text reply remains available when Google TTS is unavailable. */ }
        set.status = 201
        return { turnId: String(record._id), transcript: { text: transcript.text, chunks: transcript.chunks, language: transcript.language }, examiner: { text: reply.text, nextQuestion: reply.nextQuestion, shouldContinue: reply.shouldContinue }, tokenBalance: paidResult.tokenBalance, voice }
      },
      { body: t.Object({ audio: t.File(), prompt: t.String({ minLength: 1, maxLength: 8_000 }), part: t.Integer({ minimum: 1, maximum: 3 }), durationSeconds: t.Numeric({ minimum: 1, maximum: 1_800 }), history: t.Optional(t.String({ maxLength: 100_000 })) }) },
    )    .post(
      '/api/ielts/writing/evaluate',
      async ({ request, body, set }) => {
        const { userId } = await requireAuth(request)
        const paidResult = await runPaidAiOperation(
          userId,
          () => getAi().evaluateIeltsWriting(body),
        ).catch(async (error) => {
          await recordFailedUsage({
            userId,
            operation: 'ielts_writing',
            model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra',
            error,
          })
          return throwRouteError(error)
        })
        const evaluation = paidResult.value
        await recordCompletedUsage({
          userId,
          operation: 'ielts_writing',
          metadata: evaluation.metadata,
        })
        const result = withoutMetadata(evaluation)
        const record = await IeltsAiEvaluation.create({
          userId,
          kind: 'writing',
          task: body.task,
          prompt: body.prompt,
          response: body.response,
          result,
          metadata: toStoredMetadata(evaluation.metadata),
        })
        set.status = 201
        return { evaluationId: String(record._id), evaluation: result, tokenBalance: paidResult.tokenBalance }
      },
      {
        body: t.Object({
          task: t.String({ minLength: 1, maxLength: 100 }),
          prompt: t.String({ minLength: 1, maxLength: 8_000 }),
          response: t.String({ minLength: 1, maxLength: 40_000 }),
        }),
      },
    )
    .post(
      '/api/ielts/speaking/evaluate',
      async ({ request, body, set }) => {
        const { userId } = await requireAuth(request)
        validateAudio(body.audio)
        const paidResult = await runPaidAiOperation(userId, async () => {
          const transcript = await getAi().transcribe({
            audio: body.audio,
            filename: body.audio.name || 'ielts-speaking.webm',
            language: 'english',
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

          const evaluation = await getAi().evaluateIeltsSpeaking({
            prompt: body.prompt,
            transcript,
            durationSeconds: body.durationSeconds,
          }).catch(async (error) => {
            await recordFailedUsage({
              userId,
              operation: 'ielts_speaking',
              model: process.env.ELICE_TERRA_MODEL || 'gpt-5.6-terra',
              error,
              audioSeconds: body.durationSeconds,
            })
            throw error
          })
          await recordCompletedUsage({
            userId,
            operation: 'ielts_speaking',
            metadata: evaluation.metadata,
            audioSeconds: body.durationSeconds,
          })
          return { transcript, evaluation }
        }).catch((error) => throwRouteError(error))
        const { transcript, evaluation } = paidResult.value
        const result = withoutMetadata(evaluation)
        const record = await IeltsAiEvaluation.create({
          userId,
          kind: 'speaking',
          prompt: body.prompt,
          transcript: transcript.text,
          durationSeconds: body.durationSeconds,
          result,
          transcriptionMetadata: toStoredMetadata(transcript.metadata),
          metadata: toStoredMetadata(evaluation.metadata),
        })
        set.status = 201
        return {
          evaluationId: String(record._id),
          transcript: {
            text: transcript.text,
            chunks: transcript.chunks,
            language: transcript.language,
          },
          evaluation: result,
          tokenBalance: paidResult.tokenBalance,
        }
      },
      {
        body: t.Object({
          audio: t.File(),
          prompt: t.String({ minLength: 1, maxLength: 8_000 }),
          durationSeconds: t.Numeric({ minimum: 1, maximum: 1_800 }),
        }),
      },
    )
