import { ORPCError } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { WorkbenchBar } from "../../../../features/app-shell/components/workbench-bar";
import { BookmarkDeleteDialog } from "../../../../features/bookmarks/components/bookmark-delete-dialog";
import { BookmarkEditor } from "../../../../features/bookmarks/components/bookmark-editor";
import type {
  BookmarkEditorData,
  BookmarkEditorSubmitResult,
  BookmarkTitleFetchAction,
} from "../../../../features/bookmarks/components/bookmark-editor";
import { getTitleFetchErrorMessage } from "../../../../features/bookmarks/lib/errors/get-title-fetch-error-message";
import { toUpdateBookmarkFailureCode } from "../../../../features/bookmarks/lib/errors/update-bookmark-failure";
import { refreshAfterBookmarkMutation } from "../../../../features/bookmarks/lib/queries/refresh-after-bookmark-mutation";
import { createTagFromPickerAction } from "../../../../features/bookmarks/lib/tag-picker/create-tag-from-picker-action";
import { bookmarkDetailSearchSchema } from "../../../../features/navigation/lib/bookmark-search";
import { listSearchFromDetail } from "../../../../features/navigation/lib/bookmark-search-builders";
import { orpc } from "../../../../rpc/query";
import { getRpcClient } from "../../../../rpc/runtime-client";
import { createErrorFallback } from "../../../../shared/components/error-fallback";
import { button } from "../../../../shared/components/styled-button/styles";
import { UiEmpty } from "../../../../shared/components/ui-empty";
import { UiLoading } from "../../../../shared/components/ui-loading";
import { detailCenter } from "../../../../shared/styles/detail";
import {
  formFootSpacer,
  formWrap,
  workbenchScreen,
} from "../../../../shared/styles/form-screen";

const editorStaleTime = 5000;

// タイトル取得失敗時のフォールバック文言 (null / 非 Error の throw で表示)
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

// 想定外エラー (action の reject など) の最終防衛線。想定内エラーは action の state 経由で表示される。
const EditError = createErrorFallback("編集画面の表示に失敗しました");

function isBookmarkNotFound(error: unknown): boolean {
  return (
    error instanceof ORPCError &&
    error.defined &&
    error.code === "bookmark-not-found"
  );
}

/**
 * この Route は編集画面のページ境界であり、Storybook の Route Story 起点でもある。
 * params / search / loader / not-found / 画面固有リンク / navigation をここで閉じ、
 * Domain・DB・oRPC 実装詳細は注入された port の向こう側に置く。
 */
export const Route = createFileRoute("/_protected/bookmarks/$id/edit")({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params, context }) => {
    const client = await getRpcClient();
    try {
      // Loader が cache を埋め、component は同じ query key を読む。
      // Server では request headers 付き direct client、browser では rpcClient が使われる。
      await context.queryClient.ensureQueryData(
        createTanstackQueryUtils(client).bookmarks.editor.queryOptions({
          input: { id: params.id },
          staleTime: editorStaleTime,
        })
      );
    } catch (error: unknown) {
      if (isBookmarkNotFound(error)) {
        return { kind: "not-found" as const };
      }
      throw error;
    }

    return { kind: "ok" as const };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const params = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const listSearch = listSearchFromDetail(search);
  const detailSearch = search;

  const updateMutation = useMutation(orpc.bookmarks.update.mutationOptions());
  const editorQuery = useQuery(
    orpc.bookmarks.editor.queryOptions({
      input: { id: params.id },
      staleTime: editorStaleTime,
    })
  );
  const shelfQuery = useQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );
  const createTagAction = useMemo(
    () => createTagFromPickerAction({ queryClient, router }),
    [queryClient, router]
  );

  if (data.kind === "not-found") {
    return (
      <div className={workbenchScreen}>
        <WorkbenchBar
          backTo="/bookmarks"
          backSearch={listSearch}
          backLabel="一覧へ戻る"
          mobileBackLabel="キャンセル"
          title="編集"
        />
        <div className={detailCenter}>
          <UiEmpty
            title="このブックマークは見つかりません"
            action={
              <Link
                className={button({ visual: "ghost" })}
                to="/bookmarks"
                search={listSearch}
              >
                一覧へ戻る
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // Loader の ensureQueryData が成功しているため、cache は原則ここで埋まっている。
  if (!editorQuery.data) {
    return (
      <div className={workbenchScreen}>
        <WorkbenchBar
          backTo="/bookmarks"
          backSearch={listSearch}
          backLabel="一覧へ戻る"
          mobileBackLabel="キャンセル"
          title="編集"
        />
        <div className={detailCenter}>
          <UiLoading label="ブックマークを読み込み中" />
        </div>
      </div>
    );
  }

  const record = editorQuery.data;
  const initialData: BookmarkEditorData = {
    bookmarkId: record.id,
    url: record.url,
    title: record.title,
    note: record.note,
    tagIds: record.tagIds,
  };

  return (
    <div className={workbenchScreen}>
      <WorkbenchBar
        backTo="/bookmarks/$id"
        backParams={{ id: initialData.bookmarkId }}
        backSearch={detailSearch}
        backLabel="詳細へ戻る"
        mobileBackLabel="キャンセル"
        title="編集"
      />
      <div className={formWrap}>
        <ErrorBoundary FallbackComponent={EditError}>
          <BookmarkEditor
            key={initialData.bookmarkId}
            initialData={initialData}
            heading="ブックマークを編集"
            footer={
              <>
                <Link
                  className={button({ visual: "ghost" })}
                  to="/bookmarks/$id"
                  params={{ id: initialData.bookmarkId }}
                  search={detailSearch}
                >
                  キャンセル
                </Link>
                <span aria-hidden className={formFootSpacer} />
                <BookmarkDeleteDialog
                  bookmark={{
                    id: initialData.bookmarkId,
                    title: initialData.title,
                  }}
                  listSearch={listSearch}
                />
              </>
            }
            onUpdateBookmark={async (
              command
            ): Promise<BookmarkEditorSubmitResult> => {
              try {
                const output = await updateMutation.mutateAsync({
                  id: command.bookmarkId,
                  url: command.url,
                  title: command.title,
                  note: command.note,
                  tags: [...command.tagIds],
                });
                return { ok: true, bookmarkId: output.id };
              } catch (error: unknown) {
                return {
                  ok: false,
                  failureCode: toUpdateBookmarkFailureCode(error),
                };
              }
            }}
            fetchTitleAction={fetchTitleAction}
            tagCandidates={shelfQuery.data ?? []}
            tagsReady={shelfQuery.isSuccess}
            createTagAction={createTagAction}
            onCompleted={async (bookmarkId) => {
              // DB commit 済みの成功を refresh failure で覆さない。invalidate は best-effort。
              refreshAfterBookmarkMutation(
                router,
                queryClient,
                "UpdateBookmark"
              );

              await navigate({
                to: "/bookmarks/$id",
                params: { id: bookmarkId },
                search: detailSearch,
                state: { bookmarkUpdated: true },
              });
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
