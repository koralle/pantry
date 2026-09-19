import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { ToggleButton } from "react-aria-components";

import { orpc } from "../../../rpc/query";
import { starToggle } from "../../../styles/detail";
import { bookmarkDetailQueryOptions } from "../lib/queries/bookmark-detail-query-options";
import { refreshAfterBookmarkMutation } from "../lib/queries/refresh-after-bookmark-mutation";
import type { BookmarkDetail } from "../persistence/get-bookmark-detail";

/**
 * 詳細カード右上のスタートグル。favorite を optimistic に反転し、
 * 失敗時はロールバック、成功時は一覧・件数を invalidate する。
 */
export const BookmarkFavoriteToggle = ({
  id,
  favorite,
}: {
  readonly id: string;
  readonly favorite: boolean;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const detailQueryKey = bookmarkDetailQueryOptions(id).queryKey;

  const mutation = useMutation(
    orpc.bookmarks.setFavorite.mutationOptions({
      onError: (_error, variables) => {
        queryClient.setQueryData(
          detailQueryKey,
          (old: BookmarkDetail | undefined) =>
            old === undefined ? old : { ...old, favorite: !variables.favorite }
        );
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: detailQueryKey });
        queryClient.setQueryData(
          detailQueryKey,
          (old: BookmarkDetail | undefined) =>
            old === undefined ? old : { ...old, favorite: variables.favorite }
        );
      },
      onSuccess: () => {
        refreshAfterBookmarkMutation(
          router,
          queryClient,
          "SetBookmarkFavorite"
        );
      },
    })
  );

  return (
    <ToggleButton
      aria-label={favorite ? "お気に入りを解除" : "お気に入りに追加"}
      className={starToggle({ on: favorite })}
      isDisabled={mutation.isPending}
      isSelected={favorite}
      onChange={(selected) => {
        mutation.mutate({ favorite: selected, id });
      }}
    >
      <Star
        aria-hidden
        fill={favorite ? "currentColor" : "none"}
        size={15}
        strokeWidth={favorite ? 0 : 2}
      />
    </ToggleButton>
  );
};
