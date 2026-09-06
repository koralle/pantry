import type { UpdateBookmarkFailureCode } from "../../lib/update-bookmark-failure";
import type { BookmarkEditorError } from "./bookmark-form";

/**
 * 更新結果の failure code を、BookmarkEditor が保持する画面用エラーへ変換する。
 * code は transport から切り離された値で、Error class 名による分岐はしない。
 */
export const mapUpdateBookmarkFailure = (
  code: UpdateBookmarkFailureCode
): BookmarkEditorError => {
  switch (code) {
    case "duplicate-url": {
      return {
        form: {
          fields: { url: "この URL は既に登録されています" },
          summary: "同じ URL のブックマークが既にあります",
        },
      };
    }
    case "bookmark-not-found": {
      return { form: { summary: "このブックマークは見つかりません" } };
    }
    case "invalid-tag": {
      return {
        form: {
          fields: {
            tags: "保存できないタグが含まれています。タグを選び直してください",
          },
          summary: "保存できないタグが含まれています。タグを選び直してください",
        },
      };
    }
    case "unexpected": {
      return {
        form: { summary: "保存に失敗しました。時間をおいて再度お試しください" },
      };
    }
  }
};
