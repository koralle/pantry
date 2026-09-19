const relativeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

const toDate = (value: string | Date): Date =>
  typeof value === "string" ? new Date(value) : value;

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * 一覧メタ用の相対時刻（「3日前」「昨日」）。`now` はテストから差し替えられるよう引数化する。
 */
export const formatRelativeTime = (
  date: string | Date,
  now: Date = new Date()
): string => {
  const diff = toDate(date).getTime() - now.getTime();
  const abs = Math.abs(diff);

  if (abs < MINUTE) {
    return "たった今";
  }
  if (abs < HOUR) {
    return relativeFormatter.format(Math.trunc(diff / MINUTE), "minute");
  }
  if (abs < DAY) {
    return relativeFormatter.format(Math.trunc(diff / HOUR), "hour");
  }
  if (abs < WEEK) {
    return relativeFormatter.format(Math.trunc(diff / DAY), "day");
  }
  if (abs < MONTH) {
    return relativeFormatter.format(Math.trunc(diff / WEEK), "week");
  }
  if (abs < YEAR) {
    return relativeFormatter.format(Math.trunc(diff / MONTH), "month");
  }
  return relativeFormatter.format(Math.trunc(diff / YEAR), "year");
};
