import { beforeEach, describe, expect, test, vi } from "vitest";

import { readListLayout, writeListLayout } from "./list-layout-preference";

describe("list-layout-preference", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      removeItem: (k: string) => {
        store.delete(k);
      },
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    });
  });

  test("defaults to table", () => {
    expect(readListLayout()).toBe("table");
  });

  test("persists card", () => {
    writeListLayout("card");
    expect(readListLayout()).toBe("card");
  });
});
