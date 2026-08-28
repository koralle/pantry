import { startTransition, useActionState, useRef, useState } from 'react'

import { toTagName } from '../../../../tags/domain/tag-values'
import type {
  CreateTagFromPickerAction,
  CreateTagFromPickerState
} from '../../../lib/execute-create-tag-from-picker'
import { canOfferCreateTag, toggleSelectedTag } from '../../bookmark-tag-picker/lib'
import type { NamedTag } from '../../bookmark-tag-picker/lib'
import type { TagCandidate } from '../../bookmark-tag-picker/types'
import type { BookmarkFormFieldKey } from './types'

const initialCreateState: CreateTagFromPickerState = { status: 'idle' }

type UseBookmarkTagDraftOptions = {
  readonly initialTagIds: readonly number[]
  readonly tagCandidates: readonly TagCandidate[]
  readonly tagsReady: boolean
  readonly createTagAction: CreateTagFromPickerAction
  readonly onClearFieldError: ((field: BookmarkFormFieldKey) => void) | undefined
}

export function useBookmarkTagDraft({
  initialTagIds,
  tagCandidates,
  tagsReady,
  createTagAction,
  onClearFieldError
}: UseBookmarkTagDraftOptions) {
  const inFlightRef = useRef(false)
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<NamedTag[]>(() =>
    initialTagIds.map((id) => ({
      id,
      name: tagCandidates.find((tag) => tag.id === id)?.name ?? ''
    }))
  )

  const applyCreateTagAction = async (
    previous: CreateTagFromPickerState,
    payload: { name: string }
  ): Promise<CreateTagFromPickerState> => {
    try {
      const next = await createTagAction(previous, payload)
      if (next.status === 'created') {
        setSelectedTags((current) =>
          current.some((tag) => tag.id === next.tag.id) ? current : [...current, next.tag]
        )
        setQuery('')
        onClearFieldError?.('tags')
      }
      return next
    } finally {
      inFlightRef.current = false
    }
  }

  const [createState, dispatchCreate, isCreatingTag] = useActionState(
    applyCreateTagAction,
    initialCreateState
  )

  const resolvedSelectedTags = selectedTags.map((tag) => ({
    id: tag.id,
    name:
      tag.name !== ''
        ? tag.name
        : (tagCandidates.find((candidate) => candidate.id === tag.id)?.name ?? '選択中のタグ')
  }))

  const canCreate = canOfferCreateTag({
    query,
    tags: tagCandidates,
    tagsReady
  })
  const createLabel = `「${toTagName(query).display}」を新しいタグとして作成`
  const createError = createState.status === 'error' && !isCreatingTag ? createState.message : null

  function handleToggleTag(tag: NamedTag) {
    setSelectedTags((current) => toggleSelectedTag(current, tag))
    onClearFieldError?.('tags')
  }

  function handleRemoveTag(tag: NamedTag) {
    setSelectedTags((current) => current.filter((item) => item.id !== tag.id))
    onClearFieldError?.('tags')
  }

  function handleOpenChange(next: boolean) {
    setIsOpen(next)
    if (!next) {
      setQuery('')
    }
  }

  function handleCreateTag() {
    if (inFlightRef.current || isCreatingTag || !canCreate) {
      return
    }
    inFlightRef.current = true
    startTransition(() => {
      dispatchCreate({ name: query })
    })
  }

  return {
    selectedTags: resolvedSelectedTags,
    tagIds: resolvedSelectedTags.map((tag) => tag.id),
    query,
    setQuery,
    isOpen,
    handleOpenChange,
    handleToggleTag,
    handleRemoveTag,
    handleCreateTag,
    isCreatingTag,
    createError,
    canCreate,
    createLabel
  }
}
