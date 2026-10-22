import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, expect, test } from "vitest";

import { loadDevEnv, workerVars } from "./env";

const KEYS = [
  "APP_ENV",
  "TURSO_CONNECTION_URL",
  "TURSO_AUTH_TOKEN",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

const ORIGINAL = new Map(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    const value = ORIGINAL.get(key);
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }
});

const envDirWith = (files: Readonly<Record<string, string>>): string => {
  const dir = mkdtempSync(path.join(tmpdir(), "pantry-env-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(dir, name), content);
  }
  return dir;
};

test("the .local file overrides the shared file", () => {
  const dir = envDirWith({
    ".env.development": "TURSO_CONNECTION_URL=http://127.0.0.1:8080\n",
    ".env.development.local": "TURSO_CONNECTION_URL=http://127.0.0.1:9100\n",
  });

  loadDevEnv(dir);

  expect(process.env["TURSO_CONNECTION_URL"]).toBe("http://127.0.0.1:9100");
});

test("a value exported in the shell wins over the files", () => {
  const dir = envDirWith({
    ".env.development": "TURSO_CONNECTION_URL=http://127.0.0.1:8080\n",
    ".env.development.local": "TURSO_CONNECTION_URL=http://127.0.0.1:9100\n",
  });
  process.env["TURSO_CONNECTION_URL"] = "http://127.0.0.1:18080";

  loadDevEnv(dir);

  expect(process.env["TURSO_CONNECTION_URL"]).toBe("http://127.0.0.1:18080");
});

test("workerVars picks only the Worker's keys", () => {
  const dir = envDirWith({
    ".env.development":
      "TURSO_PORT=8080\nBETTER_AUTH_URL=http://localhost:3000\n",
  });

  expect(workerVars(dir)).toStrictEqual({
    BETTER_AUTH_URL: "http://localhost:3000",
  });
});
