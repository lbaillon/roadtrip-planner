import { v2 as cloudinary } from 'cloudinary'

export class Uploader {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }
  async uploadGpx(trackName: string, gpxContent: string) : Promise <string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'gpx-tracks',
          public_id: `${Date.now()}-${trackName.replace(/\s+/g, '-')}`,
          format: 'gpx',
        },
        (error, result) => {
          if (error || !result)
            return reject(error ?? new Error('Upload failed'))
          resolve(result.public_id)
        }
      )

      const buffer = Buffer.from(gpxContent, 'utf-8')
      uploadStream.end(buffer)
    })
  }

  async overwriteGpx(publicId:string, gpxContent:string) : Promise<void> {
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

  async deleteGpx(publicId: string) : Promise<void> {
    return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })

  }

}


