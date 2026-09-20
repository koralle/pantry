import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";

import { PasskeySettings } from "../../../features/auth/components/passkey/settings";
import { useSignOut } from "../../../features/auth/hooks/use-sign-out";
import { defaultBookmarkSearch } from "../../../features/navigation/lib/bookmark-search";
import { StyledButton } from "../../../shared/components/styled-button";
import { StyledLink } from "../../../shared/components/styled-link";
import {
  accountBackRow,
  accountKv,
  accountKvKey,
  accountKvValue,
  accountPage,
  accountPageInner,
  accountSection,
  accountSectionBody,
  accountSectionHeading,
  accountTitle,
} from "../../../styles/account";

export const Route = createFileRoute("/_protected/settings/")({
  loader: async ({ context }) => ({
    user: context.user,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const { handleSignOut, isPending } = useSignOut();

  return (
    <div className={accountPage}>
      <div className={accountPageInner}>
        <div className={accountBackRow}>
          <StyledLink
            search={defaultBookmarkSearch}
            size="xs"
            to="/bookmarks"
            visual="muted"
          >
            <ArrowLeft aria-hidden size={13} /> 一覧へ戻る
          </StyledLink>
        </div>

        <h1 className={accountTitle}>アカウント</h1>

        <section className={accountSection}>
          <dl>
            <div className={accountKv}>
              <dt className={accountKvKey}>名前</dt>
              <dd className={accountKvValue}>{user.name}</dd>
            </div>
            <div className={accountKv}>
              <dt className={accountKvKey}>メール</dt>
              <dd className={accountKvValue}>{user.email}</dd>
            </div>
          </dl>
        </section>

        <section className={accountSection}>
          <PasskeySettings />
        </section>

        <section className={accountSection}>
          <h2 className={accountSectionHeading}>セッション</h2>
          <div className={accountSectionBody}>
            <StyledButton
              isPending={isPending}
              onPress={handleSignOut}
              visual="danger"
            >
              <LogOut aria-hidden size={14} />{" "}
              {isPending ? "ログアウト中…" : "ログアウト"}
            </StyledButton>
          </div>
        </section>
      </div>
    </div>
  );
}
