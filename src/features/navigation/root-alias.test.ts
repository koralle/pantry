import { describe, expect, test } from "vitest";

import type { FileRouteTypes } from "../../routeTree.gen";

type ProtectedIndexRouteIsAbsent =
  Extract<FileRouteTypes["id"], "/_protected/"> extends never ? true : false;

const protectedIndexRouteIsAbsent: ProtectedIndexRouteIsAbsent = true;

describe("root alias", () => {
  test("does not register a protected index route", () => {
    expect(protectedIndexRouteIsAbsent).toBeTruthy();
  });
});
