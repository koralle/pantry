import { Check, Plus } from 'lucide-react'
import { ListBox, ListBoxItem, SearchField } from 'react-aria-components'

import { StyledButton } from '../../../../shared/components/styled-button'
import { StyledInput } from '../../../../shared/components/styled-input'
import { srOnly } from '../../../../styles/sr-only'
import { toTagName } from '../../../tags/domain/tag-values'
import { sortTagsForNav } from '../../../tags/lib/tag-shelf'
import { canOfferCreateTag, filterTagCandidates } from './lib'
import type { NamedTag, TagCandidate } from './lib'
import {
  candidateItem,
  candidateList,
  candidateName,
  candidateState,
  checkSlot,
  emptyState,
  panel,
  sheetList
} from './styles'

type TagPickerPanelProps = {
  readonly tagCandidates: readonly TagCandidate[]
  readonly selectedTags: readonly NamedTag[]
  readonly query: string
  readonly onQueryChange: (query: string) => void
  readonly onToggleTag: (tag: NamedTag) => void
  readonly onCreateTag: (name: string) => void
  readonly tagsReady: boolean
  readonly isCreatingTag: boolean
  readonly listMaxHeight?: 'sheet' | 'popover'
}

export function TagPickerPanel({
  tagCandidates,
  selectedTags,
  query,
  onQueryChange,
  onToggleTag,
  onCreateTag,
  tagsReady,
  isCreatingTag,
  listMaxHeight = 'popover'
}: TagPickerPanelProps) {
  const selectedIds = new Set(selectedTags.map((tag) => tag.id))
  const candidates = filterTagCandidates(sortTagsForNav(tagCandidates), query)
  const canCreate = canOfferCreateTag({ query, tags: tagCandidates, tagsReady })

  function renderEmpty() {
    if (!tagsReady) {
      return <output className={emptyState}>タグ候補を読み込み中です</output>
    }
    if (canCreate) {
      return null
    }
    if (query.trim() === '') {
      return <p className={emptyState}>タグはまだありません</p>
    }
    return <p className={emptyState}>該当するタグはありません</p>
  }

  return (
    <div className={panel}>
      <SearchField
        value={query}
        onChange={onQueryChange}
        aria-label='タグを検索'
        onSubmit={() => undefined}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
          }
        }}>
        <StyledInput
          type='search'
          placeholder='タグ名で探す'
        />
      </SearchField>

      <ListBox
        aria-label='タグ候補'
        className={listMaxHeight === 'sheet' ? `${candidateList} ${sheetList}` : candidateList}
        items={[...candidates]}
        selectionMode='none'
        renderEmptyState={renderEmpty}>
        {(tag) => {
          const selected = selectedIds.has(tag.id)
          return (
            <ListBoxItem
              id={tag.id}
              textValue={tag.name}
              aria-selected={selected}
              data-selected={selected ? 'true' : 'false'}
              className={candidateItem}
              onAction={() => {
                onToggleTag({ id: tag.id, name: tag.name })
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                }
              }}>
              {selected ? (
                <Check
                  size={16}
                  aria-hidden
                />
              ) : (
                <span
                  aria-hidden
                  className={checkSlot}
                />
              )}
              <span className={candidateName}>{tag.name}</span>
              <span className={selected ? candidateState : srOnly}>
                {selected ? '選択済み' : '未選択'}
              </span>
            </ListBoxItem>
          )
        }}
      </ListBox>

      {canCreate ? (
        <StyledButton
          type='button'
          onPress={() => {
            onCreateTag(query)
          }}
          isDisabled={isCreatingTag}>
          <Plus
            size={16}
            aria-hidden
          />
          {isCreatingTag ? '作成中…' : `「${toTagName(query).display}」を新しいタグとして作成`}
        </StyledButton>
      ) : null}
    </div>
  )
}
