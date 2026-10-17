import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;
const srcDir = join(dir, "../..");

async function readSource(path: string): Promise<string> {
  return await readFile(join(srcDir, path), "utf-8");
}

describe("passkey UI contracts", () => {
  test("login shows an explicit passkey action before the password form", async () => {
    const page = await readSource("routes/sign-in/index.tsx");
    const passkeyIndex = page.indexOf("<PasskeySignIn");
    const passwordIndex = page.indexOf("<SignInWithEmailAndPasswordForm");

    expect(passkeyIndex).toBeGreaterThan(-1);
    expect(passwordIndex).toBeGreaterThan(passkeyIndex);
    expect(page).toMatch(
      /<ClientOnly fallback=\{null\}>\s*<PasskeySignIn signInAction=\{signInWithPasskey\} \/>\s*<\/ClientOnly>/
    );

    const signIn = await readSource(
      "features/auth/components/passkey/sign-in.tsx"
    );
    expect(signIn).toContain("パスキーでログイン");
    expect(signIn).toContain("または");
    expect(signIn).toContain("await signInAction()");
    expect(signIn).not.toContain("authClient");
    expect(signIn).not.toContain("useRouter");
    expect(signIn).not.toContain("autoFill");
    expect(signIn).not.toContain("isConditionalMediationAvailable");
    expect(signIn).not.toContain("useEffect");
    expect(signIn).toContain("if (!isWebAuthnAvailable())");

    const form = await readSource(
      "features/auth/components/sign-in-form/index.tsx"
    );
    expect(form).toContain('autoComplete="email"');
    expect(form).toContain('autoComplete="current-password"');
    expect(form).not.toContain("webauthn");
  });

  test("passkey sign-in uses transition pending state", async () => {
    const signIn = await readSource(
      "features/auth/components/passkey/sign-in.tsx"
    );
    expect(signIn).toContain(
      "const [isPending, startTransition] = useTransition()"
    );
    expect(signIn).toContain("startTransition(async () => {");
    expect(signIn).toContain("isDisabled={isPending}");
    expect(signIn).not.toContain("setIsPending");
  });

  test("settings hosts passkey management between account and session", async () => {
    const page = await readSource("routes/_protected/settings/index.tsx");
    const accountIndex = page.indexOf("アカウント");
    const passkeyIndex = page.indexOf("<PasskeySettings");
    const sessionIndex = page.indexOf("セッション");

    expect(accountIndex).toBeGreaterThan(-1);
    expect(passkeyIndex).toBeGreaterThan(accountIndex);
    expect(sessionIndex).toBeGreaterThan(passkeyIndex);
  });

  test("registration starts without collecting a display name first", async () => {
    const settings = await readSource(
      "features/auth/components/passkey/settings.tsx"
    );
    expect(settings).toContain("パスキーを登録");
    expect(settings).toContain("authClient.passkey.addPasskey()");
    expect(settings).not.toContain("addPasskey({");
  });

  test("display names resolve without importing the server passkey plugin", async () => {
    const source = await readSource(
      "features/auth/lib/passkey/display-name.ts"
    );
    expect(source).not.toContain("@better-auth/passkey'");
    expect(source).toContain("Google Password Manager");
    expect(source).toContain("1Password");
  });

  test("delete asks for confirmation before calling the API", async () => {
    const dialog = await readSource(
      "features/auth/components/passkey/delete-dialog.tsx"
    );
    expect(dialog).toContain("パスキーを削除しますか？");
    expect(dialog).toContain("削除する");
    expect(dialog).toContain("キャンセル");
  });
});
