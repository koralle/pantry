import type { BookmarkSearchSchema } from "../../../navigation/lib/bookmark-search";

/** 一覧の見出し。コンポーネントファイルから切り離し、Fast Refresh の境界を保つ。 */
export const bookmarkListTitle = (search: BookmarkSearchSchema): string => {
  const { tags } = search;
  if (tags !== undefined && tags.length > 0) {
    return tags.join(" / ");
  }
  if (search.view === "inbox") {
    return "未整理";
  }
  if (search.view === "favorites") {
    return "お気に入り";
  }
  return "最近保存したもの";
};
