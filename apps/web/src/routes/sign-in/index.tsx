import { ClientOnly, createFileRoute, useSearch } from "@tanstack/react-router";
import { BookmarkCheck, Keyboard, Package, Tags } from "lucide-react";
import { css } from "styled-system/css";
import { grid } from "styled-system/patterns";
import * as v from "valibot";

import { PasskeySignIn } from "../../features/auth/components/passkey/sign-in";
import { SignInWithEmailAndPasswordForm } from "../../features/auth/components/sign-in-form";
import { useEmailSignIn } from "../../features/auth/hooks/use-email-sign-in";
import { usePasskeySignIn } from "../../features/auth/hooks/use-passkey-sign-in";
import { isInternalPath } from "../../features/auth/lib/is-internal-path";

const internalRedirectSchema = v.pipe(v.string(), v.check(isInternalPath));

const searchSchema = v.object({
  redirect: v.optional(internalRedirectSchema),
});

export const Route = createFileRoute("/sign-in/")({
  validateSearch: (search) => v.parse(searchSchema, search),
  component: RouteComponent,
});

const wideContainer = "@container sign-in-page-root (min-inline-size: 60rem)";

const brandMark = css({
  alignItems: "center",
  background: "color-mix(in oklab, {colors.pantry.surface} 16%, transparent)",
  borderColor: "color-mix(in oklab, {colors.pantry.surface} 24%, transparent)",
  borderRadius: "sheet",
  borderStyle: "solid",
  borderWidth: "thin",
  display: "flex",
  blockSize: "2.5rem",
  inlineSize: "2.5rem",
  justifyContent: "center",
  [wideContainer]: {
    blockSize: "3.5rem",
    inlineSize: "3.5rem",
  },
});

const brandWordmark = css({
  fontSize: "md2",
  fontWeight: "bold",
  letterSpacing: "wide",
  lineHeight: "tight",
  margin: "0",
  [wideContainer]: {
    fontSize: "2xl",
  },
});

const brandTagline = css({
  color: "color-mix(in oklab, {colors.pantry.surface} 86%, transparent)",
  fontSize: "xs",
  letterSpacing: "wide",
  margin: "0",
  [wideContainer]: {
    fontSize: "sm",
  },
});

const brandFeatures = css({
  display: "none",
  [wideContainer]: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    listStyle: "none",
    margin: "0",
    marginBlockStart: "5",
    padding: "0",
  },
});

const brandFeatureItem = css({
  alignItems: "center",
  color: "color-mix(in oklab, {colors.pantry.surface} 92%, transparent)",
  columnGap: "2.5",
  display: "flex",
  fontSize: "xs",
});

const brandFeatureIcon = css({
  alignItems: "center",
  background: "color-mix(in oklab, {colors.pantry.surface} 14%, transparent)",
  borderRadius: "box",
  blockSize: "7",
  display: "inline-flex",
  flexShrink: "0",
  inlineSize: "7",
  justifyContent: "center",
});

const loginCard = css({
  background: "bg.surface",
  borderColor: "border.default",
  borderRadius: "[1rem]",
  borderStyle: "solid",
  borderWidth: "thin",
  boxShadow: "card",
  display: "flex",
  flexDirection: "column",
  gap: "4",
  inlineSize: "min(100%, 26rem)",
  paddingBlock: "6",
  paddingInline: "5",
  '& button[type="submit"]': {
    inlineSize: "stretch",
  },
  md: {
    paddingBlock: "8",
    paddingInline: "8",
  },
});

const loginHeading = css({
  color: "fg.default",
  fontSize: "lg",
  fontWeight: "bold",
  letterSpacing: "tight",
  margin: "0",
  textAlign: "center",
});

function RouteComponent() {
  const { redirect } = useSearch({ from: "/sign-in/" });
  const { signInWithPasskey } = usePasskeySignIn({ redirect });
  const { signInWithEmailAndPassword } = useEmailSignIn({ redirect });

  return (
    <div
      className={grid({
        gridTemplateRows: "1fr",
        containerName: "sign-in-page-root",
        containerType: "inline-size",
        minBlockSize: "100svb",
      })}
    >
      <div
        className={grid({
          gridTemplateRows: "auto 1fr",
          minBlockSize: "stretch",
          [wideContainer]: {
            gridTemplateColumns: "46% 1fr",
            gridTemplateRows: "1fr",
          },
        })}
      >
        <div
          className={css({
            alignItems: "center",
            background:
              "linear-gradient(160deg, {colors.pantry.brandStart}, {colors.pantry.brandEnd})",
            color: "{colors.pantry.surface}",
            display: "flex",
            flexDirection: "column",
            gap: "2",
            justifyContent: "center",
            minInlineSize: 0,
            paddingBlock: "6",
            paddingInline: "4",
            [wideContainer]: {
              borderRadius: "sheet",
              gap: "3",
              margin: "3",
              padding: "8",
            },
          })}
        >
          <span className={brandMark}>
            <Package aria-hidden size={22} />
          </span>
          <p className={brandWordmark} translate="no">
            Pantry
          </p>
          <p className={brandTagline}>集めて、あとで読む。</p>
          <ul className={brandFeatures}>
            <li className={brandFeatureItem}>
              <span className={brandFeatureIcon}>
                <BookmarkCheck aria-hidden size={15} />
              </span>
              URLを貼るだけでタイトルを自動取得
            </li>
            <li className={brandFeatureItem}>
              <span className={brandFeatureIcon}>
                <Tags aria-hidden size={15} />
              </span>
              タグ棚と未整理トレイですっきり管理
            </li>
            <li className={brandFeatureItem}>
              <span className={brandFeatureIcon}>
                <Keyboard aria-hidden size={15} />
              </span>
              j / k・貼付ショートカットで軽快に操作
            </li>
          </ul>
        </div>

        <section
          className={css({
            display: "grid",
            placeItems: "center",
            minInlineSize: 0,
            paddingBlock: "6",
            paddingInline: "4",
            [wideContainer]: {
              paddingInline: "12",
            },
          })}
        >
          <div className={loginCard}>
            <h1 className={loginHeading}>ログイン</h1>
            <ClientOnly fallback={null}>
              <PasskeySignIn signInAction={signInWithPasskey} />
            </ClientOnly>
            <SignInWithEmailAndPasswordForm
              signInAction={signInWithEmailAndPassword}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
