CREATE TABLE `track_shares_emails` (
	`fk_track_id` text NOT NULL,
	`email` text NOT NULL,
	PRIMARY KEY(`fk_track_id`, `email`),
	FOREIGN KEY (`fk_track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `track_shares_users` (
	`fk_track_id` text NOT NULL,
	`fk_user_id` text NOT NULL,
	PRIMARY KEY(`fk_track_id`, `fk_user_id`),
	FOREIGN KEY (`fk_track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fk_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trip_shares_emails` (
	`fk_trip_id` text NOT NULL,
	`email` text NOT NULL,
	PRIMARY KEY(`fk_trip_id`, `email`),
	FOREIGN KEY (`fk_trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trip_shares_users` (
	`fk_trip_id` text NOT NULL,
	`fk_user_id` text NOT NULL,
	PRIMARY KEY(`fk_trip_id`, `fk_user_id`),
	FOREIGN KEY (`fk_trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fk_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `confirmation_key` text;