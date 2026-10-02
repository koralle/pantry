import { createFileRoute } from "@tanstack/react-router";

import { StandardShell } from "../../features/app-shell/components/standard-shell";
import { NotFoundScreen } from "../../features/not-found/not-found-screen";

export const Route = createFileRoute("/_protected/$")({
  component: () => (
    <StandardShell>
      <NotFoundScreen />
    </StandardShell>
  ),
});
