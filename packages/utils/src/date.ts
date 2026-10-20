/**
 * 表示用の日時整形。ロケールとタイムゾーンは ja-JP / Asia/Tokyo に固定する。
 * 実行環境（ブラウザ・Worker・Node）の既定値に左右させず、同じ値が同じ文字列になるようにする。
 */

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。
 */
const toDate = (value: string | Date): Date =>
  typeof value === "string" ? new Date(value) : value;

const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Tokyo",
  year: "numeric",
});

export const formatDateTime = (date: string | Date): string =>
  dateTimeFormatter.format(toDate(date));

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Tokyo",
  year: "numeric",
});

/** 詳細メタ用の日付のみ（「2026/09/14」）。 */
export const formatDate = (date: string | Date): string =>
  dateFormatter.format(toDate(date));

const relativeFormatter = new Intl.RelativeTimeFormat("ja-JP", {
  numeric: "auto",
});

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * 一覧メタ用の相対時刻（「3 日前」「昨日」）。`now` はテストから差し替えられるよう引数化する。
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
