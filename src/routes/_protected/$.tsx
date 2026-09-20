import { createFileRoute } from "@tanstack/react-router";

import { NotFoundScreen } from "../../features/not-found/not-found-screen";

export const Route = createFileRoute("/_protected/$")({
  component: NotFoundScreen,
});
