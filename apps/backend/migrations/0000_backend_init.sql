CREATE TABLE `bookmarks` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `url` text NOT NULL,
  `title` text NOT NULL,
  `note` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `deleted_at` text
);

CREATE TABLE `tags` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `name` text NOT NULL,
  `created_at` text NOT NULL
);

CREATE TABLE `bookmark_tags` (
  `bookmark_id` text NOT NULL,
  `tag_id` text NOT NULL,
  PRIMARY KEY (`bookmark_id`, `tag_id`),
  FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON DELETE cascade,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX `bookmarks_user_url_active_unique`
  ON `bookmarks` (`user_id`, `url`)
  WHERE `deleted_at` IS NULL;

CREATE INDEX `bookmarks_user_created_idx`
  ON `bookmarks` (`user_id`, `created_at` DESC);

CREATE INDEX `bookmarks_user_updated_idx`
  ON `bookmarks` (`user_id`, `updated_at` DESC);

CREATE UNIQUE INDEX `tags_user_name_unique`
  ON `tags` (`user_id`, `name`);

CREATE INDEX `tags_user_name_idx`
  ON `tags` (`user_id`, `name`);

CREATE INDEX `bookmark_tags_bookmark_idx`
  ON `bookmark_tags` (`bookmark_id`);

CREATE INDEX `bookmark_tags_tag_idx`
  ON `bookmark_tags` (`tag_id`);
