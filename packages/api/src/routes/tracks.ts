import { db } from '#api/db/client.js'
import { tracks, trips, tripTracks } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import {
  authenticate,
  authenticateOptional,
  authorize,
} from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
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
  GetTrackResponse,
  GetTrackVisibilityResponse,
  IdParamsSchema,
  TrackSummary,
  UpdateTrackGpxRequest,
  UpdateTrackGpxRequestSchema,
  UpdateTrackPublicStatusRequestSchema,
} from '@roadtrip/shared'

import { and, eq, or } from 'drizzle-orm'
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
  return await db
    .select()
    .from(tracks)
    .where(eq(tracks.userId, user?.userId ?? ''))
}

router.get(
  '/',
  authenticate,
  processGet({ handler: ({ user }) => getUserTracks(user) })
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
    })
    .from(tracks)
    .leftJoin(tripTracks, eq(tripTracks.trackId, tracks.id))
    .leftJoin(trips, eq(trips.id, tripTracks.tripId))
    .where(
      and(
        eq(tracks.id, id),
        or(
          eq(tracks.isPublic, true),
          eq(tracks.userId, user?.userId ?? ''),
          eq(trips.isPublic, true)
        )
      )
    )
    .limit(1)
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const gpxContent = await getGpxFile(track.gpxFile)

  return { id: track.id, gpxContent, isPublic: track.isPublic }
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

export default router
