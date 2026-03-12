import { relations, sql } from "drizzle-orm";
import { index, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const utcTimestamp = (name: string) => text(name).notNull();

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    note: text("note"),
    createdAt: utcTimestamp("created_at"),
    updatedAt: utcTimestamp("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("bookmarks_user_url_active_unique")
      .on(table.userId, table.url)
      .where(sql`${table.deletedAt} IS NULL`),
    index("bookmarks_user_created_idx").on(table.userId, table.createdAt),
    index("bookmarks_user_updated_idx").on(table.userId, table.updatedAt),
  ],
);

export const tags = sqliteTable(
  "tags",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    createdAt: utcTimestamp("created_at"),
  },
  (table) => [
    uniqueIndex("tags_user_name_unique").on(table.userId, table.name),
    index("tags_user_name_idx").on(table.userId, table.name),
  ],
);

export const bookmarkTags = sqliteTable(
  "bookmark_tags",
  {
    bookmarkId: text("bookmark_id")
      .notNull()
      .references(() => bookmarks.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.tagId] }),
    index("bookmark_tags_bookmark_idx").on(table.bookmarkId),
    index("bookmark_tags_tag_idx").on(table.tagId),
  ],
);

export const bookmarksRelations = relations(bookmarks, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  bookmarkTags: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));
