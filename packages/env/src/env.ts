import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

/** Read in order: the later file wins over the earlier one. Both are gitignored. */
const ENV_FILES = [".env.development", ".env.development.local"] as const;

/**
 * Vars the api Worker needs in dev: `secrets.required` in `apps/api/wrangler.jsonc`
 * plus `APP_ENV` (a var, so it is not listed there).
 * Only these are handed to wrangler: forwarding all of `process.env` would copy
 * unrelated secrets into the Worker's vars.
 */
const WORKER_ENV_KEYS = [
  "APP_ENV",
  "TURSO_CONNECTION_URL",
  "TURSO_AUTH_TOKEN",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

const defaultEnvDir = (): string => path.dirname(import.meta.dirname);

/**
 * Reads the dev env files into `process.env`. Values already in `process.env`
 * win (CI secrets, verify-pantry exports), so callers can override by exporting.
 */
export const loadDevEnv = (envDir = defaultEnvDir()): void => {
  const fromShell = new Set(Object.keys(process.env));

  for (const file of ENV_FILES) {
    const envPath = path.join(envDir, file);
    if (!existsSync(envPath)) {
      continue;
    }
    for (const [key, value] of Object.entries(
      parseEnv(readFileSync(envPath, "utf-8"))
    )) {
      if (!fromShell.has(key)) {
        process.env[key] = value;
      }
    }
  }
};

/** Loads the dev env and returns the api Worker's `vars` for wrangler. */
export const workerVars = (envDir?: string): Record<string, string> => {
  loadDevEnv(envDir);

  const vars: Record<string, string> = {};
  for (const key of WORKER_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      vars[key] = value;
    }
  }
  return vars;
};
