import { db } from '#api/db/client.js'
import { tracks, trips, tripTracks } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { processDelete, processGet, processPost } from '#api/utils/route-handler.js'
import {
  CreateResponse,
  CreateTripRequest,
  CreateTripRequestSchema,
  IdRequestSchema,
} from '@roadtrip/shared'
import { and, eq, sql } from 'drizzle-orm'
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

async function getUserTrips( user?: JWTPayload) {
  return await db
    .select()
    .from(trips)
    .where(eq(trips.userId, user?.userId ?? ''))
}

router.get('/', processGet({ handler: ({user})=>getUserTrips(user) }))

async function getTripTracks(tripId: string, user?: JWTPayload) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }
  return await db
    .select({
      id: tracks.id,
      name: tracks.name,
      gpxFile: tracks.gpxFile,
      createdAt: tracks.createdAt,
      order: tripTracks.step,
    })
    .from(tripTracks)
    .innerJoin(tracks, eq(tripTracks.trackId, tracks.id))
    .where(eq(tripTracks.tripId, tripId))
    .orderBy(
      sql`${tripTracks.step} IS NULL, ${tripTracks.step}` // NULLS LAST
    )
}

router.get(
  '/:id/tracks',
  processGet({
    paramsSchema: IdRequestSchema,
    handler: ({ params, user }) => getTripTracks(params.id, user),
  })
)

router.get('/:id/tracks', async (req, res, next) => {
  try {
    const tracks = await getTripTracks(req.params.id, req.user)
    res.json(tracks)
  } catch (error) {
    next(error)
  }
})

async function addTrackToTrip(
  tripId: string,
  body: AddTrackToTripRequest,
  user?: JWTPayload
): Promise<void> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, body.trackId), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('Track not found', codes.MISSING_TRACK)
  }
  await db.insert(tripTracks).values({
    tripId,
    trackId: body.trackId,
    order: body.order,
  })
}

router.post('/:id/tracks', async (req, res, next) => {
  try {
    await addTrackToTrip(req.params.id, req.body, req.user)
    res.status(201).json({ message: 'Track added to trip' })
  } catch (error) {
    next(error)
  }
})

async function removeTrackFromTrip(
  tripId: string,
  trackId: string,
  user?: JWTPayload
): Promise<void> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }
  const result = await db
    .delete(tripTracks)
    .where(and(eq(tripTracks.tripId, tripId), eq(tripTracks.trackId, trackId)))
    .returning()
  if (result.length === 0) {
    throw new NotFoundError('Track not in this trip', codes.MISSING_TRACK)
  }
}

router.delete('/:tripId/tracks/:trackId', async (req, res, next) => {
  try {
    await removeTrackFromTrip(req.params.tripId, req.params.trackId, req.user)
    res.json({ message: 'Track removed from trip' })
  } catch (error) {
    next(error)
  }
})

async function reorderTripTracks(
  tripId: string,
  body: { trackId: string; order: number }[],
  user?: JWTPayload
): Promise<void> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, user.userId)))

  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }

  for (const item of body) {
    await db
      .update(tripTracks)
      .set({ step: item.order })
      .where(
        and(eq(tripTracks.tripId, tripId), eq(tripTracks.trackId, item.trackId))
      )
  }
}

router.patch('/:id/tracks/reorder', async (req, res, next) => {
  try {
    await reorderTripTracks(req.params.id, req.body, req.user)
    res.json({ message: 'Tracks reordered' })
  } catch (error) {
    next(error)
  }
})

export default router
