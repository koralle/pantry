import { useNavigate } from '@tanstack/react-router'

import { StyledLink } from '../../../shared/components/styled-link'
import { UiEmpty } from '../../../shared/components/ui-empty'
import { workbench } from '../../../styles/workbench'
import { buildListBackSearch } from '../../navigation/lib/bookmark-search-builders'
import type { loadBookmarkEditor } from '../loaders/load-bookmark-editor'
import { EditWorkbench } from './edit-bookmark-workbench'

export function EditBookmarkScreen({
  data,
  searchTags
}: {
  readonly data: Awaited<ReturnType<typeof loadBookmarkEditor>>
  readonly searchTags: string[] | undefined
}) {
  const navigate = useNavigate()
  const listSearch = buildListBackSearch(searchTags)

  if (data.kind === 'not-found') {
    return (
      <section
        className={workbench}
        aria-label='ブックマーク編集'>
        <UiEmpty
          title='このブックマークは見つかりません'
          action={
            <StyledLink
              to='/'
              search={listSearch}
              visual='accent'>
              一覧へ戻る
            </StyledLink>
          }
        />
      </section>
    )
  }

  return (
    <EditWorkbench
      bookmark={data.bookmark}
      tags={data.tags}
      listSearch={listSearch}
      searchTags={searchTags}
      navigate={navigate}
    />
  )
}
