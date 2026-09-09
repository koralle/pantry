import { useRouter } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { createErrorFallback } from "../../../shared/components/error-fallback";
import { PantryMotion } from "../../../shared/components/pantry-motion";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { bookmarkListSearchIdentity } from "../lib/bookmark-list-scroll-session";
import type { ListLayout } from "../lib/list-layout-preference";
import { ListLoading } from "./bookmark-list-loading";
import { BookmarkListResults } from "./bookmark-list-results";
import { ListToolbar } from "./bookmark-list-toolbar";
import { ListToolbarAsync } from "./list-toolbar-async";

const ListError = createErrorFallback("一覧の読み込みに失敗しました");

export const BookmarkListFrame = ({
  search,
  layout,
  changeLayout,
  shelfTagsPromise,
}: {
  readonly search: BookmarkSearchSchema;
  readonly layout: ListLayout;
  readonly changeLayout: (layout: ListLayout) => void;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}) => {
  const router = useRouter();
  const listKey = bookmarkListSearchIdentity(search);

  return (
    <>
      <Suspense
        fallback={
          <ListToolbar
            search={search}
            layout={layout}
            onLayoutChange={changeLayout}
            shelfTags={[]}
          />
        }
      >
        <ListToolbarAsync
          search={search}
          layout={layout}
          onLayoutChange={changeLayout}
          shelfTagsPromise={shelfTagsPromise}
        />
      </Suspense>

      <ErrorBoundary
        FallbackComponent={ListError}
        onReset={() => {
          void router.invalidate();
        }}
      >
        <Suspense fallback={<ListLoading layout={layout} />}>
          <PantryMotion key={listKey} kind="crossfade">
            <BookmarkListResults layout={layout} search={search} />
          </PantryMotion>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
