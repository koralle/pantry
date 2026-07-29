import { Link } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink, Pencil } from 'lucide-react'
import { css } from 'styled-system/css'

import { StyledLink } from '../../../shared/components/styled-link'
import { button } from '../../../styles/button'
import { dialogActions } from '../../../styles/dialog'
import { tagChip } from '../../../styles/tag-chip'
import { workbenchNav, workbenchTitle } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { getBookmark } from '../functions/get-bookmark'
import { formatDateTime } from '../lib/format-date-time'
import { BookmarkDeleteDialog } from './bookmark-delete-dialog'

const detailHeader = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingBlockStart: '2',
  paddingBlockEnd: '1'
})
const detailUrl = css({ color: 'accent.solid', wordBreak: 'break-all', lineHeight: 'body' })
const detailNote = css({
  margin: '0',
  color: 'fg.default',
  lineHeight: 'relaxed',
  whiteSpace: 'pre-wrap'
})
const detailTags = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  margin: '0',
  padding: '0',
  listStyle: 'none'
})
const detailMeta = css({ margin: '0', color: 'fg.muted' })
const detailDates = css({ display: 'grid', gap: '3', margin: '0' })
const detailDatesGroup = css({ display: 'grid', gap: '1' })
const detailDatesDt = css({ color: 'fg.muted', fontSize: 'xs2' })
const detailDatesDd = css({ margin: '0', fontVariantNumeric: 'tabular-nums' })

export function BookmarkDetailContent({
  bookmark,
  tagNames,
  listSearch
}: {
  readonly bookmark: Awaited<ReturnType<typeof getBookmark>>
  readonly tagNames: string[]
  readonly listSearch: ReturnType<typeof buildListBackSearch>
}) {
  return (
    <>
      <nav className={workbenchNav}>
        <StyledLink
          to='/'
          search={listSearch}
          visual='accent'>
          <ArrowLeft
            size={16}
            aria-hidden
          />{' '}
          一覧へ戻る
        </StyledLink>
      </nav>

      <header className={detailHeader}>
        <h1 className={workbenchTitle}>{bookmark.title}</h1>
        <a
          href={bookmark.url}
          target='_blank'
          rel='noreferrer'
          className={detailUrl}>
          {bookmark.url}{' '}
          <ExternalLink
            size={14}
            aria-hidden
          />
        </a>
      </header>

      {bookmark.note ? <p className={detailNote}>{bookmark.note}</p> : null}

      {tagNames.length > 0 ? (
        <ul className={detailTags}>
          {tagNames.map((name) => (
            <li key={name}>
              <Link
                to='/'
                search={buildListBackSearch([name])}
                className={tagChip({ visual: 'link' })}>
                {name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={detailMeta}>タグなし</p>
      )}

      <dl className={detailDates}>
        <div className={detailDatesGroup}>
          <dt className={detailDatesDt}>作成</dt>
          <dd className={detailDatesDd}>{formatDateTime(bookmark.createdAt)}</dd>
        </div>
        <div className={detailDatesGroup}>
          <dt className={detailDatesDt}>更新</dt>
          <dd className={detailDatesDd}>{formatDateTime(bookmark.updatedAt)}</dd>
        </div>
      </dl>

      <div className={dialogActions}>
        <Link
          to='/bookmarks/$id/edit'
          params={{ id: bookmark.id }}
          search={listSearch.tags !== undefined ? { tags: listSearch.tags } : {}}
          className={button({ visual: 'accent' })}>
          <Pencil
            size={16}
            aria-hidden
          />{' '}
          編集
        </Link>

        <BookmarkDeleteDialog
          bookmark={bookmark}
          listSearch={listSearch}
        />
      </div>
    </>
  )
}
