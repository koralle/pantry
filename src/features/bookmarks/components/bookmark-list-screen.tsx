import { Link, useRouter } from "@tanstack/react-router";
import { RotateCw, WifiOff } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { FallbackProps } from "react-error-boundary";

import { PantryMotion } from "../../../shared/components/pantry-motion";
import { StateView } from "../../../shared/components/state-view";
import { button } from "../../../styles/button";
import { listColumn } from "../../../styles/list";
import type { BookmarkSearchSchema } from "../../navigation/lib/bookmark-search";
import { defaultBookmarkSearch } from "../../navigation/lib/bookmark-search";
import { detailSearchFromList } from "../../navigation/lib/bookmark-search-builders";
import { useTouchTagLastUsedOnce } from "../../tags/hooks/use-touch-tag-last-used";
import type { ShelfTag } from "../../tags/lib/tag-shelf";
import { bookmarkListSearchIdentity } from "../lib/list/bookmark-list-scroll-session";
import { BookmarkListContent } from "./bookmark-list";
import {
  BookmarkListResults,
  bookmarkListTitle,
} from "./bookmark-list-results";

const ListError = ({ resetErrorBoundary }: FallbackProps) => (
  <div role="alert">
    <StateView
      action={
        <>
          <button
            className={button({ size: "sm", visual: "accent" })}
            onClick={resetErrorBoundary}
            type="button"
          >
            <RotateCw aria-hidden size={13} />
            再試行
          </button>
          <Link
            className={button({ size: "sm" })}
            search={defaultBookmarkSearch}
            to="/bookmarks"
          >
            一覧へ戻る
          </Link>
        </>
      }
      description="ネットワーク接続を確認して、もう一度お試しください。"
      icon={WifiOff}
      title="読み込みに失敗しました"
      tone="danger"
    />
  </div>
);

interface BookmarkListProps {
  readonly search: BookmarkSearchSchema;
  readonly shelfTagsPromise: Promise<ShelfTag[]>;
}

export const BookmarkList = ({
  search,
  shelfTagsPromise,
}: BookmarkListProps) => {
  useTouchTagLastUsedOnce(search, shelfTagsPromise);
  const router = useRouter();
  const title = bookmarkListTitle(search);
  const newSearch = detailSearchFromList(search);
  const listKey = bookmarkListSearchIdentity(search);

  return (
    <section className={listColumn}>
      <ErrorBoundary
        FallbackComponent={ListError}
        onReset={() => {
          void router.invalidate();
        }}
      >
        <Suspense
          fallback={
            <BookmarkListContent
              listSearch={search}
              newSearch={newSearch}
              state="loading"
              title={title}
            />
          }
        >
          <PantryMotion className={listColumn} key={listKey} kind="crossfade">
            <BookmarkListResults search={search} />
          </PantryMotion>
        </Suspense>
      </ErrorBoundary>
    </section>
  );
};
