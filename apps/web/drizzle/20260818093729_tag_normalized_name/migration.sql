PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`color` text,
	`last_used_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	CONSTRAINT `fk_tags_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	CONSTRAINT `tags_user_id_normalized_name_unique` UNIQUE(`user_id`,`normalized_name`)
);
--> statement-breakpoint
INSERT INTO `__new_tags`("id", "user_id", "name", "normalized_name", "pinned", "sort_order", "color", "last_used_at", "created_at", "updated_at", "version") SELECT "id", "user_id", "name", "name", "pinned", "sort_order", "color", "last_used_at", "created_at", "updated_at", "version" FROM `tags`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
ALTER TABLE `__new_tags` RENAME TO `tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `tags` (`user_id`);--> statement-breakpoint
CREATE INDEX `tags_user_id_pinned_sort_order_idx` ON `tags` (`user_id`,`pinned`,`sort_order`);--> statement-breakpoint
CREATE INDEX `tags_user_id_last_used_at_idx` ON `tags` (`user_id`,`last_used_at`);
