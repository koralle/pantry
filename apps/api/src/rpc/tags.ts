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
import { deleteTag } from "../features/tags/persistence/delete-tag";
import { insertTag } from "../features/tags/persistence/insert-tag";
import { selectShelfTags } from "../features/tags/persistence/select-shelf-tags";
import { selectTagById } from "../features/tags/persistence/select-tag-by-id";
import { selectTags } from "../features/tags/persistence/select-tags";
import { touchTag } from "../features/tags/persistence/touch-tag";
import { updateTag } from "../features/tags/persistence/update-tag";
import type { RouterKit } from "./base";

export const createTagsRouter = ({ deps, impl, requireAuth }: RouterKit) => ({
  byId: impl.tags.byId
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const record = await selectTagById(deps.db(), context.userId, input.id);
      if (record === null) {
        throw errors["tag-not-found"]();
      }
      return record;
    }),
  create: impl.tags.create
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const db = deps.db();
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
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const db = deps.db();
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
    .use(requireAuth)
    .handler(
      async ({ context, input }) =>
        await selectTags(deps.db(), context.userId, input)
    ),
  shelf: impl.tags.shelf
    .use(requireAuth)
    .handler(
      async ({ context }) => await selectShelfTags(deps.db(), context.userId)
    ),
  touch: impl.tags.touch
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const db = deps.db();
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
    .use(requireAuth)
    .handler(async ({ context, errors, input }) => {
      const db = deps.db();
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
