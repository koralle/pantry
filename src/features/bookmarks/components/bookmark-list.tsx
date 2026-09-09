import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import { useTouchTagLastUsedOnce } from "../../tags/hooks/use-touch-tag-last-used";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { useListLayout } from "../hooks/use-list-layout";
import {
  bookmarkListSearchIdentity,
  rememberBookmarkListScroll,
} from "../lib/bookmark-list-scroll-session";
import { BookmarkListFrame } from "./bookmark-list-frame";

interface BookmarkListProps {
  readonly search: BookmarkSearchSchema;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}

export const BookmarkList = ({
  search,
  shelfTagsPromise,
}: BookmarkListProps) => {
  const [layout, setLayout] = useListLayout();

  const changeLayout = (next: typeof layout) => {
    setLayout(next);
    rememberBookmarkListScroll(bookmarkListSearchIdentity(search), 0);
    window.scrollTo(0, 0);
  };

  useTouchTagLastUsedOnce(search, shelfTagsPromise);

  return (
    <section>
      <BookmarkListFrame
        search={search}
        layout={layout}
        changeLayout={changeLayout}
        shelfTagsPromise={shelfTagsPromise}
      />
    </section>
  );
};
