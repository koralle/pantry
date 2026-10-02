import { Link, useMatchRoute, useSearch } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useCallback } from "react";
import { cx } from "styled-system/css";

import { railIcon, railCount, railItem } from "../../../styles";

export const HistoryLink = ({ count }: { count: number }) => {
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

  return (
    <Link
      to="/bookmarks"
      search={{
        view: "recent",
      }}
      className={railItem({ active: checkIsActive() })}
    >
      <History className={cx(railIcon, "pantry-rail-icon")} />
      最近保存したもの
      <span className={cx(railCount, "pantry-rail-count")}>{count}</span>
    </Link>
  );
};
