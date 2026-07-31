import { Input } from '@base-ui/react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { css } from 'styled-system/css'
import * as v from 'valibot'

import { StyledButton } from '../../../shared/components/styled-button'
import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import { fieldError, fieldInput } from '../../../styles/form'
import type {
  CreateTag,
  CreateTagError,
  CreateTagResult,
  SelectableTag
} from '../../tags/application/create-tag'
import { tagNameSchema } from '../../tags/domain/tag-values'
import type { TagId } from '../../tags/domain/tag-values'

export type { CreateTag, CreateTagError, CreateTagResult, SelectableTag }

type SelectionProps = {
  readonly selectedTagIds: readonly TagId[]
  readonly onSelectedTagIdsChange: (tagIds: readonly TagId[]) => void
}

const tagField = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  margin: '0',
  padding: '0',
  borderWidth: 'none',
  minInlineSize: '0'
})

const tagFieldLegend = css({
  fontWeight: 'semibold',
  marginBlockEnd: '1'
})

const tagOptionList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  maxBlockSize: '16rem',
  overflowY: 'auto'
})

const tagOption = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minBlockSize: 'touch'
})

const tagQueryRow = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',
  alignItems: 'center',
  '& > :first-child': {
    flex: '1',
    minInlineSize: '12rem'
  }
})

const tagStatus = css({
  margin: '0',
  color: 'fg.muted'
})

const tagActions = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2'
})

function Frame({ children }: { readonly children: ReactNode }) {
  return (
    <fieldset
      className={tagField}
      aria-label='タグ'>
      <legend className={tagFieldLegend}>タグ</legend>
      {children}
    </fieldset>
  )
}

function createErrorMessage(error: CreateTagError): string {
  switch (error.code) {
    case 'invalid-tag-name': {
      return 'タグ名を入力してください（32文字以内）'
    }
    case 'duplicate-tag-name': {
      return 'そのタグ名は既に存在します'
    }
    case 'unexpected-error': {
      return 'タグの作成に失敗しました'
    }
    default: {
      return 'タグの作成に失敗しました'
    }
  }
}

function parseCreateName(raw: string): Result<string, CreateTagError> {
  const parsed = v.safeParse(tagNameSchema, raw)
  if (!parsed.success) {
    return err({ code: 'invalid-tag-name', field: 'name' })
  }
  return ok(parsed.output)
}

async function runCreateTag(
  query: string,
  onCreateTag: CreateTag
): Promise<Result<SelectableTag, CreateTagError>> {
  const nameResult = parseCreateName(query)
  if (!nameResult.ok) {
    return nameResult
  }
  return onCreateTag(nameResult.value)
}

function useCreateTagAction(onCreateTag: CreateTag, onCreated?: (tag: SelectableTag) => void) {
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function createFromQuery(query: string) {
    setCreateError(null)
    setCreating(true)
    try {
      const result = await runCreateTag(query, onCreateTag)
      if (!result.ok) {
        setCreateError(createErrorMessage(result.error))
        return
      }
      onCreated?.(result.value)
    } finally {
      setCreating(false)
    }
  }

  return {
    createError,
    creating,
    clearCreateError: () => setCreateError(null),
    createFromQuery
  }
}

function QueryAndCreate({
  query,
  onQueryChange,
  onCreateTag,
  onCreated,
  inputId
}: {
  readonly query: string
  readonly onQueryChange: (value: string) => void
  readonly onCreateTag: CreateTag
  readonly onCreated?: (tag: SelectableTag) => void
  readonly inputId: string
}) {
  const { createError, creating, clearCreateError, createFromQuery } = useCreateTagAction(
    onCreateTag,
    onCreated
  )

  return (
    <div>
      <label htmlFor={inputId}>
        <Search
          size={16}
          aria-hidden
        />{' '}
        タグを絞り込む / 新規作成
      </label>
      <div className={tagQueryRow}>
        <Input
          id={inputId}
          className={fieldInput}
          value={query}
          type='text'
          placeholder='タグを絞り込む / 新規作成'
          disabled={creating}
          onValueChange={(value) => {
            onQueryChange(value)
            clearCreateError()
          }}
        />
        <StyledButton
          type='button'
          onClick={() => {
            createFromQuery(query).catch(() => {
              /* CreateError で表示 */
            })
          }}
          disabled={creating}>
          <Plus
            size={16}
            aria-hidden
          />{' '}
          {creating ? '作成中…' : 'この名前で作成'}
        </StyledButton>
      </div>
      {createError !== null ? (
        <p
          className={fieldError}
          role='alert'>
          {createError}
        </p>
      ) : null}
    </div>
  )
}

function Loading() {
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

function ErrorState({
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

function Blank({
  onCreateTag,
  onCreated
}: {
  readonly onCreateTag: CreateTag
  readonly onCreated?: (tag: SelectableTag) => void
}) {
  const inputId = useId()
  const [query, setQuery] = useState('')

  return (
    <Frame>
      <p className={tagStatus}>タグがまだありません。名前を入れて作成できます。</p>
      <QueryAndCreate
        inputId={inputId}
        query={query}
        onQueryChange={setQuery}
        onCreateTag={onCreateTag}
        onCreated={(tag) => {
          setQuery('')
          onCreated?.(tag)
        }}
      />
    </Frame>
  )
}

function Ready({
  tags,
  selectedTagIds,
  onSelectedTagIdsChange,
  onCreateTag
}: SelectionProps & {
  readonly tags: readonly SelectableTag[]
  readonly onCreateTag: CreateTag
}) {
  const inputId = useId()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(normalizedQuery))

  function toggleTag(tagId: TagId) {
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      onSelectedTagIdsChange([...selectedTagIds, tagId])
    }
  }

  return (
    <Frame>
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

/**
 * タグ領域の状態ごとの明示的バリアント。
 * loading / blank / error / ready を boolean の組み合わせで切り替えない。
 */
export const BookmarkTagField = {
  Loading,
  Error: ErrorState,
  Blank,
  Ready
}
