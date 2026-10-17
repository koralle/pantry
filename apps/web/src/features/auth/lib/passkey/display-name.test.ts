import { describe, expect, test } from "vitest";

import { passkeyDisplayName } from "./display-name";

describe(passkeyDisplayName, () => {
  test("uses the user-set name when it is non-empty", () => {
    expect(
      passkeyDisplayName({
        aaguid: "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4",
        name: "仕事用キー",
      })
    ).toBe("仕事用キー");
  });

  test("trims the user-set name before using it", () => {
    expect(
      passkeyDisplayName({
        aaguid: null,
        name: "  自宅  ",
      })
    ).toBe("自宅");
  });

  test("falls back to the authenticator name when the user name is unset", () => {
    expect(
      passkeyDisplayName({
        aaguid: "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4",
        name: null,
      })
    ).toBe("Google Password Manager");
    expect(
      passkeyDisplayName({
        aaguid: "bada5566-a7aa-401f-bd96-45619a55120d",
        name: "",
      })
    ).toBe("1Password");
  });

  test("treats a whitespace-only name as unset", () => {
    expect(
      passkeyDisplayName({
        aaguid: "bada5566-a7aa-401f-bd96-45619a55120d",
        name: "   ",
      })
    ).toBe("1Password");
  });

  test("falls back to パスキー when the authenticator cannot be identified", () => {
    expect(
      passkeyDisplayName({
        aaguid: "00000000-0000-0000-0000-000000000000",
        name: null,
      })
    ).toBe("パスキー");
    expect(
      passkeyDisplayName({
        aaguid: null,
        name: null,
      })
    ).toBe("パスキー");
    expect(
      passkeyDisplayName({
        aaguid: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        name: null,
      })
    ).toBe("パスキー");
  });
});
