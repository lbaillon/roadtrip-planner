import { env } from '#api/env.js'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export async function uploadGpx(
  trackName: string,
  gpxContent: string
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
        resolve(result.public_id)
      }
    )
    uploadStream.end(Buffer.from(gpxContent, 'utf-8'))
  })
}

export async function overwriteGpx(
  publicId: string,
  gpxContent: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
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
    uploadStream.end(Buffer.from(gpxContent, 'utf-8'))
  })
}

export async function deleteGpx(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
}

export async function getGpxFile(publicId: string): Promise<string> {
  const url = cloudinary.url(publicId, { resource_type: 'raw' })
  const response = await fetch(url)
  return response.text()
}
