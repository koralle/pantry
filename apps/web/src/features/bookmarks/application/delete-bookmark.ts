import type { UserId } from "../../auth/domain/auth-values";

export interface SoftDeleteBookmarkInput {
  readonly userId: UserId;
  readonly id: string;
}

export type SoftDeleteBookmarkOutput =
  | { readonly kind: "deleted"; readonly id: string }
  | { readonly kind: "bookmark-not-found" };

/**
 * Application が要求する最小限の能力。削除済み行は対象外で、
 * actor の所有する未削除行だけを soft delete できればよい。
 */
export type SoftDeleteBookmark = (
  input: SoftDeleteBookmarkInput
) => Promise<SoftDeleteBookmarkOutput>;

export const executeDeleteBookmark = async (deps: {
  readonly softDeleteBookmark: SoftDeleteBookmark;
  readonly userId: UserId;
  readonly command: { readonly id: string };
}): Promise<SoftDeleteBookmarkOutput> =>
  await deps.softDeleteBookmark({
    id: deps.command.id,
    userId: deps.userId,
  });
