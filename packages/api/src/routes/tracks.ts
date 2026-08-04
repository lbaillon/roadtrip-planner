import { db } from '#api/db/client.js'
import {
  trackSharesEmails,
  trackSharesUsers,
  tracks,
  trips,
  tripSharesUsers,
  tripTracks,
  users,
} from '#api/db/schema.js'
import { env } from '#api/env.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import {
  authenticate,
  authenticateOptional,
  authorize,
} from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { sendShareEmail } from '#api/services/mail.js'
import {
  deleteGpx,
  getGpxFile,
  overwriteGpx,
  uploadGpx,
} from '#api/services/uploader.js'
import {
  processDelete,
  processGet,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import {
  CreateResponse,
  CreateTrackRequest,
  CreateTrackRequestSchema,
  GetSharesResponse,
  GetTrackResponse,
  GetTrackVisibilityResponse,
  IdParamsSchema,
  ShareRequest,
  ShareRequestSchema,
  TrackSummary,
  UpdateTrackGpxRequest,
  UpdateTrackGpxRequestSchema,
  UpdateTrackPublicStatusRequestSchema,
} from '@roadtrip/shared'

import { and, eq, ne, or, sql } from 'drizzle-orm'
import { Router } from 'express'
import { XMLParser } from 'fast-xml-parser'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) =>
    name === 'rtept' ||
    name === 'wpt' ||
    name === 'rte' ||
    name === 'trk' ||
    name === 'trkseg' ||
    name === 'trkpt',
})

const router: Router = Router()

export async function createTrack(
  body: CreateTrackRequest,
  user?: JWTPayload
): Promise<CreateResponse> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const gpxPublicId = await uploadGpx(body.id, body.gpxContent)
  const [track] = await db
    .insert(tracks)
    .values({
      id: body.id,
      userId: user.userId,
      gpxFile: gpxPublicId,
      name:
        xmlParser.parse(body.gpxContent)?.gpx?.metadata?.name ??
        'Route inconnue',
    })
    .returning()
  return { id: track.id }
}

router.post(
  '/',
  authenticate,
  authorize(['user', 'admin']),
  processPost({
    bodySchema: CreateTrackRequestSchema,
    handler: ({ body, user }) => createTrack(body, user),
  })
)

export async function deleteTrack(id: string, user?: JWTPayload) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .delete(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
    .returning()
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const publicId = track.gpxFile
  await deleteGpx(publicId)
}

router.delete(
  '/:id',
  authenticate,
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteTrack(params.id, user),
  })
)

export async function updateTrackGpx(
  id: string,
  body: UpdateTrackGpxRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }

  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  await overwriteGpx(track.gpxFile, body.gpxContent)
  const newName = xmlParser.parse(body.gpxContent)?.gpx?.metadata?.name
  if (newName && newName !== track.name) {
    await db
      .update(tracks)
      .set({ name: newName })
      .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  }
}

router.put(
  '/:id',
  authenticate,
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTrackGpxRequestSchema,
    handler: ({ params, body, user }) => updateTrackGpx(params.id, body, user),
  })
)

async function getUserTracks(user?: JWTPayload): Promise<TrackSummary[]> {
  const rows = await db
    .select({
      id: tracks.id,
      name: tracks.name,
      inTrip: sql<number>`EXISTS (
        SELECT 1 FROM ${tripTracks} WHERE ${tripTracks.trackId} = ${tracks.id}
      )`,
    })
    .from(tracks)
    .where(eq(tracks.userId, user?.userId ?? ''))

  return rows.map((row) => ({ ...row, inTrip: row.inTrip === 1 }))
}

router.get(
  '/',
  authenticate,
  processGet({ handler: ({ user }) => getUserTracks(user) })
)

async function getSharedTracks(user?: JWTPayload): Promise<TrackSummary[]> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  return await db
    .select({ id: tracks.id, name: tracks.name })
    .from(trackSharesUsers)
    .innerJoin(tracks, eq(tracks.id, trackSharesUsers.trackId))
    .where(
      and(
        eq(trackSharesUsers.userId, user.userId),
        ne(tracks.userId, user.userId)
      )
    )
}

router.get(
  '/shared',
  authenticate,
  processGet({ handler: ({ user }) => getSharedTracks(user) })
)

async function getTrack(
  id: string,
  user?: JWTPayload
): Promise<GetTrackResponse> {
  const [track] = await db
    .select({
      id: tracks.id,
      userId: tracks.userId,
      gpxFile: tracks.gpxFile,
      isPublic: tracks.isPublic,
      owner: users.username,
    })
    .from(tracks)
    .innerJoin(users, eq(users.id, tracks.userId))
    .leftJoin(tripTracks, eq(tripTracks.trackId, tracks.id))
    .leftJoin(trips, eq(trips.id, tripTracks.tripId))
    .leftJoin(trackSharesUsers, eq(trackSharesUsers.trackId, tracks.id))
    .leftJoin(tripSharesUsers, eq(tripSharesUsers.tripId, trips.id))
    .where(
      and(
        eq(tracks.id, id),
        or(
          eq(tracks.isPublic, true),
          eq(tracks.userId, user?.userId ?? ''),
          eq(trips.isPublic, true),
          eq(trackSharesUsers.userId, user?.userId ?? ''),
          eq(tripSharesUsers.userId, user?.userId ?? '')
        )
      )
    )
    .limit(1)
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const gpxContent = await getGpxFile(track.gpxFile)

  return {
    id: track.id,
    gpxContent,
    isPublic: track.isPublic,
    isOwner: track.userId === (user?.userId ?? ''),
    sharedBy: track.owner,
  }
}

router.get(
  '/:id',
  authenticateOptional,
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrack(params.id, user),
  })
)

async function getTrackVisibility(
  id: string,
  user?: JWTPayload
): Promise<GetTrackVisibilityResponse> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }

  const [track] = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }

  const [publicTrip] = await db
    .select({ name: trips.name })
    .from(trips)
    .innerJoin(tripTracks, eq(tripTracks.tripId, trips.id))
    .where(and(eq(tripTracks.trackId, id), eq(trips.isPublic, true)))
    .orderBy(trips.createdAt)
    .limit(1)

  return { publicViaTrip: publicTrip?.name ?? null }
}

router.get(
  '/:id/visibility',
  authenticate,
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrackVisibility(params.id, user),
  })
)

async function updateTrackVisibility(
  id: string,
  isPublic: boolean,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }

  await db
    .update(tracks)
    .set({ isPublic })
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
}

router.put(
  '/:id/public',
  authenticate,
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTrackPublicStatusRequestSchema,
    handler: ({ params, body, user }) =>
      updateTrackVisibility(params.id, body.isPublic, user),
  })
)

export async function shareTrack(
  id: string,
  body: ShareRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const url = `${env.WEB_APP_URL}/tracks/${id}`
  for (const email of body.emails) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
    // Sharing a track with yourself is a no-op (you already own it)
    if (existing?.id === user.userId) {
      continue
    }
    if (existing) {
      await db
        .insert(trackSharesUsers)
        .values({ trackId: id, userId: existing.id })
        .onConflictDoNothing()
    } else {
      await db
        .insert(trackSharesEmails)
        .values({ trackId: id, email })
        .onConflictDoNothing()
    }
    await sendShareEmail(
      email,
      user.username,
      'circuit',
      track.name,
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
    handler: ({ params, body, user }) => shareTrack(params.id, body, user),
  })
)

async function getTrackShares(
  id: string,
  user?: JWTPayload
): Promise<GetSharesResponse> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const sharedUsers = await db
    .select({ email: users.email, username: users.username })
    .from(trackSharesUsers)
    .innerJoin(users, eq(users.id, trackSharesUsers.userId))
    .where(eq(trackSharesUsers.trackId, id))
  const sharedEmails = await db
    .select({ email: trackSharesEmails.email })
    .from(trackSharesEmails)
    .where(eq(trackSharesEmails.trackId, id))
  return { users: sharedUsers, emails: sharedEmails.map((e) => e.email) }
}

router.get(
  '/:id/shares',
  authenticate,
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrackShares(params.id, user),
  })
)

async function leaveTrack(id: string, user?: JWTPayload): Promise<void> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const result = await db
    .delete(trackSharesUsers)
    .where(
      and(
        eq(trackSharesUsers.trackId, id),
        eq(trackSharesUsers.userId, user.userId)
      )
    )
    .returning()
  if (result.length === 0) {
    throw new NotFoundError('Track share not found', codes.MISSING_TRACK)
  }
}

router.delete(
  '/:id/shares/me',
  authenticate,
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => leaveTrack(params.id, user),
  })
)

export default router
