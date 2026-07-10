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
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MAIL_FROM: process.env.MAIL_FROM || 'no-reply@my-roadtrip.fr',
  WEB_APP_URL: process.env.WEB_APP_URL || 'http://localhost:5173',
  API_URL: process.env.API_URL || 'http://localhost:3000',
  PORT: parseInt(process.env.PORT || '3000', 10),
} as const

if (!env.isDev && !env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production')
}
if (!env.isDev && env.API_URL.includes('localhost')) {
  throw new Error('API_URL must be set to the public API URL in production')
}
if (!env.isDev && env.WEB_APP_URL.includes('localhost')) {
  throw new Error(
    'WEB_APP_URL must be set to the public web app URL in production'
  )
}
if (!env.OPENWEATHER_API_KEY) {
  throw new Error('API key undefined')
}
