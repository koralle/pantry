import { describe, expect, test } from "vitest";

import { passkeyPluginOptions } from "./plugin-options";

describe(passkeyPluginOptions, () => {
  test("derives rpID and origin from BETTER_AUTH_URL", () => {
    expect(passkeyPluginOptions("http://localhost:3000")).toStrictEqual({
      origin: "http://localhost:3000",
      rpID: "localhost",
      rpName: "Pantry",
    });
  });

  test("uses the hostname as rpID on a production origin", () => {
    expect(passkeyPluginOptions("https://pantry.example.com")).toStrictEqual({
      origin: "https://pantry.example.com",
      rpID: "pantry.example.com",
      rpName: "Pantry",
    });
  });

  test("does not include a trailing slash on origin", () => {
    expect(passkeyPluginOptions("https://pantry.example.com/").origin).toBe(
      "https://pantry.example.com"
    );
  });
});
