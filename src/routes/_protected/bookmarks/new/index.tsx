import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { WorkbenchBar } from "../../../../features/app-shell/components/workbench-bar";
import { BookmarkForm } from "../../../../features/bookmarks/components/bookmark-editor/bookmark-form";
import type {
  BookmarkFormServerError,
  BookmarkFormSubmitValues,
  BookmarkTitleFetchAction,
} from "../../../../features/bookmarks/components/bookmark-editor/bookmark-form";
import { buildNewBookmarkCommand } from "../../../../features/bookmarks/components/new-bookmark-command";
import { mapCreateBookmarkFailure } from "../../../../features/bookmarks/lib/errors/get-create-bookmark-error-message";
import { getTitleFetchErrorMessage } from "../../../../features/bookmarks/lib/errors/get-title-fetch-error-message";
import { refreshAfterBookmarkMutation } from "../../../../features/bookmarks/lib/queries/refresh-after-bookmark-mutation";
import { createTagFromPickerAction } from "../../../../features/bookmarks/lib/tag-picker/create-tag-from-picker-action";
import { bookmarkDetailSearchSchema } from "../../../../features/navigation/lib/bookmark-search";
import { listSearchFromDetail } from "../../../../features/navigation/lib/bookmark-search-builders";
import { orpc } from "../../../../rpc/query";
import { getRpcClient } from "../../../../rpc/runtime-client";
import { button } from "../../../../styles/button";
import { formWrap, workbenchScreen } from "../../../../styles/form-screen";

const bookmarkTitleFetchFailedMessage =
  "タイトルを取得できませんでした。手入力で続けられます";

/**
 * タイトル取得 action。BookmarkForm 側のラッパーを経て useActionState に渡り、
 * bookmarks.title procedure の null / throw を code 契約だけで表示用メッセージへ変換する。
 */
const fetchTitleAction: BookmarkTitleFetchAction = async (
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

export const Route = createFileRoute("/_protected/bookmarks/new/")({
  validateSearch: bookmarkDetailSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listSearch = listSearchFromDetail(search);
  const [serverError, setServerError] =
    useState<BookmarkFormServerError | null>(null);
  const shelfQuery = useQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );
  const createTagAction = useMemo(
    () => createTagFromPickerAction({ queryClient, router }),
    [queryClient, router]
  );
  const mutation = useMutation(
    orpc.bookmarks.create.mutationOptions({
      onSuccess: () => {
        refreshAfterBookmarkMutation(router, queryClient, "CreateBookmark");
      },
    })
  );

  async function handleSubmit(values: BookmarkFormSubmitValues) {
    setServerError(null);

    let id: string;
    try {
      const created = await mutation.mutateAsync(
        buildNewBookmarkCommand({
          url: values.url,
          title: values.title,
          note: values.note,
          tagIds: values.tagIds,
        })
      );
      id = created.id;
    } catch (error: unknown) {
      const formError = mapCreateBookmarkFailure(error);
      if (formError !== null) {
        setServerError(formError);
      }
      return;
    }

    try {
      await navigate({
        to: "/bookmarks/$id",
        params: { id },
        search,
        state: { newBookmarkCreated: true },
      });
    } catch {
      setServerError({
        summary: "保存は完了しましたが、画面の移動に失敗しました",
      });
    }
  }

  return (
    <div className={workbenchScreen}>
      <WorkbenchBar
        backTo="/bookmarks"
        backSearch={listSearch}
        backLabel="一覧へ戻る"
        mobileBackLabel="キャンセル"
        title="登録"
      />
      <div className={formWrap}>
        <BookmarkForm
          initialValues={{ url: "", title: "", note: null }}
          heading="ブックマークを登録"
          footer={
            <Link
              className={button({ visual: "ghost" })}
              to="/bookmarks"
              search={listSearch}
            >
              キャンセル
            </Link>
          }
          serverError={serverError}
          submitLabel="登録する"
          pendingLabel="保存中…"
          onSubmit={handleSubmit}
          fetchTitleAction={fetchTitleAction}
          tagCandidates={shelfQuery.data ?? []}
          tagsReady={shelfQuery.isSuccess}
          createTagAction={createTagAction}
        />
      </div>
    </div>
  );
}
