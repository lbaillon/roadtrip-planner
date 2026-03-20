import { db } from '#api/db/client.js'
import { tracks } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
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
  IdParamsSchema,
  TrackSummary,
  UpdateTrackGpxRequest,
  UpdateTrackGpxRequestSchema,
} from '@roadtrip/shared'

import { and, eq } from 'drizzle-orm'
import { Router } from 'express'

const router: Router = Router()
router.use(authenticate)

async function createTrack(
  body: CreateTrackRequest,
  user?: JWTPayload
): Promise<CreateResponse> {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const trackName = body.name ?? 'Unnamed Track'
  const gpxPublicId = await uploadGpx(trackName, body.gpxContent)

  const [track] = await db
    .insert(tracks)
    .values({
      userId: user.userId,
      name: trackName,
      gpxFile: gpxPublicId,
    })
    .returning()
  return { id: track.id }
}

router.post(
  '/',
  authorize(['user', 'admin']),
  processPost({
    bodySchema: CreateTrackRequestSchema,
    handler: ({ body, user }) => createTrack(body, user),
  })
)

async function deleteTrack(id: string, user?: JWTPayload) {
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
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteTrack(params.id, user),
  })
)

async function updateTrackGpx(
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
}

router.put(
  '/:id',
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

router.get('/', processGet({ handler: ({ user }) => getUserTracks(user) }))

async function getTrack(
  id: string,
  user?: JWTPayload
): Promise<GetTrackResponse> {
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
  const gpxContent = await getGpxFile(track.gpxFile)

  return { id: track.id, name: track.name, gpxContent }
}

router.get(
  '/:id',
  processGet({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => getTrack(params.id, user),
  })
)

export default router
