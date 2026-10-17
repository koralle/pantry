import { getDB } from "../../db/get-db.server";
import { deleteTag } from "../../features/tags/persistence/delete-tag";
import { insertTag } from "../../features/tags/persistence/insert-tag";
import { selectShelfTags } from "../../features/tags/persistence/select-shelf-tags";
import { selectTagById } from "../../features/tags/persistence/select-tag-by-id";
import { selectTags } from "../../features/tags/persistence/select-tags";
import { touchTag } from "../../features/tags/persistence/touch-tag";
import { updateTag } from "../../features/tags/persistence/update-tag";
import type { TagsDeps } from "../contract/tag-procedures";

/** タグの procedure の本番配線（Drizzle）。 */
export const tagsDeps: TagsDeps = {
  deleteTag: async (input) => await deleteTag(getDB(), input),
  findTagById: async (userId, id) => await selectTagById(getDB(), userId, id),
  insertTag: async (input) => await insertTag(getDB(), input),
  listShelfTags: async (userId) => await selectShelfTags(getDB(), userId),
  listTags: async (userId, page) => await selectTags(getDB(), userId, page),
  touchTag: async (input) => await touchTag(getDB(), input),
  updateTag: async (input) => await updateTag(getDB(), input),
};
