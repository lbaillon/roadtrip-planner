import { db } from '#api/db/client.js'
import { tracks } from '#api/db/schema.js'
import { NotFoundError, UnauthorizedError } from '#api/errors/app-errors.js'
import { codes } from '#api/errors/error-codes.js'
import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { addWaypointToGpx, parseGpxFile } from '#api/services/gpx-parser.js'
import { Uploader } from '#api/services/uploader.js'
import {
  processDelete,
  processGet,
  processGetOne,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'
import {
  CreateResponse,
  CreateTrackRequest,
  CreateTrackRequestSchema,
  EmptyRequest,
  EmptyRequestSchema,
  GetTrackResponse,
  UpdateTrackRequest,
  UpdateTrackRequestSchema,
} from '@roadtrip/shared'
import { and, eq } from 'drizzle-orm'
import { Router, type Router as RouterType } from 'express'

const router: RouterType = Router()
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
  authorize(['user']),
  processPost(CreateTrackRequestSchema, createTrack)
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

router.delete('/:id', processDelete(deleteTrack))

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

router.put('/:id/waypoints', processPut(UpdateTrackRequestSchema, addWaypoint))

async function getUserTracks(query: EmptyRequest, user?: JWTPayload) {
  return await db
    .select()
    .from(tracks)
    .where(eq(tracks.userId, user?.userId ?? ''))
}

router.get('/', processGet(EmptyRequestSchema, getUserTracks))

async function getTrack(id: string, user?: JWTPayload) : Promise <GetTrackResponse> {
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

  return {id: track.id, name:track.name, gpxContent}
}

router.get('/:id', processGetOne(getTrack))

export default router
