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
  confirmationKey: text('confirmation_key'),
  resetKey: text('reset_key'),
  resetKeyExpiresAt: integer('reset_key_expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const tracks = sqliteTable(
  'tracks',
  {
    id: text('id').primaryKey(),
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
    isPublic: integer('is_public', { mode: 'boolean' })
      .notNull()
      .default(false),
  },
  (table) => [index('tracks_user_id_idx').on(table.userId)]
)

export const trips = sqliteTable(
  'trips',
  {
    id: text('id').primaryKey(),
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
    isPublic: integer('is_public', { mode: 'boolean' })
      .notNull()
      .default(false),
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
    step: integer('step').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.trackId] })]
)

export const trackSharesEmails = sqliteTable(
  'track_shares_emails',
  {
    trackId: text('fk_track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    email: text('email').notNull(),
  },
  (table) => [primaryKey({ columns: [table.trackId, table.email] })]
)

export const tripSharesEmails = sqliteTable(
  'trip_shares_emails',
  {
    tripId: text('fk_trip_id')
      .references(() => trips.id, { onDelete: 'cascade' })
      .notNull(),
    email: text('email').notNull(),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.email] })]
)

export const trackSharesUsers = sqliteTable(
  'track_shares_users',
  {
    trackId: text('fk_track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('fk_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.trackId, table.userId] })]
)

export const tripSharesUsers = sqliteTable(
  'trip_shares_users',
  {
    tripId: text('fk_trip_id')
      .references(() => trips.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('fk_user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status', {
      enum: ['pending', 'accepted', 'declined'],
    })
      .notNull()
      .default('pending'),
  },
  (table) => [primaryKey({ columns: [table.tripId, table.userId] })]
)

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Track = typeof tracks.$inferSelect
export type NewTrack = typeof tracks.$inferInsert
export type Trip = typeof trips.$inferSelect
export type NewTrip = typeof trips.$inferInsert
export type TrackShareEmail = typeof trackSharesEmails.$inferSelect
export type NewTrackShareEmail = typeof trackSharesEmails.$inferInsert
export type TripShareEmail = typeof tripSharesEmails.$inferSelect
export type NewTripShareEmail = typeof tripSharesEmails.$inferInsert
export type TrackShareUser = typeof trackSharesUsers.$inferSelect
export type NewTrackShareUser = typeof trackSharesUsers.$inferInsert
export type TripShareUser = typeof tripSharesUsers.$inferSelect
export type NewTripShareUser = typeof tripSharesUsers.$inferInsert
