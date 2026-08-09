import { AppError } from '../../lib/errors'
import { BoundedRateLimiter, ConcurrencyLimiter, type RateLimitDecision } from '../../lib/in-memory-limits'
import { User } from '../../models/User'

export interface TokenBalanceStore {
  reserve(userId: string): Promise<number | null>
  refund(userId: string): Promise<void>
}

interface RateLimiterLike {
  consume(key: string): RateLimitDecision
}

interface ConcurrencyLimiterLike {
  tryAcquire(): (() => void) | null
}

export const mongoTokenBalanceStore: TokenBalanceStore = {
  async reserve(userId) {
    const user = await User.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: 1 } },
      { $inc: { tokenBalance: -1 } },
      { new: true },
    ).select('tokenBalance').lean()
    return user?.tokenBalance ?? null
  },

  async refund(userId) {
    await User.updateOne({ _id: userId }, { $inc: { tokenBalance: 1 } }).exec()
  },
}

export interface PaidAiOperationResult<T> {
  value: T
  tokenBalance: number
}

export const createPaidAiOperationRunner = (options: {
  tokenStore?: TokenBalanceStore
  rateLimiter?: RateLimiterLike
  concurrencyLimiter?: ConcurrencyLimiterLike
} = {}) => {
  const tokenStore = options.tokenStore ?? mongoTokenBalanceStore
  const rateLimiter = options.rateLimiter ?? new BoundedRateLimiter({
    limit: 12,
    windowMs: 60_000,
    maxEntries: 10_000,
  })
  const concurrencyLimiter = options.concurrencyLimiter ?? new ConcurrencyLimiter(8)

  return async <T>(userId: string, providerOperation: () => Promise<T>): Promise<PaidAiOperationResult<T>> => {
    const rateDecision = rateLimiter.consume(userId)
    if (!rateDecision.allowed) {
      throw new AppError(
        429,
        'AI_RATE_LIMITED',
        'Too many AI requests. Please try again shortly.',
        { retryable: true, retryAfterSeconds: rateDecision.retryAfterSeconds },
      )
    }

    const release = concurrencyLimiter.tryAcquire()
    if (!release) {
      throw new AppError(
        429,
        'AI_BUSY',
        'Too many AI requests are being processed. Please try again shortly.',
        { retryable: true },
      )
    }

    try {
      const tokenBalance = await tokenStore.reserve(userId)
      if (tokenBalance === null) {
        throw new AppError(
          402,
          'TOKEN_BALANCE_DEPLETED',
          'Your AI token balance is depleted. Add tokens before trying again.',
          { tokenBalance: 0 },
        )
      }

      try {
        return { value: await providerOperation(), tokenBalance }
      } catch (error) {
        await tokenStore.refund(userId)
        throw error
      }
    } finally {
      release()
    }
  }
}

export const runPaidAiOperation = createPaidAiOperationRunner()
