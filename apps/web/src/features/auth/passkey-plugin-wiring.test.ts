import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const dir = import.meta.dirname;
const webRoot = join(dir, "../../..");

async function readFromAuth(path: string): Promise<string> {
  return await readFile(join(dir, path), "utf-8");
}

describe("passkey plugin wiring", () => {
  test("auth client installs passkeyClient", async () => {
    const source = await readFromAuth("lib/auth-client.ts");

    expect(source).toContain('from "@better-auth/passkey/client"');
    expect(source).toContain("passkeyClient()");
  });

  test("auth client は同一 origin の /api/auth を使う（baseURL を持たない）", async () => {
    const source = await readFromAuth("lib/auth-client.ts");

    expect(source).not.toContain("baseURL");
  });

  test("web は Better Auth の server instance を持たない（pantry-api が持つ）", async () => {
    const removed = [
      join(webRoot, "auth.ts"),
      join(dir, "server/get-auth.server.ts"),
      join(dir, "lib/passkey/plugin-options.ts"),
    ];
    for (const path of removed) {
      await expect(access(path)).rejects.toThrow();
    }
  });
});
