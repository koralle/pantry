import { ORPCError } from "@orpc/server";
import * as v from "valibot";

import type { UserId } from "../../features/auth/domain/auth-values";
import {
  createTagInputSchema,
  executeCreateTag,
  toCreateTagCommand,
} from "../../features/tags/application/create-tag";
import type { InsertTag } from "../../features/tags/application/create-tag";
import {
  deleteTagInputSchema,
  executeDeleteTag,
} from "../../features/tags/application/delete-tag";
import type { DeleteTag } from "../../features/tags/application/delete-tag";
import {
  executeTouchTag,
  touchTagInputSchema,
} from "../../features/tags/application/touch-tag";
import type { TouchTag } from "../../features/tags/application/touch-tag";
import {
  executeUpdateTag,
  toUpdateTagCommand,
  updateTagInputSchema,
} from "../../features/tags/application/update-tag";
import type { UpdateTag } from "../../features/tags/application/update-tag";
import type { ShelfTag, TagRecord } from "../../features/tags/lib/tag-shelf";
import type { TagsListRow } from "../../features/tags/persistence/select-tags";
import { offsetPaginationQuerySchema } from "../../schemas/pagination";
import type { ProcedureKit } from "./procedure-kit";

const tagIdInputSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export interface TagsDeps {
  readonly insertTag: InsertTag;
  readonly updateTag: UpdateTag;
  readonly touchTag: TouchTag;
  readonly deleteTag: DeleteTag;
  readonly listShelfTags: (userId: UserId) => Promise<ShelfTag[]>;
  readonly listTags: (
    userId: UserId,
    page: v.InferOutput<typeof offsetPaginationQuerySchema>
  ) => Promise<TagsListRow[]>;
  readonly findTagById: (
    userId: UserId,
    id: number
  ) => Promise<TagRecord | null>;
}

export interface TouchTagOutput {
  readonly ok: true;
}

/** client へ branded `TagId` を出すと、画面が Domain の組み立てを知っていることになるため plain な型にする。 */
export interface CreateTagOutput {
  readonly id: number;
}

export interface UpdateTagOutput {
  readonly id: number;
}

export const createTagProcedures = (
  { base, requireAuth }: ProcedureKit,
  deps: TagsDeps
) => {
  const createTag = base
    .use(requireAuth)
    .input(createTagInputSchema)
    .errors({
      "tag-name-already-exists": {
        status: 409,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeCreateTag({
        command: toCreateTagCommand(input),
        insertTag: deps.insertTag,
        userId: context.userId,
      });

      if (!result.ok) {
        throw errors["tag-name-already-exists"]();
      }

      const output: CreateTagOutput = {
        id: Number(result.value.id),
      };

      return output;
    });
  const updateTag = base
    .use(requireAuth)
    .input(updateTagInputSchema)
    .errors({
      "tag-name-already-exists": {
        status: 409,
      },
      "tag-not-found": {
        status: 404,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeUpdateTag({
        command: toUpdateTagCommand(input),
        updateTag: deps.updateTag,
        userId: context.userId,
      });

      if (!result.ok) {
        if (result.error.code === "tag-name-already-exists") {
          throw errors["tag-name-already-exists"]();
        }
        if (result.error.code === "tag-not-found") {
          throw errors["tag-not-found"]();
        }
        throw new ORPCError("INTERNAL_SERVER_ERROR");
      }

      const output: UpdateTagOutput = {
        id: Number(result.value.id),
      };

      return output;
    });

  const touchTag = base
    .use(requireAuth)
    .input(touchTagInputSchema)
    .errors({
      "tag-not-found": {
        status: 404,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeTouchTag({
        id: input.id,
        touchTag: deps.touchTag,
        userId: context.userId,
      });

      if (!result.ok) {
        throw errors["tag-not-found"]();
      }

      const output: TouchTagOutput = {
        ok: true,
      };

      return output;
    });

  const deleteTag = base
    .use(requireAuth)
    .input(deleteTagInputSchema)
    .errors({
      "tag-not-found": {
        status: 404,
      },
    })
    .handler(async ({ input, context, errors }) => {
      const result = await executeDeleteTag({
        deleteTag: deps.deleteTag,
        id: input.id,
        userId: context.userId,
      });

      if (!result.ok) {
        throw errors["tag-not-found"]();
      }

      return { id: Number(result.value.id) };
    });
  return {
    byId: base
      .use(requireAuth)
      .input(tagIdInputSchema)
      .errors({
        "tag-not-found": {
          status: 404,
        },
      })
      .handler(async ({ input, context, errors }) => {
        const record = await deps.findTagById(context.userId, input.id);
        if (record === null || record === undefined) {
          throw errors["tag-not-found"]();
        }
        return record;
      }),
    create: createTag,
    delete: deleteTag,
    list: base
      .use(requireAuth)
      .input(offsetPaginationQuerySchema)
      .handler(
        async ({ input, context }) => await deps.listTags(context.userId, input)
      ),
    shelf: base
      .use(requireAuth)
      .handler(async ({ context }) => await deps.listShelfTags(context.userId)),
    touch: touchTag,
    update: updateTag,
  };
};
