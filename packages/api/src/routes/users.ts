import { db } from '#api/db/client.js'
import {
  NewUser,
  trackSharesEmails,
  trackSharesUsers,
  tripSharesEmails,
  tripSharesUsers,
  users,
} from '#api/db/schema.js'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate } from '#api/middlewares/auth.js'
import { hashPassword, JWTPayload } from '#api/services/authentication.js'
import { sendConfirmationEmail } from '#api/services/mail.js'
import { env } from '#api/env.js'
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
  ResendConfirmationRequest,
  ResendConfirmationRequestSchema,
  UpdateUserRequest,
  UpdateUserRequestSchema,
} from '@roadtrip/shared'
import { DrizzleQueryError, eq } from 'drizzle-orm'
import { Request, Response, Router } from 'express'

const router: Router = Router()

async function createUser(body: CreateUserRequest): Promise<CreateResponse> {
  const hashedPassword = await hashPassword(body.password)
  const confirmationKey = crypto.randomUUID()
  try {
    const [user] = await db
      .insert(users)
      .values({
        username: body.username,
        email: body.email,
        password: hashedPassword,
        confirmationKey,
      })
      .returning()
    await sendConfirmationEmail(
      user.email,
      `${env.API_URL}/api/users_confirmation/${confirmationKey}`
    )
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

async function resendConfirmation(
  body: ResendConfirmationRequest
): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
  if (user?.confirmationKey) {
    await sendConfirmationEmail(
      user.email,
      `${env.API_URL}/api/users_confirmation/${user.confirmationKey}`
    )
  }
}

router.post(
  '/resend-confirmation',
  processPost({
    bodySchema: ResendConfirmationRequestSchema,
    handler: ({ body }) => resendConfirmation(body),
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

async function convertEmailShares(userId: string, email: string) {
  const sharedTracks = await db
    .select({ trackId: trackSharesEmails.trackId })
    .from(trackSharesEmails)
    .where(eq(trackSharesEmails.email, email))
  for (const { trackId } of sharedTracks) {
    await db
      .insert(trackSharesUsers)
      .values({ trackId, userId })
      .onConflictDoNothing()
  }
  await db.delete(trackSharesEmails).where(eq(trackSharesEmails.email, email))

  const sharedTrips = await db
    .select({ tripId: tripSharesEmails.tripId })
    .from(tripSharesEmails)
    .where(eq(tripSharesEmails.email, email))
  for (const { tripId } of sharedTrips) {
    await db
      .insert(tripSharesUsers)
      .values({ tripId, userId })
      .onConflictDoNothing()
  }
  await db.delete(tripSharesEmails).where(eq(tripSharesEmails.email, email))
}

export async function confirmUserHandler(req: Request, res: Response) {
  const confirmationKey = String(req.params.confirmationKey)
  try {
    const [user] = await db
      .update(users)
      .set({ confirmationKey: null })
      .where(eq(users.confirmationKey, confirmationKey))
      .returning()
    if (!user) {
      return res.redirect(`${env.WEB_APP_URL}/login?confirmed=0`)
    }
    await convertEmailShares(user.id, user.email)
    return res.redirect(`${env.WEB_APP_URL}/login?confirmed=1`)
  } catch {
    return res.redirect(`${env.WEB_APP_URL}/login?confirmed=0`)
  }
}

export default router
