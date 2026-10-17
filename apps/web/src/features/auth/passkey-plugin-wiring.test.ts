import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;
const repoRoot = join(dir, "../../..");

async function readFromAuth(path: string): Promise<string> {
  return await readFile(join(dir, path), "utf-8");
}

describe("passkey plugin wiring", () => {
  test("Worker auth keeps email+password and adds the passkey plugin", async () => {
    const source = await readFromAuth("server/get-auth.server.ts");

    expect(source).toContain(
      "emailAndPassword: {\n      enabled: true,\n    }"
    );
    expect(source).toContain("session: {\n      freshAge: 0,\n    }");
    expect(source).toContain('from "@better-auth/passkey"');
    expect(source).toContain(
      "passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))"
    );
    expect(source).toContain("admin()");
  });

  test("Node auth CLI entry matches Worker passkey wiring", async () => {
    const source = await readFile(join(repoRoot, "auth.ts"), "utf-8");

    expect(source).toContain("emailAndPassword: {\n    enabled: true,\n  }");
    expect(source).toContain("session: {\n    freshAge: 0,\n  }");
    expect(source).toContain('from "@better-auth/passkey"');
    expect(source).toContain(
      "passkey(passkeyPluginOptions(env.BETTER_AUTH_URL))"
    );
  });

  test("auth client installs passkeyClient", async () => {
    const source = await readFromAuth("lib/auth-client.ts");

    expect(source).toContain('from "@better-auth/passkey/client"');
    expect(source).toContain("passkeyClient()");
  });
});
