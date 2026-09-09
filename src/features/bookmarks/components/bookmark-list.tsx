import { Suspense } from "react";

import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import { useTouchTagLastUsedOnce } from "../../tags/hooks/use-touch-tag-last-used";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { BookmarkListFrame } from "./bookmark-list-frame";
import { ListLoading } from "./bookmark-list-loading";
import { ListToolbar } from "./bookmark-list-toolbar";

interface BookmarkListProps {
  readonly search: BookmarkSearchSchema;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}

export const BookmarkList = ({
  search,
  shelfTagsPromise,
}: BookmarkListProps) => {
  useTouchTagLastUsedOnce(search, shelfTagsPromise);

  return (
    <section>
      <Suspense
        fallback={
          <>
            <ListToolbar search={search} shelfTags={[]} />
            <ListLoading />
          </>
        }
      >
        <BookmarkListFrame
          search={search}
          shelfTagsPromise={shelfTagsPromise}
        />
      </Suspense>
    </section>
  );
};
