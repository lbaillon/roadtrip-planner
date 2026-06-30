import { db } from '#api/db/client.js'
import {
  tracks,
  trips,
  tripSharesEmails,
  tripSharesUsers,
  tripTracks,
  users,
} from '#api/db/schema.js'
import { env } from '#api/env.js'
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import {
  authenticate,
  authenticateOptional,
  authorize,
} from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { sendShareEmail } from '#api/services/mail.js'
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
  GetSharesResponse,
  IdParamsSchema,
  ShareRequest,
  ShareRequestSchema,
  TrackOfTripParamsSchema,
  TripSummary,
  TripTrack,
  UpdateTripPublicStatusRequestSchema,
  UpdateTripRequest,
  UpdateTripRequestSchema,
  UpdateTripTracksOrderRequestSchema,
} from '@roadtrip/shared'
import { and, eq, or, sql } from 'drizzle-orm'
import { Router } from 'express'

const router: Router = Router()

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
  authenticate,
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
  authenticate,
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteTrip(params.id, user),
  })
)

async function updateTrip(
  id: string,
  body: UpdateTripRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [upadatedTrip] = await db
    .update(trips)
    .set({ name: body.name, description: body.description })
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
    .returning()

  if (!upadatedTrip) {
    throw new NotFoundError('trip not found', codes.MISSING_TRIP)
  }
}

router.put(
  '/:id',
  authenticate,
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTripRequestSchema,
    handler: ({ params, body, user }) => updateTrip(params.id, body, user),
  })
)

async function getUserTrips(user?: JWTPayload): Promise<TripSummary[]> {
  return (
    await db
      .select()
      .from(trips)
      .where(eq(trips.userId, user?.userId ?? ''))
  ).map((trip) => ({
    id: trip.id,
    name: trip.name,
    description: trip.description ?? undefined,
    isPublic: trip.isPublic,
  }))
}

router.get(
  '/',
  authenticate,
  processGet({ handler: ({ user }) => getUserTrips(user) })
)

async function getSharedTrips(user?: JWTPayload): Promise<TripSummary[]> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  return (
    await db
      .select({
        id: trips.id,
        name: trips.name,
        description: trips.description,
        isPublic: trips.isPublic,
      })
      .from(tripSharesUsers)
      .innerJoin(trips, eq(trips.id, tripSharesUsers.tripId))
      .where(eq(tripSharesUsers.userId, user.userId))
  ).map((trip) => ({
    id: trip.id,
    name: trip.name,
    description: trip.description ?? undefined,
    isPublic: trip.isPublic,
  }))
}

router.get(
  '/shared',
  authenticate,
  processGet({ handler: ({ user }) => getSharedTrips(user) })
)

async function getTrip(id: string, user?: JWTPayload): Promise<TripSummary> {
  const [trip] = await db
    .select({
      id: trips.id,
      name: trips.name,
      description: trips.description,
      isPublic: trips.isPublic,
      userId: trips.userId,
    })
    .from(trips)
    .leftJoin(tripSharesUsers, eq(tripSharesUsers.tripId, trips.id))
    .where(
      and(
        eq(trips.id, id),
        or(
          eq(trips.isPublic, true),
          eq(trips.userId, user?.userId ?? ''),
          eq(tripSharesUsers.userId, user?.userId ?? '')
        )
      )
    )
    .limit(1)
  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description ?? undefined,
    isPublic: trip.isPublic,
    isOwner: trip.userId === (user?.userId ?? ''),
  }
}

router.get(
  '/:id',
  authenticateOptional,
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrip(params.id, user),
  })
)

async function getTripTracks(
  tripId: string,
  user?: JWTPayload
): Promise<TripTrack[]> {
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .leftJoin(tripSharesUsers, eq(tripSharesUsers.tripId, trips.id))
    .where(
      and(
        eq(trips.id, tripId),
        or(
          eq(trips.isPublic, true),
          eq(trips.userId, user?.userId ?? ''),
          eq(tripSharesUsers.userId, user?.userId ?? '')
        )
      )
    )
    .limit(1)
  if (!trip) {
    throw new NotFoundError('Trip not found', codes.MISSING_TRIP)
  }
  return await db
    .select({
      id: tracks.id,
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
  authenticateOptional,
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
  authenticate,
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
  authenticate,
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
  authenticate,
  processDelete({
    paramsSchema: TrackOfTripParamsSchema,
    handler: ({ params, user }) =>
      removeTrackFromTrip(params.tripId, params.trackId, user),
  })
)

async function updateTripVisibility(
  id: string,
  isPublic: boolean,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('trip not found', codes.MISSING_TRIP)
  }

  await db
    .update(trips)
    .set({ isPublic })
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
}

router.put(
  '/:id/public',
  authenticate,
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTripPublicStatusRequestSchema,
    handler: ({ params, body, user }) =>
      updateTripVisibility(params.id, body.isPublic, user),
  })
)

export async function shareTrip(
  id: string,
  body: ShareRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('trip not found', codes.MISSING_TRIP)
  }
  const url = `${env.WEB_APP_URL}/trips/${id}`
  for (const email of body.emails) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
    if (existing) {
      await db
        .insert(tripSharesUsers)
        .values({ tripId: id, userId: existing.id })
        .onConflictDoNothing()
    } else {
      await db
        .insert(tripSharesEmails)
        .values({ tripId: id, email })
        .onConflictDoNothing()
    }
    await sendShareEmail(
      email,
      user.username,
      'voyage',
      trip.name,
      url,
      !!existing
    )
  }
}

router.post(
  '/:id/shares',
  authenticate,
  processPost({
    paramsSchema: IdParamsSchema,
    bodySchema: ShareRequestSchema,
    handler: ({ params, body, user }) => shareTrip(params.id, body, user),
  })
)

async function getTripShares(
  id: string,
  user?: JWTPayload
): Promise<GetSharesResponse> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [trip] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(and(eq(trips.id, id), eq(trips.userId, user.userId)))
  if (!trip) {
    throw new NotFoundError('trip not found', codes.MISSING_TRIP)
  }
  const sharedUsers = await db
    .select({ email: users.email, username: users.username })
    .from(tripSharesUsers)
    .innerJoin(users, eq(users.id, tripSharesUsers.userId))
    .where(eq(tripSharesUsers.tripId, id))
  const sharedEmails = await db
    .select({ email: tripSharesEmails.email })
    .from(tripSharesEmails)
    .where(eq(tripSharesEmails.tripId, id))
  return { users: sharedUsers, emails: sharedEmails.map((e) => e.email) }
}

router.get(
  '/:id/shares',
  authenticate,
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTripShares(params.id, user),
  })
)

export default router
