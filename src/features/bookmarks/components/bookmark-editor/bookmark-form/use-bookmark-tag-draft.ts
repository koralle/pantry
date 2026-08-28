import { startTransition, useActionState, useRef, useState } from 'react'

import type {
  CreateTagFromPickerAction,
  CreateTagFromPickerState
} from '../../../lib/execute-create-tag-from-picker'
import { canOfferCreateTag, toggleSelectedTag } from '../../bookmark-tag-picker/lib'
import type { NamedTag, TagCandidate } from '../../bookmark-tag-picker/lib'
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

  const createError = createState.status === 'error' && !isCreatingTag ? createState.message : null

  function handleToggleTag(tag: NamedTag) {
    setSelectedTags((current) => toggleSelectedTag(current, tag))
    onClearFieldError?.('tags')
  }

  function handleRemoveTag(tag: NamedTag) {
    setSelectedTags((current) => current.filter((item) => item.id !== tag.id))
    onClearFieldError?.('tags')
  }

  function handleCreateTag(name: string) {
    if (inFlightRef.current || isCreatingTag) {
      return
    }
    if (!canOfferCreateTag({ query: name, tags: tagCandidates, tagsReady })) {
      return
    }
    inFlightRef.current = true
    startTransition(() => {
      dispatchCreate({ name })
    })
  }

  return {
    selectedTags: resolvedSelectedTags,
    tagIds: resolvedSelectedTags.map((tag) => tag.id),
    handleToggleTag,
    handleRemoveTag,
    handleCreateTag,
    isCreatingTag,
    createError,
    lastCreatedTagId: createState.status === 'created' ? createState.tag.id : null
  }
}
