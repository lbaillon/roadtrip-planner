// import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
// import postgres from 'postgres'
import { createClient } from '@libsql/client'
import { drizzle as drizzleSqlite } from 'drizzle-orm/libsql'
import * as schema from './schema.js'
import { env } from '#api/env.js'

const isDev = env.NODE_ENV !== 'production'

// PostgreSQL connection (production)
// function createPgClient() {
//   const connectionString = env.DATABASE_URL
//   if (!connectionString) {
//     throw new Error('DATABASE_URL is not set')
//   }
//   const client = postgres(connectionString)
//   return drizzlePg(client, { schema })
// }

// SQLite connection (local development)
function createSqliteClient() {
  const client = createClient({
    url: isDev ? 'file:dev.db' : env.DATABASE_URL!,
    authToken: isDev ? undefined : env.TURSO_AUTH_TOKEN!,
  })
  return drizzleSqlite(client, { schema })
}

// export const db = isDev ? createSqliteClient() : createPgClient()
export const db = createSqliteClient()
