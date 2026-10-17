import type { ErrorComponentProps } from "@tanstack/react-router";
import { createFileRoute, ErrorComponent } from "@tanstack/react-router";

import { AppHeader } from "../../../app/header";
import { Layout } from "../../../app/layout";
import { SideBar } from "../../../app/sidebar";
import { BottomTabs } from "../../../features/app-shell/components/bottom-tabs";
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
    <Layout
      renderHeader={() => <AppHeader />}
      renderSideBar={() => <SideBar />}
      renderBottomTab={() => <BottomTabs />}
    >
      <ErrorComponent error={error} />
    </Layout>
  );
}

function RouteComponent() {
  const search = Route.useSearch();

  return (
    <Layout
      renderBottomTab={() => <BottomTabs />}
      renderHeader={() => <AppHeader />}
      renderSideBar={() => <SideBar />}
    >
      <PantryMotion className={listColumn} kind="fade-up">
        <BookmarkList search={search} />
      </PantryMotion>
    </Layout>
  );
}
