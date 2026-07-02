import { db } from '#api/db/client.js'
import { users } from '#api/db/schema.js'
import { env } from '#api/env.js'
import { UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '#api/services/authentication.js'
import { sendPasswordResetEmail } from '#api/services/mail.js'
import {
  ForgotPasswordRequestSchema,
  LogInRequest,
  LogInRequestSchema,
  ResetPasswordRequestSchema,
} from '@roadtrip/shared'
import { and, eq, isNull } from 'drizzle-orm'
import { Router } from 'express'

const router: Router = Router()

async function login(body: LogInRequest) {
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(eq(users.username, body.username), isNull(users.confirmationKey))
    )
  if (!user || !(await comparePassword(body.password, user.password))) {
    throw new UnauthorizedError('Invalid credentials', codes.WRONG_LOGIN)
  }
  return user
}

export const refreshTokenCookieParameters = {
  httpOnly: true,
  secure: !env.isDev,
  sameSite: 'lax',
  path: '/api/auth/refresh',
} as const

router.post('/login', async (req, res) => {
  try {
    const validatedInput = LogInRequestSchema.parse(req.body)
    const { id, username, email } = await login(validatedInput)

    const payload = {
      userId: id,
      email,
      username,
      role: 'user',
    }

    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)

    res.cookie('refreshToken', refreshToken, refreshTokenCookieParameters)

    res.json({ accessToken })
  } catch (error) {
    console.error(
      'Error:',
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    )
    res.status(401).json({ message: 'Invalid credentials' })
  }
})

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    res.status(401).json({ message: 'Missing refresh token' })
    return
  }
  try {
    const payload = await verifyToken(refreshToken)
    const newAccessToken = await signAccessToken(payload)
    res.json({ accessToken: newAccessToken })
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
})

router.post('/logout', async (req, res) => {
  res.clearCookie('refreshToken', refreshTokenCookieParameters)
  res.status(200).json({ message: 'Logged out successfully' })
})

router.post('/forgot-password', async (req, res) => {
  const parsed = ForgotPasswordRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
  if (user) {
    const resetKey = crypto.randomUUID()
    const resetKeyExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await db
      .update(users)
      .set({ resetKey, resetKeyExpiresAt })
      .where(eq(users.id, user.id))
    await sendPasswordResetEmail(
      user.email,
      `${env.WEB_APP_URL}/reset-password?token=${resetKey}`
    )
  }
  // Neutral response — do not reveal whether the email exists.
  res.status(200).json({ message: 'ok' })
})

router.post('/reset-password', async (req, res) => {
  const parsed = ResetPasswordRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.resetKey, parsed.data.token))
  if (
    !user ||
    !user.resetKeyExpiresAt ||
    user.resetKeyExpiresAt.getTime() < Date.now()
  ) {
    res.status(400).json({ message: 'Invalid or expired token' })
    return
  }
  const password = await hashPassword(parsed.data.password)
  await db
    .update(users)
    .set({ password, resetKey: null, resetKeyExpiresAt: null })
    .where(eq(users.id, user.id))
  res.status(200).json({ message: 'ok' })
})

export default router
