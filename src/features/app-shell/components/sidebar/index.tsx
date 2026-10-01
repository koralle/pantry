import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLocation, useMatchRoute } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import { Suspense, useMemo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cx } from "styled-system/css";

import { orpc } from "../../../../rpc/query";
import { TagDot } from "../../../../shared/components/tag-chip";
import { toneFor } from "../../../../shared/styles/domain-tone";
import type { ShelfTag } from "../../../tags/lib/tag-shelf";
import { rail, railCount, railIcon, railItem, railSection } from "../../styles";
import { ViewLinks, ViewLinksSkelton } from "./links/view-links";

const TagLink = ({ tag }: { tag: ShelfTag }) => {
  const matchRoute = useMatchRoute();

  const isActive = !!matchRoute({
    to: "/bookmarks",
    search: { tags: [tag.name] },
  });

  return (
    <Link
      to="/bookmarks"
      className={railItem({ active: isActive })}
      data-rail-tag
      search={{
        tags: [tag.name],
      }}
    >
      <TagDot color={tag.color} tone={toneFor(tag.name)} />
      {tag.name}
      <span className={cx(railCount, "pantry-rail-count")}>
        {tag.bookmarkCount}
      </span>
    </Link>
  );
};

const TagList = () => {
  const { data: tags } = useSuspenseQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );

  return tags.map((tag) => <TagLink key={tag.id} tag={tag} />);
};

const TagPageLink = () => {
  const pathname = useLocation({ select: (location) => location.pathname });
  const isActive = useMemo(() => pathname === "/tags", [pathname]);

  return (
    <Link
      to="/tags"
      search={{ limit: 50, offset: 0 }}
      className={railItem({ active: isActive })}
    >
      <Tag aria-hidden className={cx(railIcon, "pantry-rail-icon")} size={15} />
      タグ管理
    </Link>
  );
};

export const SideBar = () => (
  <nav aria-label="ビュー" className={rail}>
    <ErrorBoundary fallback={<p>エラーが発生しました</p>}>
      <Suspense fallback={<ViewLinksSkelton />}>
        <ViewLinks />
      </Suspense>
    </ErrorBoundary>

    <p className={railSection}>タグ</p>

    <TagPageLink />

    <ErrorBoundary fallback={<p>エラーが発生しました</p>}>
      <Suspense>
        <TagList />
      </Suspense>
    </ErrorBoundary>
  </nav>
);
