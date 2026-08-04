import type {
  CreateTag,
  CreateTagError,
  CreateTagResult,
  SelectableTag
} from '../../../../tags/application/create-tag'
import type { TagId } from '../../../../tags/domain/tag-values'
import type { SelectableTagsResult } from '../../../application/load-selectable-tags'

export type { CreateTag, CreateTagError, CreateTagResult, SelectableTag }
export type { SelectableTagsResult }

export type SelectionProps = {
  readonly selectedTagIds: readonly TagId[]
  readonly onSelectedTagIdsChange: (tagIds: readonly TagId[]) => void
}

export type ServerErrorProps = {
  /** BookmarkEditor が保持する更新 server error のうち tags 側だけを受け取る */
  readonly serverError?: string | null | undefined
  readonly onClearServerError?: (() => void) | undefined
}

export type BookmarkTagFieldProps = SelectionProps &
  ServerErrorProps & {
    readonly initialTags: Promise<SelectableTagsResult>
    readonly onCreateTag: CreateTag
  }
