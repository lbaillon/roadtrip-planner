import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { addWaypointToGpx, parseGpxFile } from '#api/services/gpx-parser.js'
import { Uploader } from '#api/services/uploader.js'
import {
  CreateResponse,
  CreateTrackRequest,
  CreateTrackRequestSchema,
  EmptyRequest,
  EmptyRequestSchema,
  UpdateTrackRequest,
  UpdateTrackRequestSchema,
} from '@roadtrip/shared'
import { and, eq } from 'drizzle-orm'
import { Router, type Router as RouterType } from 'express'
import { db } from '#api/db/client.js'
import { tracks } from '#api/db/schema.js'
import {
  processDelete,
  processGet,
  processPost,
  processPut,
} from '#api/utils/route-handler.js'

const router: RouterType = Router()

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
  authenticate,
  authorize(['user']),
  processPost(CreateTrackRequestSchema, createTrack)
)

async function deleteTrack(id: string, user?: JWTPayload) {
  if (!user) {
    throw Error('Missing user')
  }
  const [track] = await db
    .delete(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
    .returning()
  if (!track) {
    throw new Error('track not found')
  }
  const publicId = track.gpxFile
  await new Uploader().deleteGpx(publicId)
}

router.delete('/:id', authenticate, processDelete(deleteTrack))

async function addWaypoint(
  id: string,
  body: UpdateTrackRequest,
  user?: JWTPayload
) {
  if (!user) {
    throw Error('Missing user')
  }
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, id), eq(tracks.userId, user.userId)))
  if (!track) {
    throw new Error('track not found')
  }
  const response = await fetch(track.gpxFile)
  const gpxContent = await response.text()

  const updatedGpx = addWaypointToGpx(gpxContent, body)

  const publicId = track.gpxFile

  await new Uploader().overwriteGpx(publicId, updatedGpx)
}

router.put(
  '/:id/waypoints',
  authenticate,
  processPut(UpdateTrackRequestSchema, addWaypoint)
)

async function getUserTracks(query: EmptyRequest, user?: JWTPayload) {
  return await db
    .select()
    .from(tracks)
    .where(eq(tracks.userId, user?.userId ?? ''))
}

router.get('/', authenticate, processGet(EmptyRequestSchema, getUserTracks))

export default router
