import type { NamedTag } from './lib'

export type TagCandidate = {
  readonly id: number
  readonly name: string
  readonly pinned: boolean
  readonly sortOrder: number
}

export type BookmarkTagPickerProps = {
  readonly selectedTags: readonly NamedTag[]
  readonly tagCandidates: readonly TagCandidate[]
  readonly tagsReady: boolean
  readonly query: string
  readonly onQueryChange: (query: string) => void
  readonly isOpen: boolean
  readonly onOpenChange: (isOpen: boolean) => void
  readonly onToggleTag: (tag: NamedTag) => void
  readonly onRemoveTag: (tag: NamedTag) => void
  readonly onCreateTag: () => void
  readonly isCreatingTag: boolean
  readonly createError: string | null
  readonly serverError: string | undefined
  readonly canCreate: boolean
  readonly createLabel: string
}
