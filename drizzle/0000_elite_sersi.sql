CREATE TABLE `passes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`wallet_provider` text NOT NULL,
	`provider_object_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passes_provider_object_id_unique` ON `passes` (`provider_object_id`);