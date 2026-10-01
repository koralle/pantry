import { useMatchRoute } from "@tanstack/react-router";

export const useIsFavorites = () => {
  const matchRoute = useMatchRoute();

  return !!matchRoute({ to: "/bookmarks", search: { view: "favorites" } });
};
