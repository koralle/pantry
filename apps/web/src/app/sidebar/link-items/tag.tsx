import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cx } from "styled-system/css";

import {
  railCount,
  railItem,
  railLabel,
} from "../../../features/app-shell/styles";
import type { ShelfTag } from "../../../features/tags/lib/tag-shelf";
import { orpc } from "../../../rpc/client/query";
import { TagDot } from "../../../shared/components/tag-chip";
import { toneFor } from "../../../shared/styles/domain-tone";

interface TagListProps {
  renderTagLinkListItem: (tag: ShelfTag) => ReactNode;
}

export const TagLinkList = ({
  renderTagLinkListItem,
}: TagListProps): ReactNode => {
  const { data: tags } = useSuspenseQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );

  return <>{tags.map((tag): ReactNode => renderTagLinkListItem(tag))}</>;
};

export const TagLink = ({ tag }: { tag: ShelfTag }) => {
  const matchRoute = useMatchRoute();

  const isActive = !!matchRoute({
    to: "/bookmarks",
    search: { tags: [tag.name] },
  });

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={railItem({ active: isActive })}
      data-rail-tag
      search={{
        tags: [tag.name],
      }}
      to="/bookmarks"
    >
      <TagDot color={tag.color} tone={toneFor(tag.name)} />
      <span className={railLabel}>{tag.name}</span>
      <span className={cx(railCount, "pantry-rail-count")}>
        {tag.bookmarkCount}
      </span>
    </Link>
  );
};
