/**
 * @file index.tsx
 *
 * Input:    row props (title/domain/date/tags/star/favicon)
 * Output:   BookmarkCard / BookmarkCardGrid components
 * Position: Desktop-only card layout for the bookmark list (mock:
 *           e-final-cards.html — favicon tile + domain + ★ / title / tags + date)
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ../bookmark-list/index.tsx
 * - ../../styles.ts
 */

import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { visuallyHidden } from "styled-system/patterns";

import { FaviconTile } from "../../../../shared/components/favicon-tile";
import { TagChip } from "../../../../shared/components/tag-chip";
import {
  cardDate,
  cardDomain,
  cardFoot,
  cardGrid,
  cardLink,
  cardStar,
  cardTitle,
  cardTop,
} from "../../styles";
import type { BookmarkRowProps } from "../bookmark-row";

export const BookmarkCard = ({
  id,
  title,
  domain,
  dateLabel,
  tags,
  starred,
  faviconFailed,
  selected,
}: BookmarkRowProps) => (
  <Link
    aria-current={selected ? "true" : undefined}
    className={cardLink({ selected })}
    data-bookmark-id={id}
    params={{ id }}
    to="/bookmarks/$id"
  >
    <span className={cardTop}>
      <FaviconTile domain={domain} failed={faviconFailed} size="lg" />
      <span className={cardDomain}>{domain}</span>
      {starred ? (
        <span className={cardStar}>
          <Star aria-hidden fill="currentColor" size={14} strokeWidth={0} />
          <span className={visuallyHidden()}>お気に入り</span>
        </span>
      ) : null}
    </span>
    <span className={cardTitle}>{title}</span>
    <span className={cardFoot}>
      {(tags ?? []).map((tag) => (
        <TagChip color={tag.color} key={tag.name} name={tag.name} />
      ))}
      <span className={cardDate}>{dateLabel}</span>
    </span>
  </Link>
);

export interface BookmarkCardGridProps {
  items: BookmarkRowProps[];
  selectedId?: string | undefined;
}

export const BookmarkCardGrid = ({
  items,
  selectedId,
}: BookmarkCardGridProps) => (
  <div className={cardGrid}>
    {items.map((item) => (
      <BookmarkCard key={item.id} {...item} selected={item.id === selectedId} />
    ))}
  </div>
);
