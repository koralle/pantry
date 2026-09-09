import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  createFileRoute,
  ErrorComponent,
  getRouteApi,
} from "@tanstack/react-router";

import { BookmarkList } from "../../../features/bookmarks/components/bookmark-list";
import { bookmarkListQueryOptions } from "../../../features/bookmarks/lib/bookmark-list-query-options";
import { validateBookmarkSearch } from "../../../features/navigation/lib/bookmark-search";
import { PantryMotion } from "../../../shared/components/pantry-motion";

const protectedRouteApi = getRouteApi("/_protected");

export const Route = createFileRoute("/_protected/bookmarks/")({
  validateSearch: validateBookmarkSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps, context }) => {
    // Component が同じ infinite query options を読む。待たずに流すことで streaming を維持する。
    void context.queryClient.prefetchInfiniteQuery(
      bookmarkListQueryOptions(deps)
    );

    return {};
  },
  component: RouteComponent,
  errorComponent: BookmarkPageFallbackComponent,
});

function BookmarkPageFallbackComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}

function RouteComponent() {
  const search = Route.useSearch();
  const { shelfTagsPromise } = protectedRouteApi.useLoaderData();

  return (
    <PantryMotion kind="fade-up">
      <BookmarkList search={search} shelfTagsPromise={shelfTagsPromise} />
    </PantryMotion>
  );
}
