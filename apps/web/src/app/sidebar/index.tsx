import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { rail, railSection } from "../../features/app-shell/styles";
import { FavoriteBookmarkLink } from "./link-items/favorite";
import { InboxBookmarkLink } from "./link-items/inbox";
import { RecentBookmarkLink } from "./link-items/recent";
import { TagLinkList, TagLink } from "./link-items/tag";

export const SideBar = () => (
  <nav aria-label="ビュー" className={rail}>
    <RecentBookmarkLink />
    <InboxBookmarkLink />
    <FavoriteBookmarkLink />

    <p className={railSection}>タグ</p>

    <ErrorBoundary fallback={<p>エラーが発生しました</p>}>
      <Suspense>
        <TagLinkList
          renderTagLinkListItem={(tag) => <TagLink key={tag.id} tag={tag} />}
        />
      </Suspense>
    </ErrorBoundary>
  </nav>
);
