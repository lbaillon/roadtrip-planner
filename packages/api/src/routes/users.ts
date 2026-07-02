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
  UnauthorizedError,
} from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, AuthenticatedRequest } from '#api/middlewares/auth.js'
import {
  comparePassword,
  hashPassword,
  JWTPayload,
  signAccessToken,
  signRefreshToken,
} from '#api/services/authentication.js'
import { sendConfirmationEmail } from '#api/services/mail.js'
import { uploadProfilePicture } from '#api/services/uploader.js'
import { env } from '#api/env.js'
import { refreshTokenCookieParameters } from './auth.js'
import {
  processDelete,
  processGet,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import { LibsqlError } from '@libsql/client'
import {
  CreateResponse,
  CreateUserRequest,
  CreateUserRequestSchema,
  GetMeResponse,
  IdParamsSchema,
  ResendConfirmationRequest,
  ResendConfirmationRequestSchema,
  UpdateMeRequestSchema,
  UpdateProfilePictureRequestSchema,
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

async function getMe(user?: JWTPayload): Promise<GetMeResponse> {
  if (!user) {
    throw new ForbiddenError('Action is forbidden', codes.FORBIDDEN)
  }
  const [row] = await db
    .select({
      username: users.username,
      email: users.email,
      profilePicture: users.profilePicture,
    })
    .from(users)
    .where(eq(users.id, user.userId))
  if (!row) {
    throw new NotFoundError('user not found', codes.MISSING_USER)
  }
  return {
    username: row.username,
    email: row.email,
    profilePicture: row.profilePicture ?? null,
  }
}

router.get(
  '/me',
  authenticate,
  processGet({ handler: ({ user }) => getMe(user) })
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

router.put(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }
    const body = UpdateMeRequestSchema.parse(req.body)

    const [current] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.userId))
    if (!current) {
      throw new NotFoundError('user not found', codes.MISSING_USER)
    }

    const changingEmail = body.email != null && body.email !== current.email
    const changingPassword = body.password != null

    if (changingEmail || changingPassword) {
      const ok =
        body.currentPassword != null &&
        (await comparePassword(body.currentPassword, current.password))
      if (!ok) {
        throw new UnauthorizedError(
          'Invalid current password',
          codes.WRONG_LOGIN
        )
      }
    }

    const updateData: Partial<NewUser> = {}
    if (body.username) updateData.username = body.username
    if (changingPassword) {
      updateData.password = await hashPassword(body.password as string)
    }

    let confirmationKey: string | null = null
    if (changingEmail) {
      confirmationKey = crypto.randomUUID()
      updateData.email = body.email
      updateData.confirmationKey = confirmationKey
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await db.update(users).set(updateData).where(eq(users.id, user.userId))
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

    if (changingEmail && confirmationKey) {
      await sendConfirmationEmail(
        body.email as string,
        `${env.API_URL}/api/users_confirmation/${confirmationKey}`
      )
    }

    const payload = {
      userId: user.userId,
      email: body.email ?? current.email,
      username: body.username ?? current.username,
      role: user.role,
    }
    const accessToken = await signAccessToken(payload)
    const refreshToken = await signRefreshToken(payload)
    res.cookie('refreshToken', refreshToken, refreshTokenCookieParameters)
    res.json({ accessToken })
  }
)

async function updateProfilePicture(
  image: string,
  user?: JWTPayload
): Promise<void> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const url = await uploadProfilePicture(user.userId, image)
  await db
    .update(users)
    .set({ profilePicture: url })
    .where(eq(users.id, user.userId))
}

router.put(
  '/me/photo',
  authenticate,
  processPut({
    bodySchema: UpdateProfilePictureRequestSchema,
    handler: ({ body, user }) => updateProfilePicture(body.image, user),
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
