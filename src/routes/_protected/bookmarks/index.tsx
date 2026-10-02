import type { ErrorComponentProps } from "@tanstack/react-router";
import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { StandardShell } from "../../../features/app-shell/components/standard-shell";
import { BookmarkList } from "../../../features/bookmarks/components/bookmark-list-screen";
import { bookmarkListQueryOptions } from "../../../features/bookmarks/lib/queries/bookmark-list-query-options";
import { listColumn } from "../../../features/bookmarks/styles";
import { validateBookmarkSearch } from "../../../features/navigation/lib/bookmark-search";
import { PantryMotion } from "../../../shared/components/pantry-motion";

export const Route = createFileRoute("/_protected/bookmarks/")({
  validateSearch: validateBookmarkSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps, context }) => {
    void context.queryClient.prefetchInfiniteQuery(
      bookmarkListQueryOptions(deps)
    );
  },
  component: RouteComponent,
  errorComponent: BookmarkPageFallbackComponent,
});

function BookmarkPageFallbackComponent({ error }: ErrorComponentProps) {
  return (
    <StandardShell>
      <ErrorComponent error={error} />
    </StandardShell>
  );
}

function RouteComponent() {
  const search = Route.useSearch();

  return (
    <StandardShell>
      <PantryMotion className={listColumn} kind="fade-up">
        <BookmarkList search={search} />
      </PantryMotion>
    </StandardShell>
  );
}
