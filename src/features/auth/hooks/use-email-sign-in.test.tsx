import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { parse } from "valibot";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { authClient } from "../lib/auth-client";
import { SignInError } from "../lib/sign-in-error";
import { signInSchema } from "../lib/sign-in-schema";
import { useEmailSignIn } from "./use-email-sign-in";

type EmailSignInResponse = Awaited<ReturnType<typeof authClient.signIn.email>>;

const mocks = vi.hoisted(() => ({
  email: vi.fn<typeof authClient.signIn.email>(),
}));

vi.mock("../lib/auth-client", () => ({
  authClient: { signIn: { email: mocks.email } },
}));

const credentials = parse(signInSchema, {
  email: "user@example.com",
  password: "password123",
});

const successResponse = {
  data: {
    redirect: false,
    token: "test-token",
    url: undefined,
    user: {
      id: "user-1",
      email: credentials.email,
      name: "User",
      image: null,
      emailVerified: true,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
  },
  error: null,
} satisfies EmailSignInResponse;

// SAFETY: Better Auth のレスポンス型は成功時に error: null を要求するが、
// 実行時にキーが欠けて undefined になる経路もガードできているか検証したい。
const responseWithoutError = {
  data: successResponse.data,
  error: undefined,
} as unknown as EmailSignInResponse;

const genericFailure = {
  code: "SIGN_IN_FAILED",
  status: 500,
  statusText: "Internal Server Error",
};

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

/**
 * Router の context だけを提供し、DOM を用意せずに hook を描画する。
 * renderToString による SSR 描画のため useEffect は実行されない。
 * この hook に effect を足すと、このハーネスでは検証できなくなる点に注意する。
 */
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
  expect.assert(hook !== undefined, "hook が描画されませんでした");
  return { ...hook, navigate };
};

describe(useEmailSignIn, () => {
  beforeEach(() => {
    mocks.email.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    { destination: "/bookmarks", name: "既定の遷移先", redirect: undefined },
    {
      destination: "/settings",
      name: "指定された遷移先",
      redirect: "/settings",
    },
  ])("認証に成功したら$nameへ遷移する", async ({ redirect, destination }) => {
    mocks.email.mockResolvedValue(successResponse);
    const { signInWithEmailAndPassword, navigate } = mountHook(redirect);

    await expect(
      signInWithEmailAndPassword(credentials)
    ).resolves.toStrictEqual({ ok: true, value: undefined });
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(credentials);
    expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: destination });
  });

  test("errorがundefinedの成功レスポンスでも認証成功として扱う", async () => {
    mocks.email.mockResolvedValue(responseWithoutError);
    const { signInWithEmailAndPassword, navigate } = mountHook();

    await expect(
      signInWithEmailAndPassword(credentials)
    ).resolves.toStrictEqual({ ok: true, value: undefined });
    expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: "/bookmarks" });
  });

  test("認証情報が不正ならSignInErrorを返して遷移しない", async () => {
    const error = {
      code: "INVALID_EMAIL_OR_PASSWORD",
      status: 401,
      statusText: "Unauthorized",
    };
    mocks.email.mockResolvedValue({ data: null, error });
    const { signInWithEmailAndPassword, navigate } = mountHook();

    const result = await signInWithEmailAndPassword(credentials);
    expect.assert(!result.ok);
    expect(result.error).toBeInstanceOf(SignInError);
    expect(result.error).toMatchObject(error);
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(credentials);
    expect(navigate).not.toHaveBeenCalled();
  });

  test.each([
    { name: "認証が例外を投げたとき", navigates: false },
    { name: "遷移が例外を投げたとき", navigates: true },
  ])("$nameは汎用のSignInErrorを返す", async ({ navigates }) => {
    const { signInWithEmailAndPassword, navigate } = mountHook();
    if (navigates) {
      mocks.email.mockResolvedValue(successResponse);
      navigate.mockRejectedValue(new Error("Navigation"));
    } else {
      mocks.email.mockRejectedValue(new Error("Network"));
    }

    const result = await signInWithEmailAndPassword(credentials);
    expect.assert(!result.ok);
    expect(result.error).toBeInstanceOf(SignInError);
    expect(result.error).toMatchObject(genericFailure);
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(credentials);
    if (navigates) {
      expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: "/bookmarks" });
    } else {
      expect(navigate).not.toHaveBeenCalled();
    }
  });

  test("認証が完了するまでは遷移しない", async () => {
    const authentication = Promise.withResolvers<EmailSignInResponse>();
    mocks.email.mockReturnValue(authentication.promise);
    const { signInWithEmailAndPassword, navigate } = mountHook();

    const result = signInWithEmailAndPassword(credentials);
    expect(mocks.email).toHaveBeenCalledExactlyOnceWith(credentials);
    expect(navigate).not.toHaveBeenCalled();

    authentication.resolve(successResponse);
    await expect(result).resolves.toStrictEqual({
      ok: true,
      value: undefined,
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith({ to: "/bookmarks" });
  });
});
