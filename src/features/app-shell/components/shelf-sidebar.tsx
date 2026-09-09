import { css } from "styled-system/css";

import { StyledLink } from "../../../shared/components/styled-link";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import type { ShelfNavSelection } from "../../tags/components/shelf-nav";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { ShelfNavPanel } from "./shelf-nav-panel";

const shelfRail = css({
  display: "none",
  md: {
    background: "surface.rail",
    borderInlineEndColor: "border.default",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: "thin",
    display: "flex",
    flexDirection: "column",
    gap: "4",
    paddingBlock: "4",
    paddingInline: "4",
  },
});

const shelfRailNav = css({
  flex: "1",
  minBlockSize: "0",
  overflow: "auto",
});

export const ShelfSidebar = ({
  shelfTagsPromise,
  selection,
  listSearch,
}: {
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
  readonly selection: ShelfNavSelection;
  readonly listSearch: BookmarkSearchSchema | undefined;
}) => (
  <aside className={shelfRail} aria-label="サイドバー">
    <div>
      <StyledLink to="/" search={defaultBookmarkSearch} visual="brand">
        Pantry
      </StyledLink>
    </div>
    <div className={shelfRailNav}>
      <ShelfNavPanel
        shelfTagsPromise={shelfTagsPromise}
        selection={selection}
        listSearch={listSearch}
      />
    </div>
  </aside>
);
