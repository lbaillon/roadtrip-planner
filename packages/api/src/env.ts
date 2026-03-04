import dotenv from 'dotenv'

dotenv.config()

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret',
  DATABASE_URL: process.env.DATABASE_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PORT: parseInt(process.env.PORT || '3000', 10),
} as const

if (!env.isDev && !env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production')
}
