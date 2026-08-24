import type { UserId } from '../../auth/domain/auth-values'

export type SoftDeleteBookmarkInput = {
  readonly userId: UserId
  readonly id: string
}

export type SoftDeleteBookmarkOutput =
  | { readonly kind: 'deleted'; readonly id: string }
  | { readonly kind: 'bookmark-not-found' }

/**
 * Application が要求する最小限の能力。削除済み行は対象外で、
 * actor の所有する未削除行だけを soft delete できればよい。
 */
export type SoftDeleteBookmark = (
  input: SoftDeleteBookmarkInput
) => Promise<SoftDeleteBookmarkOutput>

export async function executeDeleteBookmark(deps: {
  readonly softDeleteBookmark: SoftDeleteBookmark
  readonly userId: UserId
  readonly command: { readonly id: string }
}): Promise<SoftDeleteBookmarkOutput> {
  return deps.softDeleteBookmark({ userId: deps.userId, id: deps.command.id })
}
