import type { UpdateBookmarkFailureCode } from "../../lib/errors/update-bookmark-failure";
import type { BookmarkEditorError } from "./bookmark-form";

/**
 * 更新結果の failure code を、BookmarkEditor が保持する画面用エラーへ変換する。
 * code は transport から切り離された値で、Error class 名による分岐はしない。
 *
 * Record で全 code を引くため、`UpdateBookmarkFailureCode` に値を足すと
 * ここが型エラーになって網羅漏れに気づける（switch より網羅性が強い）。
 */
const failureErrors: Record<UpdateBookmarkFailureCode, BookmarkEditorError> = {
  "bookmark-not-found": {
    form: { summary: "このブックマークは見つかりません" },
  },
  "duplicate-url": {
    form: {
      fields: { url: "この URL は既に登録されています" },
      summary: "同じ URL のブックマークが既にあります",
    },
  },
  "invalid-tag": {
    form: {
      fields: {
        tags: "保存できないタグが含まれています。タグを選び直してください",
      },
      summary: "保存できないタグが含まれています。タグを選び直してください",
    },
  },
  unexpected: {
    form: { summary: "保存に失敗しました。時間をおいて再度お試しください" },
  },
};

export const mapUpdateBookmarkFailure = (
  code: UpdateBookmarkFailureCode
): BookmarkEditorError => failureErrors[code];
