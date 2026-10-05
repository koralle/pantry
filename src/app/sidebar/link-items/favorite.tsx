import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cx } from "styled-system/css";

import {
  railItem,
  railIcon,
  railCount,
} from "../../../features/app-shell/styles";
import { orpc } from "../../../rpc/query";

interface FavoritesBookmarkCountProps {
  render: (count: number) => ReactNode;
}

const FavoriteBookmarkCount = ({
  render,
}: FavoritesBookmarkCountProps): ReactNode => {
  const { data: count } = useSuspenseQuery(
    orpc.bookmarks.counts.favorites.queryOptions({ staleTime: 5000 })
  );

  return render(count);
};

export const FavoriteBookmarkLink = () => {
  const matchRoute = useMatchRoute();
  const isActive = !!matchRoute({
    to: "/bookmarks",
    search: { view: "favorites" },
  });

  return (
    <Link
      to="/bookmarks"
      search={{ view: "favorites" }}
      className={railItem({ active: isActive })}
    >
      <Star className={cx(railIcon, "pantry-rail-icon")} />
      お気に入り
      <ErrorBoundary
        fallback={<span className={cx(railCount, "pantry-rail-count")}>0</span>}
      >
        <Suspense>
          <FavoriteBookmarkCount
            render={(count) => (
              <span className={cx(railCount, "pantry-rail-count")}>
                {count}
              </span>
            )}
          />
        </Suspense>
      </ErrorBoundary>
    </Link>
  );
};
