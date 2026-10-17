import type { SessionUser } from "../../features/auth/domain/auth-values";
import {
  executeFetchPageTitle,
  fetchPageTitleInputSchema,
} from "../../features/bookmarks/application/fetch-page-title";
import type { FetchPageTitle } from "../../features/bookmarks/application/fetch-page-title";
import { createBookmarkProcedures } from "./bookmark-procedures";
import type { BookmarksDeps } from "./bookmark-procedures";
import { createProcedureKit } from "./procedure-kit";
import type { GetSession } from "./procedure-kit";
import { createTagProcedures } from "./tag-procedures";
import type { TagsDeps } from "./tag-procedures";

/**
 * 本番の Better Auth / Drizzle をここに閉じ込めるための差し込み口。
 * RPC テストは session と各 service を差し替え、Turso を立てずに契約だけを叩く。
 *
 * 機能ごとの service は `tag-procedures.ts` / `bookmark-procedures.ts` が持つ。
 * pantry-api へ移した機能は、そのファイルの procedure と service を空にする
 * （このファイルと他の機能のファイルは変えない）。
 */
export interface AppRouterDeps extends TagsDeps, BookmarksDeps {
  readonly getSession: GetSession;
  readonly fetchPageTitle: FetchPageTitle;
}

export const createAppRouter = (deps: AppRouterDeps) => {
  const kit = createProcedureKit(deps.getSession);
  const { base, requireAuth } = kit;

  const auth = {
    /**
     * 未認証も 200 null で返す public procedure。redirect 判定は route 側で行う。
     */
    session: base.handler(async ({ context }) => {
      const user: SessionUser | null = await deps.getSession(context.headers);
      if (user === null || user === undefined) {
        return null;
      }
      return { user };
    }),
  };

  const fetchTitle = base
    .use(requireAuth)
    .input(fetchPageTitleInputSchema)
    .errors({
      "url-not-allowed": {
        status: 400,
      },
    })
    .handler(async ({ input, errors }) => {
      const result = await executeFetchPageTitle({
        fetchPageTitle: deps.fetchPageTitle,
        url: input.url,
      });

      if (!result.ok) {
        throw errors["url-not-allowed"]();
      }

      return result.value;
    });
  return {
    auth,
    bookmarks: {
      ...createBookmarkProcedures(kit, deps),
      title: fetchTitle,
    },
    tags: createTagProcedures(kit, deps),
  };
};

/**
 * 本番 router の実装モジュールは import しない。
 * 型だけ共有し、client bundle に getDB / api client が混ざらないようにする。
 */
export type AppRouter = ReturnType<typeof createAppRouter>;
