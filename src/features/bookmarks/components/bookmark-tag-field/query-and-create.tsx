import { Input } from '@base-ui/react'
import { Plus, Search } from 'lucide-react'

import { StyledButton } from '../../../../shared/components/styled-button'
import { fieldError, fieldInput } from '../../../../styles/form'
import { tagQueryRow } from './styles'
import type { CreateTag, SelectableTag } from './types'
import { useCreateTagAction } from './use-create-tag-action'

type QueryAndCreateProps = {
  readonly query: string
  readonly onQueryChange: (value: string) => void
  readonly onCreateTag: CreateTag
  readonly onCreated?: (tag: SelectableTag) => void
  /** タグ作成の直前に呼ばれる。更新 server error を clear する用途を想定。 */
  readonly onBeforeCreate?: (() => void) | undefined
  readonly inputId: string
}

export function QueryAndCreate({
  query,
  onQueryChange,
  onCreateTag,
  onCreated,
  onBeforeCreate,
  inputId
}: QueryAndCreateProps) {
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
            onBeforeCreate?.()
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
