import { ORPCError } from "@orpc/server";

import {
  executeCreateTag,
  toCreateTagCommand,
} from "../features/tags/application/create-tag";
import { executeDeleteTag } from "../features/tags/application/delete-tag";
import { executeTouchTag } from "../features/tags/application/touch-tag";
import {
  executeUpdateTag,
  toUpdateTagCommand,
} from "../features/tags/application/update-tag";
import { deleteTag } from "../features/tags/db/delete-tag";
import { insertTag } from "../features/tags/db/insert-tag";
import { selectShelfTags } from "../features/tags/db/select-shelf-tags";
import { selectTagById } from "../features/tags/db/select-tag-by-id";
import { selectTags } from "../features/tags/db/select-tags";
import { touchTag } from "../features/tags/db/touch-tag";
import { updateTag } from "../features/tags/db/update-tag";
import type { RouterKit } from "./base";

export const createTagsRouter = ({ impl, requireAuthWithDb }: RouterKit) => ({
  byId: impl.tags.byId
    .use(requireAuthWithDb)
    .handler(async ({ context, errors, input }) => {
      const record = await selectTagById(context.db, context.userId, input.id);
      if (record === null) {
        throw errors["tag-not-found"]();
      }
      return record;
    }),
  create: impl.tags.create
    .use(requireAuthWithDb)
    .handler(async ({ context, errors, input }) => {
      const db = context.db;
      const result = await executeCreateTag({
        command: toCreateTagCommand(input),
        insertTag: async (row) => await insertTag(db, row),
        userId: context.userId,
      });
      if (!result.ok) {
        throw errors["tag-name-already-exists"]();
      }
      return { id: Number(result.value.id) };
    }),
  delete: impl.tags.delete
    .use(requireAuthWithDb)
    .handler(async ({ context, errors, input }) => {
      const db = context.db;
      const result = await executeDeleteTag({
        deleteTag: async (target) => await deleteTag(db, target),
        id: input.id,
        userId: context.userId,
      });
      if (!result.ok) {
        throw errors["tag-not-found"]();
      }
      return { id: Number(result.value.id) };
    }),
  list: impl.tags.list
    .use(requireAuthWithDb)
    .handler(
      async ({ context, input }) =>
        await selectTags(context.db, context.userId, input)
    ),
  shelf: impl.tags.shelf
    .use(requireAuthWithDb)
    .handler(
      async ({ context }) => await selectShelfTags(context.db, context.userId)
    ),
  touch: impl.tags.touch
    .use(requireAuthWithDb)
    .handler(async ({ context, errors, input }) => {
      const db = context.db;
      const result = await executeTouchTag({
        id: input.id,
        touchTag: async (target) => await touchTag(db, target),
        userId: context.userId,
      });
      if (!result.ok) {
        throw errors["tag-not-found"]();
      }
      return { ok: true as const };
    }),
  update: impl.tags.update
    .use(requireAuthWithDb)
    .handler(async ({ context, errors, input }) => {
      const db = context.db;
      const result = await executeUpdateTag({
        command: toUpdateTagCommand(input),
        updateTag: async (row) => await updateTag(db, row),
        userId: context.userId,
      });
      if (result.ok) {
        return { id: Number(result.value.id) };
      }
      if (result.error.code === "tag-name-already-exists") {
        throw errors["tag-name-already-exists"]();
      }
      if (result.error.code === "tag-not-found") {
        throw errors["tag-not-found"]();
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }),
});
