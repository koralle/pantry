import { Link, useMatchRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { cx } from "styled-system/css";

import { railIcon, railCount, railItem } from "../../../styles";

export const FavoriteLink = ({ count }: { count: number }) => {
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
      <span className={cx(railCount, "pantry-rail-count")}>{count}</span>
    </Link>
  );
};
