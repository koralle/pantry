import { err, ok } from '../../../shared/domain/result'
import type { Result } from '../../../shared/domain/result'
import type { TagId } from '../../tags/domain/tag-values'

export type DuplicateTagIdError = {
  readonly code: 'duplicate-tag-id'
  readonly field: 'tags'
  readonly tagId: TagId
}

/**
 * Bookmark 集約はタグ ID の関連だけを持つ。
 * 重複を許さない集合として扱い、タグの存在・所有者は Application が確認する。
 */
export function assertUniqueTagIds(
  tagIds: readonly TagId[]
): Result<readonly TagId[], DuplicateTagIdError> {
  const seen = new Set<TagId>()
  for (const tagId of tagIds) {
    if (seen.has(tagId)) {
      return err({ code: 'duplicate-tag-id', field: 'tags', tagId })
    }
    seen.add(tagId)
  }
  return ok(tagIds)
}
