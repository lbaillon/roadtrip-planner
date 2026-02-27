import { db } from '#api/db/client.js'
import { users } from '#api/db/schema.js'
import {
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '#api/services/authentication.js'
import { LogInRequest, LogInRequestSchema } from '@roadtrip/shared'
import { eq } from 'drizzle-orm'
import { Router } from 'express'

const isDev = process.env.NODE_ENV !== 'production'

const router: Router = Router()

async function login(body: LogInRequest) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, body.username))
  if (!user || !(await comparePassword(body.password, user.password))) {
    throw new Error('INVALID_CREDENTIALS')
  }
  return user
}

router.post('/login', async (req, res) => {
  try {
    const validatedInput = LogInRequestSchema.parse(req.body)
    const { id, username, email } = await login(validatedInput)

    const payload = {
      userId: id,
      email,username,
      role: 'user',
    }

    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? 'lax' : 'none',
      path: '/api/auth/refresh',
    })

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
    return res.status(401).json({ message: 'Missing refresh token' })
  }
  try {
    const payload = await verifyToken(refreshToken)
    const newAccessToken = await signAccessToken(payload)
    res.json({ accessToken: newAccessToken })
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
})

export default router
