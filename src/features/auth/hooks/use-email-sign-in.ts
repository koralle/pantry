import { useRouter } from "@tanstack/react-router";

import { err, ok } from "../../../shared/domain/result";
import type { Result } from "../../../shared/domain/result";
import { authClient } from "../lib/auth-client";
import { SignInError } from "../lib/sign-in-error";
import type { SignInSchema } from "../lib/sign-in-schema";

interface UseEmailSignInProps {
  readonly redirect: string | undefined;
}

export const useEmailSignIn = ({ redirect }: UseEmailSignInProps) => {
  const router = useRouter();

  const signInWithEmailAndPassword = async ({
    email,
    password,
  }: SignInSchema): Promise<Result<void, SignInError>> => {
    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error !== null && error !== undefined) {
        return err(
          new SignInError({
            code: error.code,
            status: error.status,
            statusText: error.statusText,
          })
        );
      }

      await router.navigate({ to: redirect ?? "/bookmarks" });
      return ok();
    } catch {
      return err(
        new SignInError({
          code: "SIGN_IN_FAILED",
          status: 500,
          statusText: "Internal Server Error",
        })
      );
    }
  };

  return { signInWithEmailAndPassword };
};
