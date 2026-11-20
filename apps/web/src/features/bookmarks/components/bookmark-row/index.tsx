import { Link } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import { visuallyHidden } from "styled-system/patterns";

import { FaviconTile } from "../../../../shared/components/favicon-tile";
import { TagChip } from "../../../../shared/components/tag-chip";
import {
  externalActionLink,
  rowArticle,
  rowContent,
  rowDate,
  rowDomain,
  rowMetaLine,
  rowMetaSep,
  rowPrimaryLink,
  rowStar,
  rowTagOverflow,
  rowTags,
  rowTile,
  rowTitleWrap,
} from "../../styles";

export interface BookmarkTag {
  name: string;
  color?: string | null | undefined;
}

export interface BookmarkRowProps {
  id: string;
  title: string;
  domain: string;
  dateLabel: string;
  url?: string | undefined;
  tags?: BookmarkTag[] | undefined;
  starred?: boolean | undefined;
  faviconFailed?: boolean | undefined;
  selected?: boolean | undefined;
}

const MAX_VISIBLE_TAGS = 3;

const StarMark = () => (
  <span className={rowStar}>
    <Star aria-hidden fill="currentColor" size={13} strokeWidth={0} />
    <span className={visuallyHidden()}>お気に入り</span>
  </span>
);

export const BookmarkRow = ({
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
  const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = allTags.length - visibleTags.length;

  return (
    <article className={rowArticle({ selected })} data-bookmark-id={id}>
      <div className={rowTile}>
        <FaviconTile domain={domain} failed={faviconFailed} size="md" />
      </div>
      <div className={rowContent}>
        <div className={rowTitleWrap}>
          <Link
            aria-current={selected ? "true" : undefined}
            className={rowPrimaryLink}
            data-primary-link
            params={{ id }}
            to="/bookmarks/$id"
          >
            {title}
          </Link>
        </div>
        {visibleTags.length > 0 ? (
          <div className={rowTags}>
            {visibleTags.map((tag) => (
              <TagChip color={tag.color} key={tag.name} name={tag.name} />
            ))}
            {overflowCount > 0 ? (
              <span className={rowTagOverflow}>+{overflowCount}</span>
            ) : null}
          </div>
        ) : null}
        <div className={rowMetaLine}>
          <span className={rowDomain}>{domain}</span>
          <span aria-hidden className={rowMetaSep}>
            ·
          </span>
          <span className={rowDate}>{dateLabel}</span>
          {starred ? <StarMark /> : null}
        </div>
      </div>
      {url !== undefined && url !== "" ? (
        <a
          aria-label={`${title} を新しいタブで開く`}
          className={externalActionLink}
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden size={15} />
        </a>
      ) : null}
    </article>
  );
};
