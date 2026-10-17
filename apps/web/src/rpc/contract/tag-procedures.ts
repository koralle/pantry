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

/** タグの procedure が使う service。本番は router.server.ts が Drizzle の実装を渡す。 */
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

/**
 * HTTP 上の TouchTag 成功形。Application の branded `TagId` は載せない。
 */
export interface TouchTagOutput {
  readonly ok: true;
}

/**
 * HTTP 上の CreateTag 成功形。Application の branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。client へ TagId を出すと、
 * 画面が Domain の組み立てを知っていることになってしまう。
 */
export interface CreateTagOutput {
  readonly id: number;
}

/**
 * HTTP 上の UpdateTag 成功形。branded `TagId` は載せない。
 * brand は型システムの印で、JSON には残らない。
 */
export interface UpdateTagOutput {
  readonly id: number;
}

/** `tags.*` の procedure。 */
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

  /** 成功なら plain number ID を wire へ返す。削除は紐付け解除込み。 */
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
