import { orpc } from "../../../rpc/query";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";

/** 一覧→詳細→一覧で読み込み済みページを捨てない。Mutation 時は明示的に remove する。 */
const BOOKMARK_LIST_STALE_TIME = Number.POSITIVE_INFINITY;
const BOOKMARK_LIST_GC_TIME = 30 * 60 * 1000;

/**
 * 一覧 read の query options 工場。route loader の prefetchInfiniteQuery も、
 * component の useSuspenseInfiniteQuery も、ここから作った同じ options を使う。
 * query key の所有者はこの関数に限定する。
 *
 * RPC へ渡す tagNames / cursor への変換もここで閉じる。
 */
export const bookmarkListQueryOptions = (search: BookmarkSearchSchema) =>
  orpc.bookmarks.list.infiniteOptions({
    gcTime: BOOKMARK_LIST_GC_TIME,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    input: (pageParam: string | undefined) => ({
      sort: search.sort,
      tagMode: search.tagMode,
      ...(search.q === undefined ? {} : { q: search.q }),
      ...(search.tags === undefined ? {} : { tagNames: [...search.tags] }),
      ...(pageParam === undefined ? {} : { cursor: pageParam }),
    }),
    staleTime: BOOKMARK_LIST_STALE_TIME,
  });
