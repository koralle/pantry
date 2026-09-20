import { ORPCError } from "@orpc/client";
import {
  createFileRoute,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { CircleCheck } from "lucide-react";
import { Suspense } from "react";
import type { FallbackProps } from "react-error-boundary";
import { ErrorBoundary } from "react-error-boundary";

import { BookmarkDetailResolved } from "../../../../features/bookmarks/components/bookmark-detail-resolved";
import { BookmarkDetailSkeleton } from "../../../../features/bookmarks/components/bookmark-detail-skeleton";
import { bookmarkDetailQueryOptions } from "../../../../features/bookmarks/lib/queries/bookmark-detail-query-options";
import { bookmarkDetailSearchSchema } from "../../../../features/navigation/lib/bookmark-search";
import { listSearchFromDetail } from "../../../../features/navigation/lib/bookmark-search-builders";
import { StyledLink } from "../../../../shared/components/styled-link";
import { UiEmpty } from "../../../../shared/components/ui-empty";
import { UiError } from "../../../../shared/components/ui-error";
import {
  detailCenter,
  detailFlashRow,
  detailPage,
} from "../../../../shared/styles/detail";
import { flash } from "../../../../shared/styles/flash";

function isBookmarkNotFound(error: unknown): boolean {
  return (
    error instanceof ORPCError &&
    error.defined &&
    error.code === "bookmark-not-found"
  );
}

function DetailFallback({ error, resetErrorBoundary }: FallbackProps) {
  const search = Route.useSearch();

  if (isBookmarkNotFound(error)) {
    return (
      <div className={detailCenter}>
        <UiEmpty
          action={
            <StyledLink
              search={listSearchFromDetail(search)}
              to="/bookmarks"
              visual="accent"
            >
              一覧へ戻る
            </StyledLink>
          }
          title="ブックマークが見つかりません"
        />
      </div>
    );
  }

  return (
    <div className={detailCenter}>
      <UiError
        message="詳細の読み込みに失敗しました"
        onRetry={resetErrorBoundary}
      />
    </div>
  );
}

export const Route = createFileRoute("/_protected/bookmarks/$id/")({
  validateSearch: bookmarkDetailSearchSchema,
  loader: async ({ params, context }) => {
    // Route component と同じ query options を先に温める。
    void context.queryClient.prefetchQuery(
      bookmarkDetailQueryOptions(params.id)
    );

    return {};
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const listSearch = listSearchFromDetail(search);
  const router = useRouter();
  const { newBookmarkCreated, bookmarkUpdated } = useRouterState({
    select: (s) => s.location.state,
  });

  return (
    <section aria-label="ブックマーク詳細" className={detailPage}>
      {newBookmarkCreated ? (
        <div className={detailFlashRow}>
          <div className={flash} role="alert">
            <CircleCheck aria-hidden size={16} /> ブックマークを登録しました
          </div>
        </div>
      ) : null}
      {bookmarkUpdated ? (
        <div className={detailFlashRow}>
          <div className={flash} role="alert">
            <CircleCheck aria-hidden size={16} /> ブックマークを更新しました
          </div>
        </div>
      ) : null}

      <ErrorBoundary
        FallbackComponent={DetailFallback}
        onReset={() => {
          void router.invalidate();
        }}
      >
        <Suspense fallback={<BookmarkDetailSkeleton />}>
          <BookmarkDetailResolved id={id} listSearch={listSearch} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}
