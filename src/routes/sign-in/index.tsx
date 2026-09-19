import { createFileRoute, useRouter, useSearch } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { css } from "styled-system/css";
import { grid } from "styled-system/patterns";
import * as v from "valibot";

import { PasskeySignIn } from "../../features/auth/components/passkey/sign-in";
import { SignInWithEmailAndPasswordForm } from "../../features/auth/components/sign-in-form";
import { authClient } from "../../features/auth/lib/auth-client";
import { isInternalPath } from "../../features/auth/lib/is-internal-path";
import { SignInError } from "../../features/auth/lib/sign-in-error";
import type { SignInSchema } from "../../features/auth/lib/sign-in-schema";

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
  background: "color-mix(in oklab, {colors.pantry.surface} 14%, transparent)",
  borderRadius: "sheet",
  display: "flex",
  blockSize: "2.5rem",
  inlineSize: "2.5rem",
  justifyContent: "center",
  [wideContainer]: {
    blockSize: "3.375rem",
    inlineSize: "3.375rem",
  },
});

const brandWordmark = css({
  fontSize: "md2",
  fontWeight: "bold",
  letterSpacing: "wide",
  lineHeight: "tight",
  margin: "0",
  [wideContainer]: {
    fontSize: "lg",
  },
});

const brandTagline = css({
  display: "none",
  [wideContainer]: {
    color:
      "color-mix(in oklab, {colors.pantry.surface} 78%, {colors.pantry.accent})",
    display: "block",
    fontSize: "xs",
    letterSpacing: "wide",
    margin: "0",
  },
});

function RouteComponent() {
  const { redirect } = useSearch({ from: "/sign-in/" });
  const router = useRouter();

  async function onSignIn({ email, password }: SignInSchema) {
    const { error } = await authClient.signIn.email({ email, password });

    if (error === null) {
      await router.navigate({ to: redirect ?? "/bookmarks" });
      return null;
    }

    return new SignInError({
      code: error.code,
      status: error.status,
      statusText: error.statusText,
    });
  }

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
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr",
          },
        })}
      >
        <div
          className={css({
            alignItems: "center",
            backgroundColor: "accent.solid",
            color: "accent.fg",
            display: "flex",
            flexDirection: "column",
            gap: "2.5",
            justifyContent: "center",
            minInlineSize: 0,
            paddingBlock: "8",
            [wideContainer]: {
              borderRadius: "sheet",
              gap: "3",
              margin: "2",
              paddingBlock: "0",
            },
          })}
        >
          <span className={brandMark}>
            <Package size={21} aria-hidden />
          </span>
          <p translate="no" className={brandWordmark}>
            Pantry
          </p>
          <p className={brandTagline}>集めて、あとで読む。</p>
        </div>

        <section
          className={css({
            display: "grid",
            placeItems: "center",
            minInlineSize: 0,
            paddingInline: 4,
            [wideContainer]: {
              paddingInline: 12,
            },
          })}
        >
          <div
            className={grid({
              paddingInline: 6,
              paddingBlock: 10,
              borderRadius: "sheet",
              inlineSize: "min(100%, 20rem)",
              '& button[type="submit"]': {
                inlineSize: "stretch",
              },
            })}
          >
            <h1 className={css({ textAlign: "center" })}>ログイン</h1>
            <PasskeySignIn redirect={redirect} />
            <SignInWithEmailAndPasswordForm onSignIn={onSignIn} />
          </div>
        </section>
      </div>
    </div>
  );
}
