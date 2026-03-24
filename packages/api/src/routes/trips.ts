import { db } from '#api/db/client.js'
import { tracks, trips, tripTracks } from '#api/db/schema.js'
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import {
  processDelete,
  processGet,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import {
  AddTrackToTripRequestSchema,
  CreateResponse,
  CreateTripRequest,
  CreateTripRequestSchema,
  IdParamsSchema,
  TrackOfTripParamsSchema,
  TripSummary,
  TripTrack,
  UpdateTripTracksOrderRequestSchema,
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
      id: body.id,
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
  processPost({
    bodySchema: CreateTripRequestSchema,
    handler: ({ body, user }) => createTrip(body, user),
  })
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

router.delete(
  '/:id',
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteTrip(params.id, user),
  })
)

async function getUserTrips(user?: JWTPayload): Promise<TripSummary[]> {
  return await db
    .select()
    .from(trips)
    .where(eq(trips.userId, user?.userId ?? ''))
}

router.get('/', processGet({ handler: ({ user }) => getUserTrips(user) }))

async function getTrip(id: string, user?: JWTPayload): Promise<TripSummary> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
  return { id: trip.id, name: trip.name }
}

router.get(
  '/:id',
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrip(params.id, user),
  })
)

async function getTripTracks(
  tripId: string,
  user?: JWTPayload
): Promise<TripTrack[]> {
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
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTripTracks(params.id, user),
  })
)

async function reorderTripTracks(
  tripId: string,
  trackIds: string[],
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
  const existing = await db
    .select({ trackId: tripTracks.trackId })
    .from(tripTracks)
    .where(eq(tripTracks.tripId, tripId))
  const existingIds = new Set(existing.map((r) => r.trackId))
  const isValid =
    trackIds.length === existingIds.size &&
    trackIds.every((id) => existingIds.has(id))
  if (!isValid) {
    throw new BadRequestError(
      'trackIds must match exactly the tracks in this trip',
      codes.INVALID_TRACKS_ORDER
    )
  }
  await db.transaction(async (tx) => {
    for (let i = 0; i < trackIds.length; i++) {
      await tx
        .update(tripTracks)
        .set({ step: i })
        .where(
          and(
            eq(tripTracks.tripId, tripId),
            eq(tripTracks.trackId, trackIds[i])
          )
        )
    }
  })
}

router.put(
  '/:id/tracks',
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTripTracksOrderRequestSchema,
    handler: ({ params, body, user }) =>
      reorderTripTracks(params.id, body.trackIds, user),
  })
)

async function addTrackToTrip(
  tripId: string,
  trackId: string,
  order: number,
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
    .where(and(eq(tracks.id, trackId), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('Track not found', codes.MISSING_TRACK)
  }
  await db
    .insert(tripTracks)
    .values({ tripId: tripId, trackId: trackId, step: order })
}

router.post(
  '/:tripId/tracks/:trackId',
  processPost({
    paramsSchema: TrackOfTripParamsSchema,
    bodySchema: AddTrackToTripRequestSchema,
    handler: ({ params, body, user }) =>
      addTrackToTrip(params.tripId, params.trackId, body.order, user),
  })
)

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

router.delete(
  '/:tripId/tracks/:trackId',
  processDelete({
    paramsSchema: TrackOfTripParamsSchema,
    handler: ({ params, user }) =>
      removeTrackFromTrip(params.tripId, params.trackId, user),
  })
)

export default router
