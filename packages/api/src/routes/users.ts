import { db } from '../db/client.js'
import { Router, type Router as RouterType } from 'express'
import { processPost } from '../utils/route-handler.js'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
  LogInRequest,
  LogInRequestSchema,
  LogInResponse,
} from '@roadtrip/shared'
import { users } from '../db/schema.js'
import { comparePassword, hashPassword } from '../services/authentication.js'
import { eq } from 'drizzle-orm'

const router: RouterType = Router()

export async function createUser(
  body: CreateUserRequest
): Promise<CreateResponse> {
  const hashedPassword = await hashPassword(body.password)
  const [user] = await db
    .insert(users)
    .values({
      username: body.username,
      email: body.email,
      password: hashedPassword,
    })
    .returning()
  return {
    id: user.id,
  }
}

export async function login(
  body: LogInRequest
) : Promise<LogInResponse> {
  const [user] = await db.select().from(users).where(eq(users.username, body.username))
  if (!user || !(await comparePassword(body.password, user.password))) {
    throw new Error('INVALID_CREDENTIALS')
  }
  return {id: user.id}
}



router.post('/', processPost(CreateUserRequestSchema, createUser))

router.post('/login', async (req, res) => {
  try {
    const validatedInput = LogInRequestSchema.parse(req.body)
    const result = await login(validatedInput)
    res.status(200).json(result)
  } catch (err) {
    res.status(401).json({ message: 'Invalid credentials' })
  }
})

export default router
