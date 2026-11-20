import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useMatchRoute, useSearch } from "@tanstack/react-router";
import { History } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { cx } from "styled-system/css";

import {
  railCount,
  railIcon,
  railItem,
  railLabel,
} from "../../../features/app-shell/styles";
import { orpc } from "../../../rpc/client/query";

interface RecentBookmarkCountProps {
  render: (count: number) => ReactNode;
}

const RecentBookmarkCount = ({
  render,
}: RecentBookmarkCountProps): ReactNode => {
  const { data: count } = useSuspenseQuery(
    orpc.bookmarks.counts.recent.queryOptions({ staleTime: 5000 })
  );

  return render(count);
};

export const RecentBookmarkLink = () => {
  const matchRoute = useMatchRoute();
  const searchParams = useSearch({
    from: "/_protected/bookmarks/",
    shouldThrow: false,
  });

  const checkIsActive = useCallback(() => {
    if (!matchRoute({ to: "/bookmarks" })) {
      return false;
    }

    if (searchParams === undefined) {
      return true;
    }

    if (searchParams.tags !== undefined) {
      return false;
    }

    return (
      !matchRoute({ to: "/bookmarks", search: { view: "inbox" } }) &&
      !matchRoute({ to: "/bookmarks", search: { view: "favorites" } })
    );
  }, [matchRoute, searchParams]);

  const isActive = checkIsActive();

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={railItem({ active: isActive })}
      search={{
        view: "recent",
      }}
      to="/bookmarks"
    >
      <History aria-hidden className={cx(railIcon, "pantry-rail-icon")} />
      <span className={railLabel}>最近保存したもの</span>
      <ErrorBoundary
        fallback={<span className={cx(railCount, "pantry-rail-count")}>0</span>}
      >
        <Suspense>
          <RecentBookmarkCount
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
