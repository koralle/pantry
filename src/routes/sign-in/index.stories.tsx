import { expect, mocked, userEvent, waitFor, within } from "storybook/test";

import { authClient } from "../../features/auth/lib/auth-client";
import { isWebAuthnAvailable } from "../../features/auth/lib/passkey/webauthn-support";
import preview from "../../storybook/preview";
import { Route } from "./index";

const successSignInResult = {
  data: {
    redirect: false,
    token: "test-token",
    url: undefined,
    user: {
      id: "user-1",
      email: "user@example.com",
      name: "User",
      image: null,
      emailVerified: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
  },
  error: null,
} as const;

const cancelledPasskeyResult = {
  data: null,
  error: {
    code: "AUTH_CANCELLED",
    message: "Passkey authentication was cancelled",
    status: 400,
    statusText: "Bad Request",
  },
} as const;

const failedPasskeyResult = {
  data: null,
  error: {
    code: "AUTHENTICATION_FAILED",
    message: "Authentication failed",
    status: 400,
    statusText: "Bad Request",
  },
} as const;

const meta = preview.meta({
  title: "Pages / サインイン画面",
  parameters: {
    layout: "fullscreen",
    tanstack: {
      router: {
        route: Route,
      },
    },
  },
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockReset();
    mocked(authClient.signIn.email).mockResolvedValue(successSignInResult);
    mocked(authClient.signIn.passkey).mockReset();
    mocked(authClient.signIn.passkey).mockResolvedValue(cancelledPasskeyResult);
    mocked(isWebAuthnAvailable).mockReset();
    mocked(isWebAuthnAvailable).mockReturnValue(true);
  },
});

export const Default = meta.story({
  name: "既定",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("見出しが1つだけ表示されること", async () => {
      const heading = await canvas.findByRole("heading", {
        name: "ログイン",
        level: 1,
      });
      await expect(heading).toBeInTheDocument();

      const headings = await canvas.findAllByRole("heading", {
        level: 1,
        hidden: true,
      });
      await expect(headings).toHaveLength(1);
    });

    await step(
      "パスキーボタンがパスワードフォームより前に表示されること",
      async () => {
        const passkeyButton = await canvas.findByRole("button", {
          name: "パスキーでログイン",
        });
        const email = await canvas.findByLabelText("メール");

        expect(
          passkeyButton.compareDocumentPosition(email) &
            Node.DOCUMENT_POSITION_FOLLOWING
        ).not.toBe(0);

        const divider = await canvas.findByText("または");
        await expect(divider).toBeInTheDocument();
      }
    );

    await step(
      "メールとパスワードの入力フィールドが表示されること",
      async () => {
        const emailField = await canvas.findByLabelText("メール");
        await expect(emailField).toBeEnabled();

        const passwordField = await canvas.findByLabelText("パスワード");
        await expect(passwordField).toBeEnabled();
      }
    );

    await step("「サインイン」ボタンが表示されること", async () => {
      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await expect(signInButton).toBeEnabled();
    });
  },
});

export const Mobile = meta.story({
  name: "モバイル",
  globals: {
    viewport: {
      value: "iphone16",
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("見出しとブランドが表示されること", async () => {
      const heading = await canvas.findByRole("heading", {
        name: "ログイン",
        level: 1,
      });
      await expect(heading).toBeInTheDocument();

      const brand = await canvas.findByText("Pantry");
      await expect(brand).toBeVisible();
    });

    await step("パスキーボタンとメール入力が有効であること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await expect(passkeySignInButton).toBeEnabled();

      const emailField = await canvas.findByLabelText("メール");
      await expect(emailField).toBeEnabled();
    });
  },
});

export const InvalidCredentials = meta.story({
  name: "認証情報エラー",
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
        status: 401,
        statusText: "Unauthorized",
      },
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("誤った認証情報で送信すること", async () => {
      const emailField = await canvas.findByRole("textbox", { name: "メール" });
      await userEvent.type(emailField, "user@example.com");

      const passwordField = await canvas.findByLabelText("パスワード");
      await userEvent.type(passwordField, "wrong-password");

      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await userEvent.click(signInButton);
    });

    await step("エラーサマリが表示されること", async () => {
      const alert = await canvas.findByRole("alert");
      await expect(alert).toHaveTextContent(
        "メールまたはパスワードが正しくありません"
      );
    });

    await step(
      "メールとパスワードの入力フィールドにエラーが表示されること",
      async () => {
        const errorMessage = await canvas.findAllByText(
          "メールまたはパスワードを確認してください"
        );
        await expect(errorMessage).toHaveLength(2);
      }
    );
  },
});

export const Pending = meta.story({
  name: "サインイン中",
  beforeEach: async () => {
    mocked(authClient.signIn.email).mockImplementation(
      async () => await new Promise<never>(() => {})
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("送信中はサインインボタンが無効化されること", async () => {
      const emailField = await canvas.findByRole("textbox", {
        name: "メール",
      });
      await userEvent.type(emailField, "user@example.com");

      const passwordField = await canvas.findByLabelText("パスワード");
      await userEvent.type(passwordField, "password123");

      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await userEvent.click(signInButton);

      const loading = await canvas.findByRole("button", {
        name: "サインイン中...",
      });
      await expect(loading).toBeDisabled();
    });

    await step("送信中はフォーム全体が無効化されること", async () => {
      const formGroup = await canvas.findByRole("group", {
        name: "サインイン",
      });
      await expect(formGroup).toBeDisabled();
    });
  },
});

export const WebAuthnUnavailable = meta.story({
  name: "WebAuthn非対応",
  beforeEach: async () => {
    mocked(isWebAuthnAvailable).mockReturnValue(false);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step(
      "メールアドレスの入力フィールドが表示されていること",
      async () => {
        const emailField = await canvas.findByRole("textbox", {
          name: "メール",
        });
        await expect(emailField).toBeEnabled();
      }
    );

    await step("パスワードの入力フィールドが表示されていること", async () => {
      const passwordField = await canvas.findByLabelText("パスワード");
      await expect(passwordField).toBeEnabled();
    });

    await step("「サインイン」ボタンが表示されていること", async () => {
      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await expect(signInButton).toBeEnabled();
    });

    await step("WebAuthnの対応判定が行われたこと", async () => {
      await waitFor(() => {
        expect(mocked(isWebAuthnAvailable)).toHaveBeenCalled();
      });
    });

    await step(
      "パスキーでサインインするためのUIが表示されていないこと",
      async () => {
        const passkeySignInButton = canvas.queryByRole("button", {
          name: "パスキーでログイン",
        });
        await expect(passkeySignInButton).not.toBeInTheDocument();
      }
    );
  },
});

export const PasskeyCancelled = meta.story({
  name: "パスキーキャンセル",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("パスキー認証を開始すること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await userEvent.click(passkeySignInButton);
    });

    await step("エラーが表示されずボタンが戻ること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await expect(passkeySignInButton).toBeEnabled();

      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    });

    await step("メールとパスワードで引き続き操作できること", async () => {
      const emailField = await canvas.findByLabelText("メール");
      await expect(emailField).toBeEnabled();

      const passwordField = await canvas.findByLabelText("パスワード");
      await expect(passwordField).toBeEnabled();

      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await expect(signInButton).toBeEnabled();
    });
  },
});

export const PasskeyFailed = meta.story({
  name: "パスキー失敗",
  beforeEach: async () => {
    mocked(authClient.signIn.passkey).mockResolvedValue(failedPasskeyResult);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("パスキー認証を開始すること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await userEvent.click(passkeySignInButton);
    });

    await step("エラーメッセージが表示されること", async () => {
      const alert = await canvas.findByRole("alert");
      await expect(alert).toHaveTextContent(
        "パスキー認証に失敗しました。もう一度試すか、メールとパスワードでログインしてください"
      );
    });

    await step("パスキーとメール／パスワードの両方が使えること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await expect(passkeySignInButton).toBeEnabled();

      const emailField = await canvas.findByLabelText("メール");
      await expect(emailField).toBeEnabled();

      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await expect(signInButton).toBeEnabled();
    });
  },
});

export const PasskeyDoesNotBlockPassword = meta.story({
  name: "パスキー認証でもパスワード入力を維持",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("パスキー認証が呼ばれていないこと", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await expect(passkeySignInButton).toBeEnabled();

      const emailField = await canvas.findByLabelText("メール");
      await expect(emailField).toBeEnabled();

      const passwordField = await canvas.findByLabelText("パスワード");
      await expect(passwordField).toBeEnabled();

      expect(mocked(authClient.signIn.passkey)).not.toHaveBeenCalled();
    });

    await step("メール入力後にパスキー認証を開始できること", async () => {
      const emailField = await canvas.findByLabelText("メール");
      await userEvent.type(emailField, "user@example.com");

      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await userEvent.click(passkeySignInButton);

      expect(mocked(authClient.signIn.passkey)).toHaveBeenCalledTimes(1);
    });

    await step("認証後も入力内容が保持されること", async () => {
      const passkeySignInButton = await canvas.findByRole("button", {
        name: "パスキーでログイン",
      });
      await expect(passkeySignInButton).toBeEnabled();

      const emailField = await canvas.findByLabelText("メール");
      await expect(emailField).toHaveValue("user@example.com");

      const signInButton = await canvas.findByRole("button", {
        name: "サインイン",
      });
      await expect(signInButton).toBeEnabled();
    });
  },
});
