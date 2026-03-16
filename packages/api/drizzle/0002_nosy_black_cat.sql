PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trip_tracks` (
	`trip_id` text NOT NULL,
	`track_id` text NOT NULL,
	`step` integer NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`trip_id`, `track_id`),
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_trip_tracks`("trip_id", "track_id", "step", "created_at") SELECT "trip_id", "track_id", coalesce("step", 0), "created_at" FROM `trip_tracks`;--> statement-breakpoint
DROP TABLE `trip_tracks`;--> statement-breakpoint
ALTER TABLE `__new_trip_tracks` RENAME TO `trip_tracks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;