CREATE TABLE `trip_tracks` (
	`trip_id` text NOT NULL,
	`track_id` text NOT NULL,
	`step` integer,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`trip_id`, `track_id`),
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`gpx_file` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tracks`("id", "user_id", "name", "gpx_file", "created_at", "updated_at") SELECT "id", "user_id", "name", "gpx_file", "created_at", "updated_at" FROM `tracks`;--> statement-breakpoint
DROP TABLE `tracks`;--> statement-breakpoint
ALTER TABLE `__new_tracks` RENAME TO `tracks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tracks_user_id_idx` ON `tracks` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_trips` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_trips`("id", "user_id", "name", "description", "created_at", "start_date", "end_date") SELECT "id", "user_id", "name", "description", "created_at", "start_date", "end_date" FROM `trips`;--> statement-breakpoint
DROP TABLE `trips`;--> statement-breakpoint
ALTER TABLE `__new_trips` RENAME TO `trips`;--> statement-breakpoint
CREATE INDEX `trips_user_id_idx` ON `trips` (`user_id`);