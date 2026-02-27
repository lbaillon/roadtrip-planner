import { db } from '../db/client.js'
import { Router, type Router as RouterType } from 'express'
import {
  processDelete,
  processPost,
  processPut,
} from '../utils/route-handler.js'
import { tracks } from '../db/schema.js'
import {
  CreateTrackRequest,
  CreateTrackRequestSchema,
  CreateResponse,
  UpdateTrackRequest,
  UpdateTrackRequestSchema,
} from '@roadtrip/shared'
import { addWaypointToGpx, parseGpxFile } from '#api/services/gpx-parser.js'
import { v2 as cloudinary } from 'cloudinary'
import { eq } from 'drizzle-orm'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const router: RouterType = Router()

async function uploadGpxToCloudinary(
  gpxContent: string,
  trackName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'gpx-tracks',
        public_id: `${Date.now()}-${trackName.replace(/\s+/g, '-')}`,
        format: 'gpx',
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )

    const buffer = Buffer.from(gpxContent, 'utf-8')
    uploadStream.end(buffer)
  })
}

export async function createTrack(
  body: CreateTrackRequest
): Promise<CreateResponse> {
  const parsed = parseGpxFile(body.gpxContent)

  const trackName = body.name ?? parsed.name ?? 'unknown-track'

  const gpxUrl = await uploadGpxToCloudinary(body.gpxContent, trackName)

  const [track] = await db
    .insert(tracks)
    .values({
      userId: body.userId,
      name: trackName,
      gpxFile: gpxUrl,
    })
    .returning()

  return {
    id: track.id,
  }
}

router.post('/', processPost(CreateTrackRequestSchema, createTrack))

export async function deleteTrack(id: string) {
  const [deletedTrack] = await db
    .delete(tracks)
    .where(eq(tracks.id, id))
    .returning()

  if (!deletedTrack) return null

  // Extraire le public_id depuis l'URL cloudinary
  // L'URL ressemble à : https://res.cloudinary.com/.../gpx-tracks/1234567890-mon-track.gpx
  const publicId = new URL(deletedTrack.gpxFile).pathname
    .split('/upload/')[1]
    .replace(/^v\d+\//, '')
    .replace('.gpx', '')

  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })

  return deletedTrack
}

router.delete('/:id', processDelete(deleteTrack))

export async function addWaypoint(id: string, body: UpdateTrackRequest) {
  const [track] = await db.select().from(tracks).where(eq(tracks.id, id))

  if (!track) return null

  const response = await fetch(track.gpxFile)
  const gpxContent = await response.text()

  const updatedGpx = addWaypointToGpx(gpxContent, body)

  const publicId = new URL(track.gpxFile).pathname
    .split('/upload/')[1]
    .replace(/^v\d+\//, '')
    .replace('.gpx', '')

  await new Promise<void>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        format: 'gpx',
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve()
      }
    )
    uploadStream.end(Buffer.from(updatedGpx, 'utf-8'))
  })

  return track
}

router.put('/:id/waypoints', processPut(UpdateTrackRequestSchema, addWaypoint))

export default router
