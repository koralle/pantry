import { use } from "react";

import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import type { ListLayout } from "../lib/list-layout-preference";
import { ListToolbar } from "./bookmark-list-toolbar";

interface ListToolbarAsyncProps {
  readonly search: BookmarkSearchSchema;
  readonly layout: ListLayout;
  readonly onLayoutChange: (layout: ListLayout) => void;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}

export const ListToolbarAsync = ({
  search,
  layout,
  onLayoutChange,
  shelfTagsPromise,
}: ListToolbarAsyncProps) => {
  const shelfTags = use(shelfTagsPromise);
  return (
    <ListToolbar
      search={search}
      layout={layout}
      onLayoutChange={onLayoutChange}
      shelfTags={shelfTags}
    />
  );
};
