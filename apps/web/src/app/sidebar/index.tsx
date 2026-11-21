import { Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { css } from "styled-system/css";

import {
  rail,
  railError,
  railManageLink,
  railSection,
  railSectionRow,
} from "../../features/app-shell/styles";
import { useIsInTagPage } from "../../shared/hooks/use-is-tag-page";
import { skeletonBar } from "../../shared/styles/feedback";
import { FavoriteBookmarkLink } from "./link-items/favorite";
import { InboxBookmarkLink } from "./link-items/inbox";
import { RecentBookmarkLink } from "./link-items/recent";
import { TagLink, TagLinkList } from "./link-items/tag";

const railSkeletonList = css({
  display: "flex",
  flexDirection: "column",
  paddingBlock: "1",
  paddingInline: "2.5",
  rowGap: "2",
});

const railSkeletonItem = css({
  blockSize: "[1.5rem]",
});

const TagLinkListFallback = () => (
  <div aria-hidden className={railSkeletonList}>
    {["80%", "65%", "72%"].map((width) => (
      <span
        className={`${skeletonBar} ${railSkeletonItem}`}
        key={width}
        style={{ inlineSize: width }}
      />
    ))}
  </div>
);

export const SideBar = () => {
  const isTagPage = useIsInTagPage();

  return (
    <nav aria-label="メインナビゲーション" className={rail}>
      <RecentBookmarkLink />
      <InboxBookmarkLink />
      <FavoriteBookmarkLink />

      <div className={railSectionRow}>
        <p className={railSection}>タグ</p>
        <Link
          aria-current={isTagPage ? "page" : undefined}
          className={railManageLink}
          to="/tags"
        >
          管理
        </Link>
      </div>

      <ErrorBoundary
        fallback={<p className={railError}>タグを読み込めませんでした</p>}
      >
        <Suspense fallback={<TagLinkListFallback />}>
          <TagLinkList
            renderTagLinkListItem={(tag) => <TagLink key={tag.id} tag={tag} />}
          />
        </Suspense>
      </ErrorBoundary>
    </nav>
  );
};
