CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`latest_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_owner_idx` ON `tasks` (`owner`);--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`number` integer NOT NULL,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `versions_task_number_idx` ON `versions` (`task_id`,`number`);