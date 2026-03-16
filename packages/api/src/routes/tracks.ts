import { db } from '#api/db/client.js'
import { tracks } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import {
  addWaypointToGpx,
  deleteWaypointFromGpx,
  editWaypointInGpx,
  parseGpxFile,
} from '#api/services/gpx-parser.js'
import { Uploader } from '#api/services/uploader.js'
import {
  processDelete,
  processGet,
  processPatch,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import {
  CreateResponse,
  CreateTrackRequest,
  CreateTrackRequestSchema,
  EditWaypointRequest,
  EditWaypointRequestSchema,
  GetTrackResponse,
  IdParamsSchema,
  TrackSummary,
  UpdateTrackRequest,
  UpdateTrackRequestSchema,
  WaypointParams,
  WaypointParamsSchema,
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
    throw Error('Missing user')
  }
  const parsed = parseGpxFile(body.gpxContent)
  const trackName = body.name ?? parsed.name ?? 'unknown-track'

  const gpxPublicId = await new Uploader().uploadGpx(trackName, body.gpxContent)

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
  await new Uploader().deleteGpx(publicId)
}

router.delete(
  '/:id',
  processDelete({
    paramsSchema: IdParamsSchema,
    handler: ({ params, user }) => deleteTrack(params.id, user),
  })
)

async function addWaypoint(
  id: string,
  body: UpdateTrackRequest,
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
  const gpxContent = await new Uploader().getGpxFile(track.gpxFile)

  const updatedGpx = addWaypointToGpx(gpxContent, body)

  const publicId = track.gpxFile

  await new Uploader().overwriteGpx(publicId, updatedGpx)
}

router.put(
  '/:id/waypoints',
  processPut({
    paramsSchema: IdParamsSchema,
    bodySchema: UpdateTrackRequestSchema,
    handler: ({ params, body, user }) => addWaypoint(params.id, body, user),
  })
)

async function editWaypoint(
  params: WaypointParams,
  body: EditWaypointRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, params.id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const gpxContent = await new Uploader().getGpxFile(track.gpxFile)
  const updatedGpx = editWaypointInGpx(gpxContent, params.index, body)
  await new Uploader().overwriteGpx(track.gpxFile, updatedGpx)
}

router.patch(
  '/:id/waypoints/:index',
  processPatch({
    paramsSchema: WaypointParamsSchema,
    bodySchema: EditWaypointRequestSchema,
    handler: ({ params, body, user }) => editWaypoint(params, body, user),
  })
)

async function deleteWaypointAtIndex(
  params: WaypointParams,
  user?: JWTPayload
) {
  if (!user) {
    throw new UnauthorizedError('Missing user', codes.MISSING_USER)
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, params.id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new NotFoundError('track not found', codes.MISSING_TRACK)
  }
  const gpxContent = await new Uploader().getGpxFile(track.gpxFile)
  const updatedGpx = deleteWaypointFromGpx(gpxContent, params.index)
  await new Uploader().overwriteGpx(track.gpxFile, updatedGpx)
}

router.delete(
  '/:id/waypoints/:index',
  processDelete({
    paramsSchema: WaypointParamsSchema,
    handler: ({ params, user }) => deleteWaypointAtIndex(params, user),
  })
)

async function getUserTracks(user?: JWTPayload) :Promise<TrackSummary[]>{
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
  const gpxContent = await new Uploader().getGpxFile(track.gpxFile)

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
