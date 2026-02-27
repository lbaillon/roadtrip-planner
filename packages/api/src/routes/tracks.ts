import { authenticate, authorize } from '#api/middlewares/auth.js'
import { JWTPayload } from '#api/services/authentication.js'
import { addWaypointToGpx, parseGpxFile } from '#api/services/gpx-parser.js'
import { Uploader } from '#api/services/uploader.js'
import {
  CreateResponse,
  CreateTrackRequest,
  CreateTrackRequestSchema,
  UpdateTrackRequest,
  UpdateTrackRequestSchema,
} from '@roadtrip/shared'
import { eq } from 'drizzle-orm'
import { Router, type Router as RouterType } from 'express'
import { db } from '../db/client.js'
import { tracks } from '../db/schema.js'
import {
  processDelete,
  processPost,
  processPut,
} from '../utils/route-handler.js'

const router: RouterType = Router()

export async function createTrack(
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

  return {
    id: track.id,
  }
}

router.post(
  '/',
  authenticate,
  authorize(['admin']),
  processPost(CreateTrackRequestSchema, createTrack)
)

export async function deleteTrack(id: string) {
  const [deletedTrack] = await db
    .delete(tracks)
    .where(eq(tracks.id, id))
    .returning()

  if (!deletedTrack) return null

  const publicId = deletedTrack.gpxFile
  await new Uploader().deleteGpx(publicId)

  return deletedTrack
}

router.delete('/:id', processDelete(deleteTrack))

export async function addWaypoint(id: string, body: UpdateTrackRequest) {
  const [track] = await db.select().from(tracks).where(eq(tracks.id, id))

  if (!track) return null

  const response = await fetch(track.gpxFile)
  const gpxContent = await response.text()

  const updatedGpx = addWaypointToGpx(gpxContent, body)

  const publicId = track.gpxFile

  await new Uploader().overwriteGpx(publicId, updatedGpx)

  return track
}

router.put('/:id/waypoints', processPut(UpdateTrackRequestSchema, addWaypoint))

export async function getUserTracks(id: string) {
  return await db.select().from(tracks).where(eq(tracks.userId, id))
}

router.get('/', authenticate, async (req, res) => {
  const tracks = await getUserTracks(req.user?.userId ?? '')
  res.json(tracks)
})

export default router
