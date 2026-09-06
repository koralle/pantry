import type { TanStackDevtoolsReactInit } from "@tanstack/react-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

const tanstackDevtoolsConfig = {
  position: "bottom-right",
} satisfies TanStackDevtoolsReactInit["config"];

const tanstackDevtoolsPlugins = [
  {
    name: "Tanstack Router",
    render: <TanStackRouterDevtoolsPanel />,
  },
] satisfies TanStackDevtoolsReactInit["plugins"];

export const RootDevtools = () => (
  <TanStackDevtools
    config={tanstackDevtoolsConfig}
    plugins={tanstackDevtoolsPlugins}
  />
);
