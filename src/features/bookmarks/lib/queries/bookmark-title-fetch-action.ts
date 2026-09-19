import { getRpcClient } from "../../../../rpc/runtime-client";
import type { BookmarkTitleFetchAction } from "../../components/bookmark-editor/bookmark-form";
import { getTitleFetchErrorMessage } from "../errors/get-title-fetch-error-message";

const bookmarkTitleFetchFailedMessage =
  "タイトルを取得できませんでした。手入力で続けられます";

/**
 * タイトル取得 action の共通実装（新規フォーム / クイック追加で共用）。
 * bookmarks.title procedure の null / throw を code 契約だけで表示用メッセージへ変換する。
 */
export const bookmarkTitleFetchAction: BookmarkTitleFetchAction = async (
  _previousState,
  { url }
) => {
  try {
    const fetchedTitle = await (await getRpcClient()).bookmarks.title({ url });
    if (fetchedTitle === null) {
      return {
        status: "error",
        message: bookmarkTitleFetchFailedMessage,
      };
    }
    return { status: "success", title: fetchedTitle };
  } catch (error: unknown) {
    return {
      status: "error",
      message: getTitleFetchErrorMessage(error),
    };
  }
};
