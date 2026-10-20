import { describe, expect, test } from "vitest";

import { clientIpHeaders } from "./create-auth";

describe(clientIpHeaders, () => {
  test("本番は CF-Connecting-IP だけを信用する", () => {
    expect(clientIpHeaders("production")).toStrictEqual(["cf-connecting-ip"]);
  });

  test.each(["staging", "prod", "Production", "Development", "", undefined])(
    "未知の値（%j）では本番と同じく X-Forwarded-For を読まない",
    (appEnv) => {
      expect(clientIpHeaders(appEnv)).toStrictEqual(["cf-connecting-ip"]);
    }
  );

  test.each(["development", "test"])(
    "%s では X-Forwarded-For も予備として読む",
    (appEnv) => {
      expect(clientIpHeaders(appEnv)).toStrictEqual([
        "cf-connecting-ip",
        "x-forwarded-for",
      ]);
    }
  );
});
