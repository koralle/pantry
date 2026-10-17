import { describe, expect, it } from "vitest";

import { clientIpHeaders } from "./create-auth";

describe(clientIpHeaders, () => {
  it("本番は CF-Connecting-IP だけを信用する", () => {
    expect(clientIpHeaders("production")).toStrictEqual(["cf-connecting-ip"]);
  });

  it.each(["development", "test"])(
    "%s では X-Forwarded-For も予備として読む",
    (appEnv) => {
      expect(clientIpHeaders(appEnv)).toStrictEqual([
        "cf-connecting-ip",
        "x-forwarded-for",
      ]);
    }
  );
});
