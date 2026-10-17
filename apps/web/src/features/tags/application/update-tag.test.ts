import * as v from "valibot";
import { describe, expect, test } from "vitest";

import { userIdSchema } from "../../auth/domain/auth-values";
import { tagIdSchema, tagNameSchema } from "../domain/tag-values";
import {
  executeUpdateTag,
  toUpdateTagCommand,
  updateTagInputSchema,
} from "./update-tag";
import type { UpdateTag, UpdateTagInput, UpdateTagOutput } from "./update-tag";

function parseInput(input: unknown) {
  return v.parse(updateTagInputSchema, input);
}

function fakeUpdateTag(output: UpdateTagOutput): UpdateTag {
  return async (_input: UpdateTagInput) => output;
}

const userId = v.parse(userIdSchema, "user-1");
const tagId = v.parse(tagIdSchema, 7);

describe(toUpdateTagCommand, () => {
  test("wire inputをbranded commandへ変換する", () => {
    const command = toUpdateTagCommand(
      parseInput({
        color: null,
        id: 7,
        name: " Work ",
        pinned: false,
        sortOrder: 0,
      })
    );

    expect(command).toStrictEqual({
      color: null,
      id: tagId,
      name: v.parse(tagNameSchema, " Work "),
      pinned: false,
      sortOrder: 0,
    });
  });

  test("hex形式でないcolorは拒否する", () => {
    expect(() =>
      parseInput({
        color: "red",
        id: 7,
        name: "Work",
        pinned: false,
        sortOrder: 0,
      })
    ).toThrow();
    expect(() =>
      parseInput({
        color: "#12345",
        id: 7,
        name: "Work",
        pinned: false,
        sortOrder: 0,
      })
    ).toThrow();
  });
});

describe(executeUpdateTag, () => {
  const command = toUpdateTagCommand(
    parseInput({
      color: "#fff",
      id: 7,
      name: "Work",
      pinned: true,
      sortOrder: 3,
    })
  );

  test("updatedを更新済みTagIdへ写す", async () => {
    const result = await executeUpdateTag({
      command,
      updateTag: fakeUpdateTag({ id: tagId, kind: "updated" }),
      userId,
    });

    expect(result).toStrictEqual({ ok: true, value: { id: tagId } });
  });

  test("name-conflictをtag-name-already-existsへ写す", async () => {
    const result = await executeUpdateTag({
      command,
      updateTag: fakeUpdateTag({ kind: "name-conflict" }),
      userId,
    });

    expect(result).toStrictEqual({
      error: { code: "tag-name-already-exists" },
      ok: false,
    });
  });

  test("not-foundをtag-not-foundへ写す", async () => {
    const result = await executeUpdateTag({
      command,
      updateTag: fakeUpdateTag({ kind: "not-found" }),
      userId,
    });

    expect(result).toStrictEqual({
      error: { code: "tag-not-found" },
      ok: false,
    });
  });

  test("全command値とuserIdをportへ渡す", async () => {
    let received;

    await executeUpdateTag({
      command,
      updateTag: async (input) => {
        received = input;
        return { id: tagId, kind: "updated" };
      },
      userId,
    });

    expect(received).toStrictEqual({ userId, ...command });
  });

  test("portの未知障害はResultへ潰さない", async () => {
    await expect(
      executeUpdateTag({
        command,
        updateTag: async () => {
          throw new Error("database offline");
        },
        userId,
      })
    ).rejects.toThrow("database offline");
  });
});
