import { beforeEach, describe, expect, test, vi } from "vitest";

import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfTag } from "../lib/tag-shelf";
import { useTouchTagLastUsedOnce } from "./use-touch-tag-last-used";

/**
 * 描画環境なしで hook の effect 本体を検証する。
 * react と @tanstack/react-query を差し替え、React の契約
 * （mount → cleanup → 再実行）をテスト側で再現して cancelled guard の挙動を確かめる。
 */
const mocks = vi.hoisted(() => ({
  effectCallbacks: [] as (() => unknown)[],
  mutate: vi.fn<(variables: { id: number }) => void>(),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: mocks.mutate }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (callback: () => unknown) => {
      mocks.effectCallbacks.push(callback);
    },
  };
});

function shelfTag(id: number, name: string): ShelfTag {
  return {
    bookmarkCount: 0,
    color: null,
    id,
    lastUsedAt: null,
    name,
    pinned: false,
    sortOrder: 0,
  };
}

function searchWithTags(tags?: string[]): BookmarkSearchSchema {
  return { tags };
}

// hook を直接呼ぶため use* 命名にする（react-hooks/rules-of-hooks の前提）。
function useMountedEffect(
  search: BookmarkSearchSchema,
  shelfTagsPromise: Promise<ShelfTag[]>
) {
  useTouchTagLastUsedOnce(search, shelfTagsPromise);
  const [callback] = mocks.effectCallbacks;
  if (callback === undefined) {
    throw new Error("useEffect was not invoked");
  }
  return callback;
}

function deferredShelfTags() {
  return Promise.withResolvers<ShelfTag[]>();
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe(useTouchTagLastUsedOnce, () => {
  beforeEach(() => {
    mocks.effectCallbacks = [];
    mocks.mutate.mockClear();
  });

  test("cleanup が shelf 解決より先に走ったら touch を呼ばない", async () => {
    const { promise, resolve } = deferredShelfTags();
    const effect = useMountedEffect(searchWithTags(["Work"]), promise);

    const cleanup = effect();
    if (typeof cleanup !== "function") {
      throw new TypeError("cleanup was not returned");
    }
    cleanup();

    resolve([shelfTag(1, "Work")]);
    await settle();

    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  test("cancel がなければ primary タグの id で1回だけ touch する", async () => {
    const { promise, resolve } = deferredShelfTags();
    useMountedEffect(searchWithTags(["work"]), promise)();

    resolve([shelfTag(7, "Work"), shelfTag(8, "Home")]);
    await settle();

    expect(mocks.mutate).toHaveBeenCalledExactlyOnceWith({ id: 7 });
  });

  test("tags が空なら shelf 解決後も何もしない", async () => {
    const { promise, resolve } = deferredShelfTags();
    useMountedEffect(searchWithTags(), promise)();

    resolve([shelfTag(1, "Work")]);
    await settle();

    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
