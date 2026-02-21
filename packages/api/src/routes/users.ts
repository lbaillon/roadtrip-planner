import { db } from '../db/client.js'
import { Router, type Router as RouterType } from 'express'
import { processPost } from '../utils/route-handler.js'
import { CreateResponse, CreateUserRequest, CreateUserRequestSchema } from '@roadtrip/shared'
import { users } from '../db/schema.js'

const router: RouterType = Router()

export async function createUser(
  body: CreateUserRequest
): Promise<CreateResponse> {

const [user] =await db.insert(users).values(body).returning()
  return {
    id: user.id
  }
}

router.post('/', processPost(CreateUserRequestSchema, createUser))

export default router
