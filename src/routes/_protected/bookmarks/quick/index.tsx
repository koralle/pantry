import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import * as v from "valibot";

import { WorkbenchBar } from "../../../../features/app-shell/components/workbench-bar";
import { buildNewBookmarkCommand } from "../../../../features/bookmarks/components/new-bookmark-command";
import {
  QuickAddFetchingCard,
  QuickAddScreen,
} from "../../../../features/bookmarks/components/quick-add";
import type {
  QuickAddCreateCommand,
  QuickAddCreateResult,
  QuickAddScreenProps,
} from "../../../../features/bookmarks/components/quick-add";
import { bookmarkUrlSchema } from "../../../../features/bookmarks/domain/bookmark-values";
import { mapCreateBookmarkFailure } from "../../../../features/bookmarks/lib/errors/get-create-bookmark-error-message";
import { bookmarkTitleFetchAction } from "../../../../features/bookmarks/lib/queries/bookmark-title-fetch-action";
import { refreshAfterBookmarkMutation } from "../../../../features/bookmarks/lib/queries/refresh-after-bookmark-mutation";
import { createTagFromPickerAction } from "../../../../features/bookmarks/lib/tag-picker/create-tag-from-picker-action";
import { bookmarkQuickAddSearchSchema } from "../../../../features/navigation/lib/bookmark-search";
import { listSearchFromDetail } from "../../../../features/navigation/lib/bookmark-search-builders";
import { orpc } from "../../../../rpc/query";
import { formWrap, workbenchScreen } from "../../../../styles/form-screen";

export const Route = createFileRoute("/_protected/bookmarks/quick/")({
  validateSearch: bookmarkQuickAddSearchSchema,
  component: RouteComponent,
});

type QuickAddPorts = Pick<
  QuickAddScreenProps,
  | "createTagAction"
  | "detailSearch"
  | "fetchTitleAction"
  | "onCreateBookmark"
  | "tagCandidates"
  | "tagsReady"
>;

/**
 * `?url=` prefill 経由で開いたときのタイトル取得ゲート。
 * 取得は query として render 駆動で始まり、pending の間は
 * 仕様どおり「タイトル取得中」カードを出す。effect で追従しない。
 */
const QuickAddWithPrefetchedTitle = ({
  url,
  ports,
}: {
  readonly url: string;
  readonly ports: QuickAddPorts;
}) => {
  const titleQuery = useQuery(
    orpc.bookmarks.title.queryOptions({
      input: { url },
      retry: 0,
      staleTime: 60_000,
    })
  );
  if (!titleQuery.isSuccess && !titleQuery.isError) {
    return <QuickAddFetchingCard url={url} />;
  }
  const title = titleQuery.data ?? null;
  return (
    <QuickAddScreen
      initialTitle={title ?? ""}
      initialTitleFailed={title === null}
      initialUrl={url}
      {...ports}
    />
  );
};

function RouteComponent() {
  const search = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { url: rawPrefillUrl, ...detailSearch } = search;
  // ?url= は手打ちもあり得るので、画面に入れる前に URL として検証する。
  const prefetchUrl = v.safeParse(bookmarkUrlSchema, rawPrefillUrl ?? "")
    .success
    ? rawPrefillUrl
    : undefined;
  const listSearch = listSearchFromDetail(detailSearch);
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

  const handleCreateBookmark = async (
    command: QuickAddCreateCommand
  ): Promise<QuickAddCreateResult> => {
    try {
      const created = await mutation.mutateAsync(
        buildNewBookmarkCommand(command)
      );
      return { id: created.id, ok: true };
    } catch (error: unknown) {
      return { failure: mapCreateBookmarkFailure(error), ok: false };
    }
  };

  const ports: QuickAddPorts = {
    createTagAction,
    detailSearch,
    fetchTitleAction: bookmarkTitleFetchAction,
    onCreateBookmark: handleCreateBookmark,
    tagCandidates: shelfQuery.data ?? [],
    tagsReady: shelfQuery.isSuccess,
  };

  return (
    <div className={workbenchScreen}>
      <WorkbenchBar
        backLabel="一覧へ戻る"
        backSearch={listSearch}
        backTo="/bookmarks"
        mobileBackLabel="キャンセル"
        title="登録"
      />
      <div className={formWrap}>
        {prefetchUrl === undefined ? (
          <QuickAddScreen {...ports} />
        ) : (
          <QuickAddWithPrefetchedTitle ports={ports} url={prefetchUrl} />
        )}
      </div>
    </div>
  );
}
