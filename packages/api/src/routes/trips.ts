import { db } from '#api/db/client.js'
import { trips } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { processDelete, processGet, processPost } from '#api/utils/route-handler.js'
import {
  CreateResponse,
  CreateTripRequest,
  CreateTripRequestSchema,
  EmptyRequest,
  EmptyRequestSchema,
} from '@roadtrip/shared'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'

const router: Router = Router()
router.use(authenticate)

async function createTrip(
  body: CreateTripRequest,
  user?: JWTPayload
): Promise<CreateResponse> {
  if (!user) {
    throw Error('Missing user')
  }
  const [trip] = await db
    .insert(trips)
    .values({
      userId: user.userId,
      name: body.name,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
    })
    .returning()
  return { id: trip.id }
}

router.post(
  '/',
  authorize(['user', 'admin']),
  processPost(CreateTripRequestSchema, createTrip)
)

async function deleteTrip(id: string, user?: JWTPayload) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .delete(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
    .returning()
  if (!trip) {
    throw new NotFoundError('trip not found', codes.MISSING_TRIP)
  }
}

router.delete('/:id', processDelete(deleteTrip))

async function getUserTrips(query: EmptyRequest, user?: JWTPayload) {
  return await db
    .select()
    .from(trips)
    .where(eq(trips.userId, user?.userId ?? ''))
}

router.get('/', processGet(EmptyRequestSchema, getUserTrips))

export default router
