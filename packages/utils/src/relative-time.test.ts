import { describe, expect, test } from "vitest";

import { formatRelativeTime } from "./relative-time";

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
   * 暦の 1 か月に届かない期間でも、最短の月（28日）に達していれば月として扱う。
   * この下限が無いと、ちょうど 30 日が「4 週間前」になる。
   */
  test("treats 28 days and over as a month", () => {
    expect(formatRelativeTime("2026-07-29T12:00:00.000Z", now)).toBe("先月");
    expect(formatRelativeTime("2026-07-31T12:00:00.000Z", now)).toBe("先月");
  });

  test("keeps 27 days in weeks", () => {
    expect(formatRelativeTime("2026-08-01T12:00:00.000Z", now)).toBe(
      "3 週間前"
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

  test("returns the raw value instead of throwing", () => {
    expect(formatRelativeTime("not a timestamp")).toBe("not a timestamp");
  });
});
