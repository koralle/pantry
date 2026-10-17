import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Pencil } from "lucide-react";

import { FaviconTile } from "../../../shared/components/favicon-tile";
import { button } from "../../../shared/components/styled-button/styles";
import { TagChip } from "../../../shared/components/tag-chip";
import {
  backlink,
  detailActs,
  detailActsSpacer,
  detailBacklinkRow,
  detailCard,
  detailDates,
  detailDomain,
  detailNote,
  detailPage,
  detailTags,
  detailTitle,
  detailTop,
  detailUrl,
  detailWrap,
} from "../../../shared/styles/detail";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import {
  buildListBackSearch,
  detailSearchFromList,
} from "../../navigation/lib/bookmark-search-builders";
import { domainOf } from "../lib/domain-of";
import { formatDate } from "../lib/format/format-date-time";
import type { BookmarkDetail } from "../persistence/get-bookmark-detail";
import { BookmarkDeleteDialog } from "./bookmark-delete-dialog";
import { BookmarkFavoriteToggle } from "./bookmark-favorite-toggle";

export const BookmarkDetailContent = ({
  bookmark,
  listSearch,
}: {
  readonly bookmark: BookmarkDetail;
  readonly listSearch: BookmarkSearchSchema;
}) => {
  const domain = domainOf(bookmark.url);

  return (
    <div className={detailPage}>
      <div className={detailBacklinkRow}>
        <Link to="/bookmarks" search={listSearch} className={backlink}>
          <ArrowLeft size={13} aria-hidden /> 一覧
        </Link>
      </div>

      <div className={detailWrap}>
        <article className={detailCard}>
          <div className={detailTop}>
            <FaviconTile domain={domain} size="lg" />
            <span className={detailDomain}>{domain}</span>
            <BookmarkFavoriteToggle
              favorite={bookmark.favorite}
              id={bookmark.id}
            />
          </div>

          <h1 className={detailTitle}>{bookmark.title}</h1>

          <a
            className={detailUrl}
            href={bookmark.url}
            rel="noreferrer"
            target="_blank"
          >
            <ArrowUpRight aria-hidden size={12} /> {bookmark.url}
          </a>

          {bookmark.tagNames.length > 0 ? (
            <div className={detailTags}>
              {bookmark.tagNames.map((name) => (
                <Link
                  key={name}
                  search={buildListBackSearch([name], listSearch)}
                  to="/bookmarks"
                >
                  <TagChip name={name} />
                </Link>
              ))}
            </div>
          ) : null}

          {bookmark.note === null ? null : (
            <p className={detailNote}>{bookmark.note}</p>
          )}

          <div className={detailDates}>
            <span>作成 {formatDate(bookmark.createdAt)}</span>
            <span>更新 {formatDate(bookmark.updatedAt)}</span>
          </div>

          <div className={detailActs}>
            <a
              className={button({ visual: "accent" })}
              href={bookmark.url}
              rel="noreferrer"
              target="_blank"
            >
              <ArrowUpRight aria-hidden size={13} /> サイトを開く
            </a>
            <Link
              className={button()}
              params={{ id: bookmark.id }}
              search={detailSearchFromList(listSearch)}
              to="/bookmarks/$id/edit"
            >
              <Pencil aria-hidden size={13} /> 編集
            </Link>
            <span aria-hidden className={detailActsSpacer} />
            <BookmarkDeleteDialog bookmark={bookmark} listSearch={listSearch} />
          </div>
        </article>
      </div>
    </div>
  );
};
