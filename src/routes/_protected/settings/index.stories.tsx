import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, mocked, waitFor, within } from "storybook/test";

import { authClient } from "../../../features/auth/lib/auth-client";
import { isWebAuthnAvailable } from "../../../features/auth/lib/passkey/webauthn-support";
import preview from "../../../storybook/preview";
import { Route } from "./index";

const storyQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const storyUser = {
  id: "user-1",
  name: "koralle",
  email: "koralle@example.com",
};

const SettingsComponent = Route.options.component!;

function SettingsWithQueryClient() {
  return (
    <QueryClientProvider client={storyQueryClient}>
      <SettingsComponent />
    </QueryClientProvider>
  );
}

const meta = preview.meta({
  title: "Pages / アカウント画面",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: Route,
        routeOverrides: {
          "/_protected": {
            beforeLoad: async () => ({
              user: storyUser,
            }),
            loader: async () => ({
              shelfTagsPromise: Promise.resolve([]),
            }),
          },
          "/_protected/settings/": {
            loader: async () => ({
              user: storyUser,
            }),
            component: SettingsWithQueryClient,
          },
        },
      },
    },
  },
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReset();
    mocked(isWebAuthnAvailable).mockReturnValue(true);
    mocked(authClient.passkey.listUserPasskeys).mockReset();
    mocked(authClient.passkey.listUserPasskeys).mockResolvedValue({
      data: [],
      error: null,
    });
    mocked(authClient.signOut).mockReset();
    await storyQueryClient.clear();
  },
});

export const Default = meta.story({
  name: "既定",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "アカウント", level: 1 })
    ).toBeInTheDocument();
    const passkeys = canvas.getByRole("heading", { name: "パスキー" });
    const session = canvas.getByRole("heading", { name: "セッション" });
    expect(
      passkeys.compareDocumentPosition(session) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).not.toBe(0);
    await expect(canvas.getByText("koralle")).toBeInTheDocument();
    await expect(canvas.getByText("koralle@example.com")).toBeInTheDocument();
    await expect(
      await canvas.findByText("パスキーはまだ登録されていません")
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole("button", { name: "追加" })
    ).toBeEnabled();
    await expect(
      canvas.getByRole("button", { name: "ログアウト" })
    ).toBeEnabled();
  },
});

export const Mobile = meta.story({
  name: "モバイル",
  globals: {
    viewport: {
      value: "iphone12",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "アカウント", level: 1 })
    ).toBeInTheDocument();
    // モバイルはタブの外の画面：戻る導線を出し、FAB・タブは出さない
    await expect(
      canvas.getByRole("link", { name: /一覧へ戻る/ })
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole("link", { name: "ブックマークを登録" })
    ).not.toBeInTheDocument();
  },
});

export const WebAuthnUnavailable = meta.story({
  name: "WebAuthn非対応",
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReturnValue(false);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(
        canvas.queryByRole("button", { name: "追加" })
      ).not.toBeInTheDocument();
      expect(
        canvas.queryByRole("button", { name: "パスキーを登録" })
      ).not.toBeInTheDocument();
    });
    await expect(
      canvas.getByRole("button", { name: "ログアウト" })
    ).toBeEnabled();
    await expect(
      canvas.getByText("パスキーはまだ登録されていません")
    ).toBeInTheDocument();
  },
});
