ALTER TABLE `tags` ADD `pinned` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tags` ADD `color` text;--> statement-breakpoint
ALTER TABLE `tags` ADD `last_used_at` integer;--> statement-breakpoint
CREATE INDEX `tags_user_id_pinned_sort_order_idx` ON `tags` (`user_id`,`pinned`,`sort_order`);--> statement-breakpoint
CREATE INDEX `tags_user_id_last_used_at_idx` ON `tags` (`user_id`,`last_used_at`);