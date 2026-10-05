import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cx } from "styled-system/css";

import { railItem, railCount } from "../../../features/app-shell/styles";
import type { ShelfTag } from "../../../features/tags/lib/tag-shelf";
import { orpc } from "../../../rpc/query";
import { TagDot } from "../../../shared/components/tag-chip";
import { toneFor } from "../../../shared/styles/domain-tone";

interface TagListProps {
  renderTagLinkListItem: (tag: ShelfTag) => ReactNode;
}

export const TagLinkList = ({
  renderTagLinkListItem,
}: TagListProps): ReactNode[] => {
  const { data: tags } = useSuspenseQuery(
    orpc.tags.shelf.queryOptions({ staleTime: 5000 })
  );

  return tags.map((tag): ReactNode => renderTagLinkListItem(tag));
};

export const TagLink = ({ tag }: { tag: ShelfTag }) => {
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
