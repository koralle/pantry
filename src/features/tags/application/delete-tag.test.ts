import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../auth/domain/auth-values";
import { tagIdSchema } from "../domain/tag-values";
import { deleteTagInputSchema, executeDeleteTag } from "./delete-tag";
import type { DeleteTag, DeleteTagInput, DeleteTagOutput } from "./delete-tag";

function parseUserId(value: string) {
  return v.parse(userIdSchema, value);
}

function parseTagId(value: number) {
  return v.parse(tagIdSchema, value);
}

/**
 * 戻り値を固定した port。Drizzle のメソッドチェーンは mock しない。
 * Application は SQL の組み立てを知らない、という境界をテストが壊さないため。
 */
function fakeDeleteTag(output: DeleteTagOutput): DeleteTag {
  return async (_input: DeleteTagInput) => output;
}

describe("deleteTagInputSchema", () => {
  test("正の整数の id を受け付ける", () => {
    expect(v.parse(deleteTagInputSchema, { id: 3 })).toStrictEqual({
      id: parseTagId(3),
    });
  });

  test("0 以下や小数の id は拒否する", () => {
    expect(() => v.parse(deleteTagInputSchema, { id: 0 })).toThrow();
    expect(() => v.parse(deleteTagInputSchema, { id: 1.5 })).toThrow();
  });
});

describe(executeDeleteTag, () => {
  test("deleted を成功 Result に写す", async () => {
    const result = await executeDeleteTag({
      deleteTag: fakeDeleteTag({ kind: "deleted" }),
      id: parseTagId(7),
      userId: parseUserId("user-1"),
    });

    expect(result).toStrictEqual({ ok: true, value: { id: parseTagId(7) } });
  });

  test("not-found を tag-not-found に写す", async () => {
    const result = await executeDeleteTag({
      deleteTag: fakeDeleteTag({ kind: "not-found" }),
      id: parseTagId(7),
      userId: parseUserId("user-1"),
    });

    expect(result).toStrictEqual({
      error: { code: "tag-not-found" },
      ok: false,
    });
  });

  test("userId と id を port へそのまま渡す", async () => {
    const received: DeleteTagInput[] = [];
    const deleteTag: DeleteTag = async (input) => {
      received.push(input);
      return { kind: "deleted" };
    };

    await executeDeleteTag({
      deleteTag,
      id: parseTagId(9),
      userId: parseUserId("user-2"),
    });

    expect(received).toStrictEqual([
      { id: parseTagId(9), userId: parseUserId("user-2") },
    ]);
  });
});
