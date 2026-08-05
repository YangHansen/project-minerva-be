import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { User } from '../models/User'
import { Transaction } from '../models/Transaction'
import { getConfig } from '../config'

const transactionResponse = t.Object({
  id: t.String(),
  amount: t.Number(),
  type: t.String(),
  paymentMethod: t.Optional(t.String()),
  status: t.String(),
  createdAt: t.String()
})

const protectedDetail = {
  tags: ['Transactions'],
  security: [{ bearerAuth: [] }]
}

export const transactionRoutes = new Elysia({ prefix: '/api/transactions' })
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

  // ── POST /api/transactions ──────────────────────────────────────────────────
  .post(
    '/',
    async ({ body, userId, set }) => {
      if (!Number.isInteger(body.amount)) {
        set.status = 422
        throw new Error('Amount must be a whole number.')
      }
      const PAYMENT_METHODS = ['bank_transfer', 'e_wallet', 'credit_card']
      if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
        set.status = 422
        throw new Error('Please choose a valid payment method.')
      }
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        { $inc: { tokenBalance: body.amount } },
        { new: true }
      )
      await Transaction.create({
        userId,
        amount: body.amount,
        type: 'topup',
        paymentMethod: body.paymentMethod,
        status: 'success'
      })
      return {
        success: true,
        message: 'Simulation top-up successful. Tokens added to your balance.',
        tokensAdded: body.amount,
        newBalance: user?.tokenBalance ?? body.amount
      }
    },
    {
      body: t.Object({
        amount: t.Number({ minimum: 1 }),
        paymentMethod: t.String()
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        tokensAdded: t.Number(),
        newBalance: t.Number()
      }),
      detail: {
        ...protectedDetail,
        summary: 'Top-up token (simulasi)',
        description: 'Menambah saldo token pengguna dan mencatat transaksi topup. amount minimal 1.'
      }
    }
  )

  // ── GET /api/transactions ───────────────────────────────────────────────────
  .get(
    '/',
    async ({ userId }) => {
      const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 })
      return {
        success: true,
        transactions: transactions.map((tx) => ({
          id: String(tx._id),
          amount: tx.amount,
          type: tx.type,
          ...(tx.paymentMethod ? { paymentMethod: tx.paymentMethod } : {}),
          status: tx.status,
          createdAt: tx.createdAt.toISOString()
        }))
      }
    },
    {
      response: t.Object({
        success: t.Boolean(),
        transactions: t.Array(transactionResponse)
      }),
      detail: {
        ...protectedDetail,
        summary: 'Riwayat transaksi token',
        description: 'Mengambil riwayat penambahan (topup) dan pengeluaran token pengguna, terbaru di atas.'
      }
    }
  )
