import type { TagsDeps } from "./tag-procedures";

export const stubTagsDeps = (): TagsDeps => ({
  deleteTag: async () => ({ kind: "deleted" }),
  findTagById: async () => null,
  insertTag: async () => ({ id: 1 as never, kind: "created" }),
  listShelfTags: async () => [],
  listTags: async () => [],
  touchTag: async () => ({ kind: "touched" }),
  updateTag: async () => ({ kind: "not-found" }),
});
