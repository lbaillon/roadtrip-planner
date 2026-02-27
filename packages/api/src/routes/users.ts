import { LibsqlError } from '@libsql/client'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
} from '@roadtrip/shared'
import { DrizzleQueryError } from 'drizzle-orm'
import { Router, type Router as RouterType } from 'express'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { hashPassword } from '../services/authentication.js'
import { processPost } from '../utils/route-handler.js'

const router: RouterType = Router()

async function createUser(body: CreateUserRequest): Promise<CreateResponse> {
  const hashedPassword = await hashPassword(body.password)
  try {
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
  } catch (err) {
    if (
      err instanceof DrizzleQueryError &&
      err.cause instanceof LibsqlError &&
      err.cause?.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      throw new Error('user already exists', { cause: err })
    }
    throw err
  }
}

router.post('/', processPost(CreateUserRequestSchema, createUser))

export default router
