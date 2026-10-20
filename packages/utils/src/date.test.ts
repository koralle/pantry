import { describe, expect, test } from "vitest";

import { formatDate, formatRelativeTime } from "./date";

describe(formatDate, () => {
  test("formats a UTC timestamp in Asia/Tokyo", () => {
    expect(formatDate("2026-08-28T03:00:00.000Z")).toBe("2026/08/28");
    expect(formatDate(new Date("2026-08-28T03:00:00.000Z"))).toBe("2026/08/28");
  });

  test("accepts date-only and offset-less strings", () => {
    expect(formatDate("2026-08-28")).toBe("2026/08/28");
    expect(formatDate("2026-08-28T03:00:00")).toBe("2026/08/28");
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

  test("formats future timestamps as well", () => {
    expect(formatRelativeTime("2026-08-31T12:00:00.000Z", now)).toBe("3 日後");
  });

  test("accepts a Date instance", () => {
    expect(formatRelativeTime(new Date("2026-08-25T12:00:00.000Z"), now)).toBe(
      "3 日前"
    );
  });

  test("counts calendar months instead of fixed millisecond spans", () => {
    expect(formatRelativeTime("2026-07-20T12:00:00.000Z", now)).toBe("先月");
    expect(formatRelativeTime("2024-08-28T12:00:00.000Z", now)).toBe("2 年前");
  });

  /**
   * 暦で数えるため、ちょうど 30 日は「1 か月」に届かず週のままになる（旧実装は 30 日を
   * 1 か月とみなしていた）。単位の境界はここで固定する。
   */
  test("keeps 30 days in weeks because it is short of a calendar month", () => {
    expect(formatRelativeTime("2026-07-29T12:00:00.000Z", now)).toBe(
      "4 週間前"
    );
  });

  test("counts months from the clamped start without accumulating it", () => {
    expect(formatRelativeTime("2026-01-31T12:00:00.000Z", now)).toBe(
      "6 か月前"
    );
  });

  test("stays fast for far future timestamps", () => {
    const started = performance.now();
    expect(formatRelativeTime("9999-12-31T00:00:00.000Z", now)).toBe(
      "7,973 年後"
    );
    expect(performance.now() - started).toBeLessThan(50);
  });
});

describe("invalid input", () => {
  test("returns the raw value instead of throwing", () => {
    expect(formatDate("not a timestamp")).toBe("not a timestamp");
    expect(formatRelativeTime("not a timestamp")).toBe("not a timestamp");
    expect(formatDate(new Date("invalid"))).toBe("Invalid Date");
  });
});
