import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'
import { drizzle as drizzleSqlite} from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

const isDev = process.env.NODE_ENV !== 'production'

// PostgreSQL connection (production)
// function createPgClient() {
//   const connectionString = process.env.DATABASE_URL
//   if (!connectionString) {
//     throw new Error('DATABASE_URL is not set')
//   }
//   const client = postgres(connectionString)
//   return drizzlePg(client, { schema })
// }

// SQLite connection (local development)
function createSqliteClient() {
const client = createClient({
  url: isDev ? 'file:dev.db' : process.env.DATABASE_URL!,
})
  return drizzleSqlite(client, { schema })
}

// export const db = isDev ? createSqliteClient() : createPgClient()
export const db =  createSqliteClient()