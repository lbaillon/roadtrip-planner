import type { Config } from 'drizzle-kit'
import dotenv from 'dotenv'

dotenv.config()

const isDev = process.env.NODE_ENV !== 'production'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isDev ? 'sqlite' : 'turso',
  dbCredentials: isDev
    ? {
        url: 'file:dev.db',
      }
    : {
        url: process.env.DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
} satisfies Config
