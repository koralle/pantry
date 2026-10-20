import { err, ok } from "@pantry/utils/result";
import type { Result } from "@pantry/utils/result";
import { useRouter } from "@tanstack/react-router";

import { authClient } from "../lib/auth-client";

export interface PasskeySignInError {
  readonly code?: string | undefined;
  readonly status?: number | undefined;
}

interface UsePasskeySignInProps {
  readonly redirect: string | undefined;
}

export const usePasskeySignIn = ({ redirect }: UsePasskeySignInProps) => {
  const router = useRouter();

  const signInWithPasskey = async (): Promise<
    Result<void, PasskeySignInError>
  > => {
    try {
      const { error } = await authClient.signIn.passkey();
      if (error !== null && error !== undefined) {
        return err(error);
      }

      await router.navigate({ to: redirect ?? "/bookmarks" });
      return ok();
    } catch {
      return err({});
    }
  };

  return { signInWithPasskey };
};
