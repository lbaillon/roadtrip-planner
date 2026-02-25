import { db } from '../db/client.js'
import { Router, type Router as RouterType } from 'express'
import { processPost } from '../utils/route-handler.js'
import { tracks } from '../db/schema.js'
import { CreateTrackRequest, CreateTrackRequestSchema, CreateTrackResponse } from '@roadtrip/shared'
import { parseGpxFile } from '#api/services/gpx-parser.js'
import { v2 as cloudinary } from 'cloudinary'


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const router: RouterType = Router()

async function uploadGpxToCloudinary(gpxContent: string, trackName: string): Promise<string> {
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
): Promise<CreateTrackResponse> {
  const parsed = parseGpxFile(body.gpxContent)

  const trackName = body.name ?? parsed.name ?? 'unknown-track'

  const gpxUrl = await uploadGpxToCloudinary(body.gpxContent, trackName)

  const [track] = await db
    .insert(tracks)
    .values({
      userId: body.userId,
      name: trackName,
      gpxFile : gpxUrl,
    })
    .returning()

  return {
    id: track.id
  }
}

router.post('/', processPost(CreateTrackRequestSchema, createTrack))


export default router