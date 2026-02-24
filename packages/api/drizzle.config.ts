import type { Config } from 'drizzle-kit'

const isDev = process.env.NODE_ENV !== 'production'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isDev ? 'sqlite' : 'postgresql',
  dbCredentials: {
    url: isDev ? 'file:dev.db' : process.env.DATABASE_URL!,
  },
} satisfies Config
