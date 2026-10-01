import { useMatchRoute } from "@tanstack/react-router";

export const useIsInTagPage = () => {
  const matchRoute = useMatchRoute();

  return !!matchRoute({ to: "/tags" });
};
