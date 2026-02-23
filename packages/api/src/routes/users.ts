import { db } from '../db/client.js'
import { Router, type Router as RouterType } from 'express'
import { processPost } from '../utils/route-handler.js'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
} from '@roadtrip/shared'
import { users } from '../db/schema.js'
import { hashPassword } from '../services/authentication.js'

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

router.post('/', processPost(CreateUserRequestSchema, createUser))

export default router
