import { useMatchRoute } from "@tanstack/react-router";

export const useIsInbox = () => {
  const matchRoute = useMatchRoute();

  return !!matchRoute({ to: "/bookmarks", search: { view: "inbox" } });
};
