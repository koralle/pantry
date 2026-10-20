import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { isContractProcedure } from "@orpc/contract";
import type {
  AnyContractProcedure,
  ContractRouterClient,
} from "@orpc/contract";
import type { ApiContract } from "@pantry/api-contract";
import type { SessionUser } from "@pantry/api-contract/schemas/session-user";
import type { AppDb } from "@pantry/db";
import { user as usersTable } from "@pantry/db/schema/auth-schema";
import { beforeEach, expect, test, vi } from "vitest";

import { createApp } from "../app";
import type { Authenticator } from "../auth/session";
import { withTestDb } from "./db/migrated-db";

export const actor: SessionUser = {
  email: "actor@example.com",
  id: "user-actor",
  name: "actor",
};

export const other: SessionUser = {
  email: "other@example.com",
  id: "user-other",
  name: "other",
};

export type ApiTestClient = ContractRouterClient<ApiContract>;

/**
 * db project の globalSetup が起動した libSQL に接続する。
 * 各テストは actor と other だけが入った状態から始める。
 */
export const withMigratedDb = (): { readonly getDb: () => AppDb } => {
  const { getDb } = withTestDb();

  beforeEach(async () => {
    await getDb().insert(usersTable).values([actor, other]);
  });

  return { getDb };
};

const unusedAuthHandler = async (): Promise<Response> =>
  new Response("unused", { status: 500 });

/** api の URL と別にするのは、本番でも Origin を request の URL ではなく設定から決めるため。 */
export const testTrustedOrigin = "http://pantry.test";

const testRpcUrl = "http://api.test/rpc";

export const createTestApp = (
  db: AppDb,
  authenticate: Authenticator
): ReturnType<typeof createApp> =>
  createApp({
    authenticate,
    db: () => db,
    handleAuthRequest: unusedAuthHandler,
    reportError: () => {
      // テストは失敗を client 側の 500 で確かめるので、ログに出さない。
    },
    trustedOrigin: () => testTrustedOrigin,
  });

/**
 * `x-csrf-token` も Origin も付けない JSON の client にするのは、SSR と旧 web の送り方で
 * 全 procedure が通ることを既定で確かめるため。
 */
export const createTestClient = (
  db: AppDb,
  as: SessionUser | null
): ApiTestClient => {
  const app = createTestApp(db, async () => as);

  return createORPCClient<ApiTestClient>(
    new RPCLink({
      fetch: async (request) => await app.fetch(request),
      url: testRpcUrl,
    })
  );
};

/** content-type 無しも含めるのは、RPCHandler がそれを JSON として読むため。 */
export const formLikeContentTypes = [
  "application/x-www-form-urlencoded",
  "multipart/form-data; boundary=pantry",
  "text/plain",
  undefined,
] as const;

type FormLikeContentType = (typeof formLikeContentTypes)[number];

/**
 * same-site を含めるのは、`*.workers.dev` の兄弟 Worker が same-site になるため。
 * `null` を含めるのは、sandbox iframe などからの送信は Origin が `null` になるため。
 * 信頼する Origin の大文字・既定ポート・scheme 違い・末尾 `/` を含めるのは、ブラウザは正規化済みの
 * Origin しか送らず、正規化して通すと別物まで通るため。
 */
export const crossSiteHeaderSets: readonly Readonly<Record<string, string>>[] =
  [
    { origin: "https://evil.example" },
    { "sec-fetch-site": "cross-site" },
    { origin: "https://evil.example", "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    {
      origin: "https://sibling.mkhd7930.workers.dev",
      "sec-fetch-site": "same-site",
    },
    { origin: "null" },
    { origin: "null", "sec-fetch-site": "cross-site" },
    { origin: testTrustedOrigin.toUpperCase() },
    { origin: `${testTrustedOrigin}:80` },
    { origin: `${testTrustedOrigin}:443` },
    { origin: testTrustedOrigin.replace("http:", "https:") },
    { origin: `${testTrustedOrigin}/` },
  ];

/** Sec-Fetch-Site を送らない古いブラウザでも、Pantry 自身の画面からの送信は通すため Origin 単独も含める。 */
export const sameOriginHeaderSets: readonly Readonly<Record<string, string>>[] =
  [
    { "sec-fetch-site": "same-origin" },
    { origin: testTrustedOrigin },
    { origin: testTrustedOrigin, "sec-fetch-site": "same-origin" },
  ];

const nonPostMethods = [
  "GET",
  "HEAD",
  "OPTIONS",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

/** body を bytes で渡すのは、文字列だと `fetch` が text/plain を自動で付けてしまうため。 */
export const rawRpcRequest = ({
  body,
  contentType,
  headers = {},
  path,
}: {
  readonly body: unknown;
  readonly contentType: FormLikeContentType;
  readonly headers?: Readonly<Record<string, string>>;
  readonly path: string;
}): Request => {
  const request = new Request(`${testRpcUrl}/${path}`, {
    body: new TextEncoder().encode(JSON.stringify({ json: body })),
    headers: {
      ...headers,
      ...(contentType === undefined ? {} : { "content-type": contentType }),
    },
    method: "POST",
  });
  expect(request.headers.get("content-type")).toBe(contentType ?? null);
  return request;
};

export type ProcedurePath<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends AnyContractProcedure
    ? `${Prefix}${K}`
    : ProcedurePath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

const collectProcedurePaths = (router: object, prefix: string): string[] =>
  Object.entries(router).flatMap(([key, value]: [string, unknown]) =>
    isContractProcedure(value)
      ? [`${prefix}${key}`]
      : collectProcedurePaths(value as object, `${prefix}${key}.`)
  );

/** 手で並べた一覧だと、新しい procedure が 401 / CSRF の検査から漏れるため契約から取る。 */
export const contractProcedureNames = <T extends object>(
  router: T
): ProcedurePath<T>[] =>
  collectProcedurePaths(router, "").toSorted() as ProcedurePath<T>[];

/** 機能ごとに書くと、どれかの機能で 401 / CSRF の検査が抜けても気付けないため共通にする。 */
export const itRequiresAuthAndCsrf = <Name extends string>({
  callEveryProcedure,
  getDb,
  namespace,
  procedureNames,
}: {
  readonly callEveryProcedure: (
    client: ApiTestClient
  ) => Record<Name, () => Promise<unknown>>;
  readonly getDb: () => AppDb;
  readonly namespace: string;
  readonly procedureNames: readonly Name[];
}): void => {
  test("401 / CSRF の検査は契約の全 procedure を過不足なく呼ぶ", () => {
    expect(
      Object.keys(
        callEveryProcedure(createTestClient(getDb(), null))
      ).toSorted()
    ).toStrictEqual(procedureNames);
  });

  test.each(procedureNames)(
    `未認証の ${namespace}.%s は defined な UNAUTHORIZED（401）を返す`,
    async (name) => {
      const call = callEveryProcedure(createTestClient(getDb(), null))[name];
      await expect(call()).rejects.toMatchObject({
        code: "UNAUTHORIZED",
        defined: true,
        status: 401,
      });
    }
  );

  test.each(procedureNames)(
    `x-csrf-token を付けない（SSR / 旧 web の）${namespace}.%s は CSRF で 403 にならない`,
    async (name) => {
      const call = callEveryProcedure(createTestClient(getDb(), actor))[name];
      const outcome: unknown = await call().catch((error: unknown) => error);
      expect(outcome).not.toMatchObject({ status: 403 });
    }
  );

  test.each(
    procedureNames.flatMap((name) =>
      formLikeContentTypes.map((contentType) => ({
        contentType: contentType ?? "（なし）",
        name,
        request: (headers: Readonly<Record<string, string>>) =>
          rawRpcRequest({
            body: {},
            contentType,
            headers,
            path: `${namespace}/${name.replaceAll(".", "/")}`,
          }),
      }))
    )
  )(
    `別サイトから content-type $contentType で送られた ${namespace}.$name は認証済みでも procedure に届かず 403`,
    async ({ request }) => {
      const authenticate = vi.fn<Authenticator>(async () => actor);
      const app = createTestApp(getDb(), authenticate);

      for (const headers of crossSiteHeaderSets) {
        const response = await app.fetch(request(headers));
        expect(response.status, JSON.stringify(headers)).toBe(403);
      }
      expect(authenticate).not.toHaveBeenCalled();
    }
  );

  test.each(procedureNames)(
    `Pantry と同じ Origin から content-type 無しで送られた ${namespace}.%s は CSRF で拒まず procedure に届く`,
    async (name) => {
      for (const headers of sameOriginHeaderSets) {
        const authenticate = vi.fn<Authenticator>(async () => actor);
        const app = createTestApp(getDb(), authenticate);
        const statuses: number[] = [];
        const client = createORPCClient<ApiTestClient>(
          new RPCLink({
            fetch: async (request) => {
              const rewritten = new Headers(request.headers);
              rewritten.delete("content-type");
              for (const [key, value] of Object.entries(headers)) {
                rewritten.set(key, value);
              }
              const response = await app.fetch(
                new Request(request.url, {
                  body: await request.arrayBuffer(),
                  headers: rewritten,
                  method: request.method,
                })
              );
              statuses.push(response.status);
              return response;
            },
            url: testRpcUrl,
          })
        );

        const call = callEveryProcedure(client)[name];
        await call().catch(() => {
          // 404 などの業務エラーは構わず、CSRF の 403 かどうかだけを見る。
        });
        expect(statuses, JSON.stringify(headers)).not.toContain(403);
        expect(authenticate, JSON.stringify(headers)).toHaveBeenCalled();
      }
    }
  );

  test.each(
    procedureNames.flatMap((name) =>
      nonPostMethods.map((method) => ({ method, name }))
    )
  )(
    `$method の ${namespace}.$name は procedure に届かず 405（Allow: POST）`,
    async ({ method, name }) => {
      const authenticate = vi.fn<Authenticator>(async () => actor);
      const app = createTestApp(getDb(), authenticate);
      const response = await app.fetch(
        new Request(`${testRpcUrl}/${namespace}/${name.replaceAll(".", "/")}`, {
          method,
        })
      );
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
      expect(authenticate).not.toHaveBeenCalled();
    }
  );
};
