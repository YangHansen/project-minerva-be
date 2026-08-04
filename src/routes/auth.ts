import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { randomBytes } from 'node:crypto'
import { User } from '../models/User'
import { getConfig } from '../config'
import { getResend } from '../lib/resend'

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: getConfig().jwtSecret
    })
  )
  .post(
    '/register',
    async ({ body }) => {
      const exists = await User.findOne({ email: body.email })
      if (exists) throw new Error('Email already registered')
      await User.create({
        email: body.email,
        password: await Bun.password.hash(body.password)
      })
      return { success: true, message: 'User registered successfully' }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 })
      })
    }
  )
  .post(
    '/login',
    async ({ body, jwt }) => {
      const user = await User.findOne({ email: body.email })
      if (!user || !(await Bun.password.verify(body.password, user.password))) {
        throw new Error('Invalid email or password')
      }
      return {
        success: true,
        token: await jwt.sign({ sub: user.id, role: user.role }),
        user: { id: user.id, email: user.email, role: user.role }
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String()
      })
    }
  )
  .post(
    '/forgot-password',
    async ({ body }) => {
      const user = await User.findOne({ email: body.email })
      if (user) {
        const token = randomBytes(32).toString('hex')
        user.resetPasswordToken = token
        user.resetPasswordExpires = new Date(Date.now() + 3600_000)
        await user.save()
        await getResend().emails.send({
          from: 'Project Minerva <onboarding@resend.dev>',
          to: user.email,
          subject: 'Reset password',
          text: `Your reset token: ${token}`
        })
      }
      return { success: true, message: 'Password reset email sent successfully' }
    },
    { body: t.Object({ email: t.String({ format: 'email' }) }) }
  )
  .post(
    '/reset-password',
    async ({ body }) => {
      const user = await User.findOne({ resetPasswordToken: body.token })
      if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new Error('Invalid or expired token')
      }
      user.password = await Bun.password.hash(body.newPassword)
      user.resetPasswordToken = null
      user.resetPasswordExpires = null
      await user.save()
      return { success: true, message: 'Password has been reset successfully' }
    },
    {
      body: t.Object({
        token: t.String(),
        newPassword: t.String({ minLength: 8 })
      })
    }
  )
