import { describe, expect, test } from "vitest";

import { resolveTursoConnection } from "./turso-connection";

describe(resolveTursoConnection, () => {
  test("reads url and authToken from the provided env at call time", () => {
    const envBag: {
      TURSO_CONNECTION_URL?: string;
      TURSO_AUTH_TOKEN?: string;
    } = {};

    envBag.TURSO_CONNECTION_URL = "libsql://pantry-production-db.turso.io";
    envBag.TURSO_AUTH_TOKEN = "test-token";

    expect(resolveTursoConnection(envBag)).toStrictEqual({
      authToken: "test-token",
      url: "libsql://pantry-production-db.turso.io",
    });
  });

  test("throws when TURSO_CONNECTION_URL is missing", () => {
    expect(() =>
      resolveTursoConnection({
        TURSO_AUTH_TOKEN: "test-token",
      })
    ).toThrow(/TURSO_CONNECTION_URL/);
  });

  test("throws when TURSO_AUTH_TOKEN is missing", () => {
    expect(() =>
      resolveTursoConnection({
        TURSO_CONNECTION_URL: "libsql://pantry-production-db.turso.io",
      })
    ).toThrow(/TURSO_AUTH_TOKEN/);
  });
});
