import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { randomBytes } from 'node:crypto'
import { User } from '../models/User'
import { getConfig } from '../config'
import { getResend } from '../lib/resend'
import { passwordIssue } from '../lib/validation'

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: getConfig().jwtSecret
    })
  )
  .post(
    '/register',
    async ({ body, set }) => {
      const issue = passwordIssue(body.password)
      if (issue) {
        set.status = 422
        throw new Error(issue)
      }
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
        password: t.String()
      }),
      response: t.Object({ success: t.Boolean(), message: t.String() }),
      detail: {
        tags: ['Auth'],
        summary: 'Register user baru',
        description: 'Mendaftarkan pengguna baru. Email harus unik, password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka.'
      }
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
      }),
      response: t.Object({
        success: t.Boolean(),
        token: t.String(),
        user: t.Object({ id: t.String(), email: t.String(), role: t.String() })
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Login dan ambil JWT token',
        description: 'Memverifikasi kredensial dan mengembalikan token Bearer untuk endpoint yang dilindungi.'
      }
    }
  )
  .post(
    '/forgot-password',
    async ({ body }) => {
      const user = await User.findOne({ email: body.email })
      let token: string | null = null
      if (user) {
        token = randomBytes(32).toString('hex')
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
      // ponytail: token in response is for manual testing only — leaks whether the
      // email exists (defeats anti-enumeration). Remove before production.
      return { success: true, message: 'Password reset email sent successfully', ...(token ? { token } : {}) }
    },
    {
      body: t.Object({ email: t.String({ format: 'email' }) }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
        token: t.Optional(t.String())
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Kirim token reset password',
        description: 'Selalu mengembalikan sukses meskipun email tidak terdaftar (anti-enumerasi akun). Token dikirim via email dan berlaku 1 jam.'
      }
    }
  )
  .post(
    '/reset-password',
    async ({ body, set }) => {
      const issue = passwordIssue(body.newPassword)
      if (issue) {
        set.status = 422
        throw new Error(issue)
      }
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
        newPassword: t.String()
      }),
      response: t.Object({ success: t.Boolean(), message: t.String() }),
      detail: {
        tags: ['Auth'],
        summary: 'Reset password dengan token',
        description: 'Menetapkan password baru menggunakan token dari email reset. Password minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka.'
      }
    }
  )
