import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { isValidObjectId } from 'mongoose'
import { SubscriptionPlan } from '../models/Billing'
import { Transaction } from '../models/Transaction'
import { User } from '../models/User'
import { getConfig } from '../config'

export const billingRoutes = new Elysia({ prefix: '/api/billing' })
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
    '/plans',
    async () => {
      const plans = await SubscriptionPlan.find({ isActive: true })
      return {
        success: true,
        plans: plans.map(p => ({
          id: String(p._id),
          name: p.name,
          price: p.price,
          currency: p.currency,
          tokensAwarded: p.tokensAwarded,
          features: p.features
        }))
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        plans: t.Array(t.Object({
          id: t.String(),
          name: t.String(),
          price: t.Number(),
          currency: t.String(),
          tokensAwarded: t.Number(),
          features: t.Array(t.String())
        }))
      })
    }
  )
  .post(
    '/topup',
    async ({ body, userId, set }) => {
      if (!isValidObjectId(body.planId)) {
        set.status = 400
        throw new Error('Invalid plan id')
      }
      const plan = await SubscriptionPlan.findById(body.planId)
      if (!plan || !plan.isActive) {
        set.status = 404
        throw new Error('Subscription plan not found or inactive')
      }

      // Mock payment success
      const transaction = await Transaction.create({
        userId,
        amount: plan.price,
        currency: plan.currency,
        tokensAdded: plan.tokensAwarded,
        type: 'topup',
        status: 'success'
      })

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { tokenBalance: plan.tokensAwarded } },
        { new: true }
      )

      return {
        success: true,
        message: 'Top-up successful',
        newBalance: user?.tokenBalance ?? 0,
        transactionId: String(transaction._id)
      }
    },
    {
      body: t.Object({
        planId: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        newBalance: t.Number(),
        transactionId: t.String()
      })
    }
  )
