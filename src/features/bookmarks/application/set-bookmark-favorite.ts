import type { UserId } from "../../auth/domain/auth-values";

export interface SetBookmarkFavoriteInput {
  readonly userId: UserId;
  readonly id: string;
  readonly favorite: boolean;
}

export type SetBookmarkFavoriteOutput =
  | { readonly kind: "updated"; readonly id: string }
  | { readonly kind: "bookmark-not-found" };

/**
 * Application が要求する最小限の能力。削除済み行は対象外で、
 * actor の所有する未削除行だけを favorite 更新できればよい。
 */
export type SetBookmarkFavorite = (
  input: SetBookmarkFavoriteInput
) => Promise<SetBookmarkFavoriteOutput>;

export const executeSetBookmarkFavorite = async (deps: {
  readonly setBookmarkFavorite: SetBookmarkFavorite;
  readonly userId: UserId;
  readonly command: { readonly id: string; readonly favorite: boolean };
}): Promise<SetBookmarkFavoriteOutput> =>
  await deps.setBookmarkFavorite({
    favorite: deps.command.favorite,
    id: deps.command.id,
    userId: deps.userId,
  });
