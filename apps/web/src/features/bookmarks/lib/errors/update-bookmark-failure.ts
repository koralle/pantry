import { ORPCError } from "@orpc/client";

/**
 * 更新 mutation の失敗を、画面が分岐できる code だけへ写す。
 * `UNAUTHORIZED` は null を返す。client interceptor が sign-in へ飛ばすため、
 * 同じ画面に「保存に失敗しました」を残すと失敗原因が二重になる。
 * Error の class 名は見ない。transport が変わっても code 契約だけを見る。
 */
export type UpdateBookmarkFailureCode =
  | "bookmark-not-found"
  | "duplicate-url"
  | "invalid-tag"
  | "unexpected";

export const toUpdateBookmarkFailureCode = (
  error: unknown
): UpdateBookmarkFailureCode | null => {
  if (!(error instanceof ORPCError) || !error.defined) {
    return "unexpected";
  }

  switch (error.code) {
    case "UNAUTHORIZED": {
      return null;
    }
    case "bookmark-not-found": {
      return "bookmark-not-found";
    }
    case "duplicate-url": {
      return "duplicate-url";
    }
    case "invalid-tag": {
      return "invalid-tag";
    }
    default: {
      return "unexpected";
    }
  }
};
