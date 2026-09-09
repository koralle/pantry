import { useRouter } from "@tanstack/react-router";
import { Suspense, use } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { createErrorFallback } from "../../../shared/components/error-fallback";
import { PantryMotion } from "../../../shared/components/pantry-motion";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { bookmarkListSearchIdentity } from "../lib/bookmark-list-scroll-session";
import { ListLoading } from "./bookmark-list-loading";
import { BookmarkListResults } from "./bookmark-list-results";
import { ListToolbar } from "./bookmark-list-toolbar";

const ListError = createErrorFallback("一覧の読み込みに失敗しました");

export const BookmarkListFrame = ({
  search,
  shelfTagsPromise,
}: {
  readonly search: BookmarkSearchSchema;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}) => {
  const shelfTags = use(shelfTagsPromise);
  const router = useRouter();
  const listKey = bookmarkListSearchIdentity(search);

  return (
    <>
      <ListToolbar search={search} shelfTags={shelfTags} />

      <ErrorBoundary
        FallbackComponent={ListError}
        onReset={() => {
          void router.invalidate();
        }}
      >
        <Suspense fallback={<ListLoading />}>
          <PantryMotion key={listKey} kind="crossfade">
            <BookmarkListResults search={search} />
          </PantryMotion>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
