import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { cx } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { FaviconTile } from "../../../../shared/components/favicon-tile";
import { TagChip } from "../../../../shared/components/tag-chip";
import { domainToneVar, toneFor } from "../../../../styles/domain-tone";
import {
  rowDate,
  rowDomain,
  rowHover,
  rowLink,
  rowMain,
  rowMeta,
  rowMetaDot,
  rowMetaDots,
  rowStar,
  rowTags,
  rowTitle,
  rowTitleMobile,
} from "../../../../styles/list";

export interface BookmarkTag {
  name: string;
  color?: string | null | undefined;
}

export interface BookmarkRowProps {
  id: string;
  title: string;
  domain: string;
  dateLabel: string;
  tags?: BookmarkTag[] | undefined;
  starred?: boolean | undefined;
  faviconFailed?: boolean | undefined;
  selected?: boolean | undefined;
}

const StarMark = () => (
  <span className={rowStar}>
    <Star aria-hidden size={13} fill="currentColor" strokeWidth={0} />
    <span className={visuallyHidden()}>お気に入り</span>
  </span>
);

export const BookmarkRow = ({
  id,
  title,
  domain,
  dateLabel,
  tags,
  starred,
  faviconFailed,
  selected,
}: BookmarkRowProps) => {
  const params = { id };
  return (
    <>
      <Link
        aria-current={selected ? "true" : undefined}
        className={cx(rowLink({ layout: "desktop", selected }), rowHover)}
        params={params}
        to="/bookmarks/$id"
      >
        <FaviconTile domain={domain} failed={faviconFailed} />
        <span className={rowTitle}>{title}</span>
        <span className={rowDomain}>{domain}</span>
        <span className={rowTags}>
          {(tags ?? []).map((tag) => (
            <TagChip color={tag.color} key={tag.name} name={tag.name} />
          ))}
        </span>
        {starred ? <StarMark /> : null}
        <span className={rowDate}>{dateLabel}</span>
      </Link>
      <Link
        aria-current={selected ? "true" : undefined}
        className={cx(rowLink({ layout: "mobile", selected }), rowHover)}
        params={params}
        to="/bookmarks/$id"
      >
        <FaviconTile domain={domain} failed={faviconFailed} size="md" />
        <span className={rowMain}>
          <span className={rowTitleMobile}>{title}</span>
          <span className={rowMeta}>
            <span>
              {domain} · {dateLabel}
            </span>
            <span className={rowMetaDots}>
              {(tags ?? []).map((tag) => (
                <span
                  aria-hidden
                  className={rowMetaDot}
                  key={tag.name}
                  style={{
                    background: tag.color ?? domainToneVar[toneFor(tag.name)],
                  }}
                />
              ))}
            </span>
          </span>
        </span>
        {starred ? <StarMark /> : null}
      </Link>
    </>
  );
};
