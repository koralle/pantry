import { uuidv7 } from "uuidv7";
import * as v from "valibot";

import { userIdSchema } from "../../auth/domain/auth-values";
import type { UserId } from "../../auth/domain/auth-values";
import { tagIdSchema, tagNameSchema } from "../../tags/domain/tag-values";
import type { TagId, TagName } from "../../tags/domain/tag-values";
import {
  bookmarkIdSchema,
  bookmarkNoteSchema,
  bookmarkTitleSchema,
  bookmarkUrlSchema,
} from "../domain/bookmark-values";
import type {
  BookmarkId,
  BookmarkNote,
  BookmarkTitle,
  BookmarkUrl,
} from "../domain/bookmark-values";

export const bookmarkId = (value: string = uuidv7()): BookmarkId =>
  v.parse(bookmarkIdSchema, value);

export const bookmarkUrl = (value: string): BookmarkUrl =>
  v.parse(bookmarkUrlSchema, value);

export const bookmarkTitle = (value: string): BookmarkTitle =>
  v.parse(bookmarkTitleSchema, value);

export const bookmarkNote = (value: string | null): BookmarkNote =>
  v.parse(bookmarkNoteSchema, value);

export const tagId = (value: number): TagId => v.parse(tagIdSchema, value);

export const tagName = (value: string): TagName =>
  v.parse(tagNameSchema, value);

export const userId = (value: string): UserId => v.parse(userIdSchema, value);
