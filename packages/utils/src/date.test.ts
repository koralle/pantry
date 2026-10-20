import { describe, expect, test } from "vitest";

import { formatDate, formatDateTime, formatRelativeTime } from "./date";

describe(formatDate, () => {
  test("formats a UTC timestamp in Asia/Tokyo", () => {
    expect(formatDate("2026-08-28T03:00:00.000Z")).toBe("2026/08/28");
    expect(formatDate(new Date("2026-08-28T03:00:00.000Z"))).toBe("2026/08/28");
  });
});

describe(formatDateTime, () => {
  test("formats a UTC timestamp with time in Asia/Tokyo", () => {
    expect(formatDateTime("2026-08-28T03:00:00.000Z")).toBe(
      "2026/08/28 12:00:00"
    );
  });
});

describe(formatRelativeTime, () => {
  const now = new Date("2026-08-28T12:00:00.000Z");

  test("uses a fixed label under a minute", () => {
    expect(formatRelativeTime("2026-08-28T11:59:30.000Z", now)).toBe(
      "たった今"
    );
  });

  test("formats days with Intl.RelativeTimeFormat", () => {
    expect(formatRelativeTime("2026-08-25T12:00:00.000Z", now)).toBe("3 日前");
    expect(formatRelativeTime("2026-08-27T12:00:00.000Z", now)).toBe("昨日");
  });
});
