import { db } from '#api/db/client.js'
import { NewUser, users } from '#api/db/schema.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate } from '#api/middlewares/auth.js'
import { hashPassword, JWTPayload } from '#api/services/authentication.js'
import {
  processDelete,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import { LibsqlError } from '@libsql/client'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
  IdParamsSchema,
  UpdateUserRequest,
  UpdateUserRequestSchema,
} from '@roadtrip/shared'
import { DrizzleQueryError, eq } from 'drizzle-orm'
import { Router } from 'express'

const router: Router = Router()

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
    return { id: user.id }
  } catch (err) {
    if (
      err instanceof DrizzleQueryError &&
      err.cause instanceof LibsqlError &&
      err.cause?.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      throw new ConflictError('user already exists', codes.USER_CONFLICT, {
        cause: err,
      })
    }
    throw err
  }
}

router.post(
  '/',
  processPost({
    bodySchema: CreateUserRequestSchema,
    handler: ({ body }) => createUser(body),
  })
)

async function deleteUser(id: string, user?: JWTPayload) {
  if (!user || user.role != 'admin' || user.userId != id) {
    throw new ForbiddenError('Action is forbidden', codes.FORBIDDEN)
  }
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning()
  if (!deletedUser) {
    throw new NotFoundError('user not found', codes.MISSING_USER)
  }
}

router.delete(
  '/:id',
  authenticate,
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteUser(params.id, user),
  })
)

async function updateUser(
  id: string,
  body: UpdateUserRequest,
  user?: JWTPayload
) {
  if (!user || user.role != 'admin' || user.userId != id) {
    throw new ForbiddenError('Action is forbidden', codes.FORBIDDEN)
  }
  const updateData: Partial<NewUser> = {
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
    if (!updatedUser) {
      throw new NotFoundError('user not found', codes.MISSING_USER)
    }
  } catch (err) {
    if (
      err instanceof DrizzleQueryError &&
      err.cause instanceof LibsqlError &&
      err.cause?.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE'
    ) {
      throw new ConflictError(
        'username or email already exists',
        codes.USER_CONFLICT,
        { cause: err }
      )
    }
    throw err
  }
}

router.put(
  '/:id',
  authenticate,
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateUserRequestSchema,
    handler: ({ params, body, user }) => updateUser(params.id, body, user),
  })
)

export default router
