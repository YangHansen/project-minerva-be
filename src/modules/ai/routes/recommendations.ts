import { Elysia, t } from 'elysia'
import { requireAuth } from '../../../auth/session'
import { AppError } from '../../../lib/errors'
import { AiRecommendationDaily } from '../models'
import { runPaidAiOperation } from '../paid-operation'

const DAILY_RECOMMENDATION_LIMIT = 3

const jakartaDay = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const reserveDailyRecommendation = async (userId: string, dayKey: string) => {
  const filter = { userId, dayKey, count: { $lt: DAILY_RECOMMENDATION_LIMIT } }
  try {
    return await AiRecommendationDaily.findOneAndUpdate(
      filter,
      { $inc: { count: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean()
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error
    return AiRecommendationDaily.findOneAndUpdate(filter, { $inc: { count: 1 } }, { new: true }).lean()
  }
}

export const createRecommendationRoutes = () =>
  new Elysia({ name: 'minerva-ai-recommendations' })
    .get('/api/ai/recommendations/status', async ({ request }) => {
      const { userId } = await requireAuth(request)
      const daily = await AiRecommendationDaily.findOne({ userId, dayKey: jakartaDay() }).lean()
      const usedToday = Math.min(DAILY_RECOMMENDATION_LIMIT, daily?.count || 0)
      return { dailyLimit: DAILY_RECOMMENDATION_LIMIT, usedToday, remainingToday: DAILY_RECOMMENDATION_LIMIT - usedToday }
    })
    .post('/api/ai/recommendations', async ({ request, body }) => {
      const { userId } = await requireAuth(request)
      const scholarshipIds = [...new Set(body.rankedScholarshipIds.map((id) => id.trim()).filter(Boolean))]
      if (scholarshipIds.length < 3) throw new AppError(422, 'RECOMMENDATION_INPUT_INVALID', 'At least three scholarship candidates are required.')

      const paid = await runPaidAiOperation(userId, async () => {
        const daily = await reserveDailyRecommendation(userId, jakartaDay())
        if (!daily) throw new AppError(429, 'RECOMMENDATION_DAILY_LIMIT_REACHED', 'You have used all 3 scholarship recommendation searches for today.')
        return { scholarshipIds: scholarshipIds.slice(0, 3), usedToday: daily.count }
      })
      return {
        scholarshipIds: paid.value.scholarshipIds,
        dailyLimit: DAILY_RECOMMENDATION_LIMIT,
        usedToday: paid.value.usedToday,
        remainingToday: DAILY_RECOMMENDATION_LIMIT - paid.value.usedToday,
        tokenBalance: paid.tokenBalance,
      }
    }, {
      body: t.Object({ rankedScholarshipIds: t.Array(t.String({ minLength: 1, maxLength: 100 }), { minItems: 3, maxItems: 30 }) }),
    })
