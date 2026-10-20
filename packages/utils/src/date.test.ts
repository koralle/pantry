import { describe, expect, test } from "vitest";

import { formatDate } from "./date";

describe(formatDate, () => {
  test("formats a UTC timestamp in Asia/Tokyo", () => {
    expect(formatDate("2026-08-28T03:00:00.000Z")).toBe("2026/08/28");
    expect(formatDate(new Date("2026-08-28T03:00:00.000Z"))).toBe("2026/08/28");
  });

  test("accepts date-only and offset-less strings", () => {
    expect(formatDate("2026-08-28")).toBe("2026/08/28");
    expect(formatDate("2026-08-28T03:00:00")).toBe("2026/08/28");
  });

  test("returns the raw value instead of throwing", () => {
    expect(formatDate("not a timestamp")).toBe("not a timestamp");
    expect(formatDate(new Date("invalid"))).toBe("Invalid Date");
  });
});
