import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  profilePicture: text('profile-picture'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const tracks = sqliteTable(
  'tracks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    gpxFile: text('gpx_file').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('tracks_user_id_idx').on(table.userId)]
)

export const trips = sqliteTable(
  'trips',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    startDate: text('start_date'),
    endDate: text('end_date'),
  },
  (table) => [index('trips_user_id_idx').on(table.userId)]
)

export const tripTracks = sqliteTable(
  'trip_tracks',
  {
    tripId: text('trip_id')
      .references(() => trips.id, { onDelete: 'cascade' })
      .notNull(),
    trackId: text('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    step: integer('step'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.trackId] })]
)

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Track = typeof tracks.$inferSelect
export type NewTrack = typeof tracks.$inferInsert
export type Trip = typeof trips.$inferSelect
export type NewTrip = typeof trips.$inferInsert
