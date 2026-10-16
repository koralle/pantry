import addonDocs from "@storybook/addon-docs";
import { definePreview } from "@storybook/tanstack-react";
import { AWESOME_DEVICE_VIEWPORTS } from "storybook-device-viewports";
import { sb } from "storybook/test";

import "../index.css";

import { resolveBackend } from "./backend/defaults";
import { createRpcHandler } from "./backend/handlers";
import { startWorker, worker } from "./backend/worker";

sb.mock("../features/auth/lib/auth-client.ts");
sb.mock("../features/auth/lib/passkey/webauthn-support.ts");

export default definePreview({
  addons: [addonDocs()],

  async beforeAll() {
    await startWorker();
  },

  // loaders は beforeEach より先に走る。framework の navigation（router.load()）は
  // project の beforeEach にあるので、loader が発行する fetch にもこの時点で
  // 差し替えが間に合う。
  loaders: [
    (context) => {
      worker.resetHandlers(
        createRpcHandler(resolveBackend(context.parameters.backend))
      );
    },
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "padded",
    viewport: {
      options: AWESOME_DEVICE_VIEWPORTS,
    },
  },
});
