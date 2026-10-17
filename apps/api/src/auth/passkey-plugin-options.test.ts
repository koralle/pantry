import { describe, expect, test } from "vitest";

import { passkeyPluginOptions } from "./passkey-plugin-options";

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

  test("throws a descriptive error on an invalid URL", () => {
    expect(() => passkeyPluginOptions("not a url")).toThrow(
      "BETTER_AUTH_URL is not a valid URL: not a url"
    );
  });
});
