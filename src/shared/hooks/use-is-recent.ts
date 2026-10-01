import { useMatchRoute, useSearch } from "@tanstack/react-router";

export const useIsRecent = () => {
  const matchRoute = useMatchRoute();

  const searchParams = useSearch({
    from: "/_protected/bookmarks/",
    shouldThrow: false,
  });

  if (!matchRoute({ to: "/bookmarks" })) {
    return false;
  }

  if (searchParams === undefined) {
    return true;
  }

  if (searchParams.tags !== undefined) {
    return false;
  }

  if (searchParams.q !== undefined) {
    return false;
  }

  return (
    !matchRoute({ to: "/bookmarks", search: { view: "inbox" } }) &&
    !matchRoute({ to: "/bookmarks", search: { view: "favorites" } })
  );
};
