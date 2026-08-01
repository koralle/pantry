import { RefreshCw } from 'lucide-react'
import { useId, useState } from 'react'

import { StyledButton } from '../../../../shared/components/styled-button'
import { fieldError } from '../../../../styles/form'
import type { TagId } from '../../../tags/domain/tag-values'
import { Frame } from './frame'
import { QueryAndCreate } from './query-and-create'
import { ServerErrorNotice } from './server-error-notice'
import { tagActions, tagOption, tagOptionList, tagStatus } from './styles'
import type { CreateTag, SelectableTag, SelectionProps, ServerErrorProps } from './types'

export function Loading() {
  return (
    <Frame>
      <p
        className={tagStatus}
        aria-busy='true'
        aria-live='polite'>
        タグを読み込み中…
      </p>
    </Frame>
  )
}

export function ErrorState({
  message,
  onRetry
}: {
  readonly message: string
  readonly onRetry: () => void
}) {
  return (
    <Frame>
      <p
        className={fieldError}
        role='alert'>
        {message}
      </p>
      <div className={tagActions}>
        <StyledButton
          type='button'
          onClick={onRetry}>
          <RefreshCw
            size={16}
            aria-hidden
          />{' '}
          再試行
        </StyledButton>
      </div>
    </Frame>
  )
}

export function Blank({
  onCreateTag,
  onCreated,
  serverError,
  onClearServerError
}: {
  readonly onCreateTag: CreateTag
  readonly onCreated?: (tag: SelectableTag) => void
} & ServerErrorProps) {
  const inputId = useId()
  const [query, setQuery] = useState('')

  return (
    <Frame>
      <p className={tagStatus}>タグがまだありません。名前を入れて作成できます。</p>
      {serverError != null && serverError !== '' ? (
        <ServerErrorNotice message={serverError} />
      ) : null}
      <QueryAndCreate
        inputId={inputId}
        query={query}
        onQueryChange={setQuery}
        onCreateTag={onCreateTag}
        onBeforeCreate={onClearServerError}
        onCreated={(tag) => {
          setQuery('')
          onCreated?.(tag)
        }}
      />
    </Frame>
  )
}

export function Ready({
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
  onCreateTag,
  serverError,
  onClearServerError
}: SelectionProps & {
  readonly tags: readonly SelectableTag[]
  readonly onCreateTag: CreateTag
} & ServerErrorProps) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(normalizedQuery))

  function toggleTag(tagId: TagId) {
    // タグ選択の変更は「BookmarkEditor が保持している更新 server error (tags)」を
    // 意味的に無効化するので、変更前に server error を clear する。
    // BookmarkForm の URL/title 入力変更とは分離した clear 経路にしている。
    onClearServerError?.()
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onSelectedTagIdsChange([...selectedTagIds, tagId])
    }
  }

  return (
    <Frame>
      {serverError != null && serverError !== '' ? (
        <ServerErrorNotice message={serverError} />
      ) : null}

      <div className={tagOptionList}>
        {filteredTags.map((tag) => {
          const optionId = `${inputId}-tag-${tag.id}`
          return (
            <label
              key={tag.id}
              htmlFor={optionId}
              className={tagOption}>
              <input
                id={optionId}
                type='checkbox'
                checked={selectedTagIds.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
              />
              {tag.name}
            </label>
          )
        })}
      </div>

      <QueryAndCreate
        inputId={inputId}
        query={query}
        onQueryChange={setQuery}
        onCreateTag={onCreateTag}
        onBeforeCreate={onClearServerError}
        onCreated={(tag) => {
          setQuery('')
          if (!selectedTagIds.includes(tag.id)) {
            onSelectedTagIdsChange([...selectedTagIds, tag.id])
          }
        }}
      />
    </Frame>
  )
}
