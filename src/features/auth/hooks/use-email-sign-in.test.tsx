import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { parse } from "valibot";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { SignInError } from "../lib/sign-in-error";
import { signInSchema } from "../lib/sign-in-schema";
import { useEmailSignIn } from "./use-email-sign-in";

const mocks = vi.hoisted(() => ({ email: vi.fn() }));

vi.mock("../lib/auth-client", () => ({
  authClient: { signIn: { email: mocks.email } },
}));

const credentials = parse(signInSchema, {
  email: "user@example.com",
  password: "password123",
});

const Probe = ({
  redirect,
  onReady,
}: {
  readonly redirect: string | undefined;
  readonly onReady: (hook: ReturnType<typeof useEmailSignIn>) => void;
}) => {
  onReady(useEmailSignIn({ redirect }));
  return null;
};

const mountHook = (redirect?: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routeTree: createRootRoute(),
  });
  const navigate = vi.spyOn(router, "navigate").mockResolvedValue();
  let hook: ReturnType<typeof useEmailSignIn> | undefined;

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

describe(useEmailSignIn, () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test.each([undefined, "/settings"])(
    "successful authentication navigates to %s or the default",
    async (redirect) => {
      mocks.email.mockResolvedValue({ data: {}, error: null });
      const { signInWithEmailAndPassword, navigate } = mountHook(redirect);

      await expect(signInWithEmailAndPassword(credentials)).resolves.toEqual({
        ok: true,
        value: undefined,
      });
      expect(mocks.email).toHaveBeenCalledWith(credentials);
      expect(navigate).toHaveBeenCalledWith({ to: redirect ?? "/bookmarks" });
    }
  );

  test("invalid credentials return SignInError without navigating", async () => {
    const error = {
      code: "INVALID_EMAIL_OR_PASSWORD",
      status: 401,
      statusText: "Unauthorized",
    };
    mocks.email.mockResolvedValue({ data: null, error });
    const { signInWithEmailAndPassword, navigate } = mountHook();

    const result = await signInWithEmailAndPassword(credentials);
    expect(result.ok).toBeFalsy();
    if (result.ok) {
      throw new Error("Expected failure");
    }
    expect(result.error).toBeInstanceOf(SignInError);
    expect(result.error).toMatchObject(error);
    expect(navigate).not.toHaveBeenCalled();
  });

  test("unexpected authentication errors return a generic failure", async () => {
    mocks.email.mockRejectedValue(new Error("Network"));
    const { signInWithEmailAndPassword, navigate } = mountHook();

    await expect(
      signInWithEmailAndPassword(credentials)
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SIGN_IN_FAILED" },
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  test("navigation errors return a generic failure", async () => {
    mocks.email.mockResolvedValue({ data: {}, error: null });
    const { signInWithEmailAndPassword, navigate } = mountHook();
    navigate.mockRejectedValue(new Error("Navigation"));

    await expect(
      signInWithEmailAndPassword(credentials)
    ).resolves.toMatchObject({
      ok: false,
      error: { code: "SIGN_IN_FAILED" },
    });
  });
});
