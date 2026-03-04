import { LibsqlError } from '@libsql/client'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
  UpdateUserRequest,
  UpdateUserRequestSchema,
} from '@roadtrip/shared'
import { DrizzleQueryError, eq } from 'drizzle-orm'
import { Router, type Router as RouterType } from 'express'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { hashPassword } from '../services/authentication.js'
import { processDelete, processPost, processPut } from '../utils/route-handler.js'
import { authenticate } from '#api/middlewares/auth.js'

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

async function deleteUser(id: string) {
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning()

  if (!deletedUser) return null

  return deleteUser
}

router.delete('/:id', authenticate, processDelete(deleteUser))

async function updateUser(id: string, body: UpdateUserRequest): Promise<CreateResponse> {
  const updateData: Partial<typeof users.$inferInsert> = {
    username: body.username,
    email: body.email,
  }

  if (body.password) {
    updateData.password = await hashPassword(body.password)
  }

  try {
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) throw new Error('user not found')

    return { id: updatedUser.id }
  } catch (err) {
    if (
      err instanceof DrizzleQueryError &&
      err.cause instanceof LibsqlError &&
      err.cause?.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      throw new Error('username or email already exists', { cause: err })
    }
    throw err
  }
}

router.put('/:id', authenticate, processPut(UpdateUserRequestSchema, updateUser))

export default router
