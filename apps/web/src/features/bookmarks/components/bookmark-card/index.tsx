/**
 * @file index.tsx
 *
 * Input:    row props (title/domain/date/tags/star/favicon/url)
 * Output:   BookmarkCard / BookmarkCardGrid components
 * Position: Desktop card layout for the bookmark list
 *
 * SYNC: When modified, update these files to stay in sync:
 * - ../bookmark-list/index.tsx
 * - ../../styles.ts
 */

import { Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import { visuallyHidden } from "styled-system/patterns";

import { FaviconTile } from "../../../../shared/components/favicon-tile";
import { TagChip } from "../../../../shared/components/tag-chip";
import {
  cardCell,
  cardDate,
  cardDomain,
  cardFoot,
  cardGrid,
  cardPrimaryLink,
  cardStar,
  cardSurface,
  cardTitleWrap,
  cardTop,
  cardTopRight,
  externalActionLink,
  rowTagOverflow,
} from "../../styles";
import type { BookmarkRowProps } from "../bookmark-row";

const MAX_CARD_TAGS = 3;

export const BookmarkCard = ({
  id,
  title,
  domain,
  dateLabel,
  url,
  tags,
  starred,
  faviconFailed,
  selected,
}: BookmarkRowProps) => {
  const allTags = tags ?? [];
  const visibleTags = allTags.slice(0, MAX_CARD_TAGS);
  const overflowCount = allTags.length - visibleTags.length;
  const hasUrl = url !== undefined && url !== "";

  return (
    <article className={cardSurface({ selected })} data-bookmark-id={id}>
      <div className={cardTop}>
        <FaviconTile domain={domain} failed={faviconFailed} size="lg" />
        <span className={cardDomain}>{domain}</span>
        {starred || hasUrl ? (
          <div className={cardTopRight}>
            {starred ? (
              <span className={cardStar}>
                <Star
                  aria-hidden
                  fill="currentColor"
                  size={14}
                  strokeWidth={0}
                />
                <span className={visuallyHidden()}>お気に入り</span>
              </span>
            ) : null}
            {hasUrl ? (
              <a
                aria-label={`${title} を新しいタブで開く`}
                className={externalActionLink}
                href={url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden size={14} />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={cardTitleWrap}>
        <Link
          aria-current={selected ? "true" : undefined}
          className={cardPrimaryLink}
          data-primary-link
          params={{ id }}
          to="/bookmarks/$id"
        >
          {title}
        </Link>
      </div>
      <div className={cardFoot}>
        {visibleTags.map((tag) => (
          <TagChip color={tag.color} key={tag.name} name={tag.name} />
        ))}
        {overflowCount > 0 ? (
          <span className={rowTagOverflow}>+{overflowCount}</span>
        ) : null}
        <span className={cardDate}>{dateLabel}</span>
      </div>
    </article>
  );
};

export interface BookmarkCardGridProps {
  items: BookmarkRowProps[];
  selectedId?: string | undefined;
}

export const BookmarkCardGrid = ({
  items,
  selectedId,
}: BookmarkCardGridProps) => (
  <ul className={cardGrid} data-card-grid>
    {items.map((item) => (
      <li className={cardCell} key={item.id}>
        <BookmarkCard {...item} selected={item.id === selectedId} />
      </li>
    ))}
  </ul>
);
