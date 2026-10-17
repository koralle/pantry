import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { usePasskeySignIn } from "./use-passkey-sign-in";

const mocks = vi.hoisted(() => ({ passkey: vi.fn() }));

vi.mock("../lib/auth-client", () => ({
  authClient: { signIn: { passkey: mocks.passkey } },
}));

const Probe = ({
  redirect,
  onReady,
}: {
  readonly redirect: string | undefined;
  readonly onReady: (hook: ReturnType<typeof usePasskeySignIn>) => void;
}) => {
  onReady(usePasskeySignIn({ redirect }));
  return null;
};

// Render with real Router context without introducing a DOM test environment.
const mountHook = (redirect?: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routeTree: createRootRoute(),
  });
  const navigate = vi.spyOn(router, "navigate").mockResolvedValue();
  let hook: ReturnType<typeof usePasskeySignIn> | undefined;

  renderToString(
    <RouterContextProvider router={router}>
      <Probe
        redirect={redirect}
        onReady={(value) => {
          hook = value;
        }}
      />
    </RouterContextProvider>
  );
  if (hook === undefined) {
    throw new Error("Hook did not render");
  }
  return { ...hook, navigate };
};

describe(usePasskeySignIn, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test.each([undefined, "/settings"])(
    "successful authentication navigates to %s or the default",
    async (redirect) => {
      mocks.passkey.mockResolvedValue({ data: {}, error: null });
      const { signInWithPasskey, navigate } = mountHook(redirect);

      await expect(signInWithPasskey()).resolves.toEqual({
        ok: true,
        value: undefined,
      });
      expect(mocks.passkey).toHaveBeenCalledWith();
      expect(navigate).toHaveBeenCalledWith({ to: redirect ?? "/bookmarks" });
    }
  );

  test.each(["AUTH_CANCELLED", "AUTHENTICATION_FAILED"])(
    "%s returns the error without navigating",
    async (code) => {
      const error = {
        code,
        message: code,
        status: 400,
        statusText: "Bad Request",
      };
      mocks.passkey.mockResolvedValue({ data: null, error });
      const { signInWithPasskey, navigate } = mountHook();

      await expect(signInWithPasskey()).resolves.toEqual({ ok: false, error });
      expect(navigate).not.toHaveBeenCalled();
    }
  );

  test("unexpected authentication errors return a generic failure", async () => {
    mocks.passkey.mockRejectedValue(new Error("Network"));
    const { signInWithPasskey, navigate } = mountHook();

    await expect(signInWithPasskey()).resolves.toEqual({
      ok: false,
      error: {},
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  test("navigation errors return a generic failure", async () => {
    mocks.passkey.mockResolvedValue({ data: {}, error: null });
    const { signInWithPasskey, navigate } = mountHook();
    navigate.mockRejectedValue(new Error("Navigation"));

    await expect(signInWithPasskey()).resolves.toEqual({
      ok: false,
      error: {},
    });
  });
});
