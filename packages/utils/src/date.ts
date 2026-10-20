import {
  DateFormatter,
  fromDate,
  parseAbsolute,
} from "@internationalized/date";
import type { DateTimeDuration, ZonedDateTime } from "@internationalized/date";

/**
 * 表示用の日時整形。ロケールとタイムゾーンは ja-JP / Asia/Tokyo に固定する。
 * 実行環境（ブラウザ・Worker・Node）の既定値に左右させず、同じ値が同じ文字列になるようにする。
 */
const LOCALE = "ja-JP";
const TIME_ZONE = "Asia/Tokyo";

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。壊れた値で描画を落とさないよう undefined を返す。
 */
const toZoned = (value: string | Date): ZonedDateTime | undefined => {
  try {
    return typeof value === "string"
      ? parseAbsolute(value, TIME_ZONE)
      : fromDate(value, TIME_ZONE);
  } catch {
    return undefined;
  }
};

const dateFormatter = new DateFormatter(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});

const dateTimeFormatter = new DateFormatter(LOCALE, {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});

const formatWith = (formatter: DateFormatter, value: string | Date): string => {
  const zoned = toZoned(value);
  return zoned === undefined ? String(value) : formatter.format(zoned.toDate());
};

/** 詳細メタ用の日付のみ（「2026/09/14」）。 */
export const formatDate = (value: string | Date): string =>
  formatWith(dateFormatter, value);

export const formatDateTime = (value: string | Date): string =>
  formatWith(dateTimeFormatter, value);

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
});

/**
 * 相対時刻に使う単位を大きい順に並べたもの。
 * `@internationalized/date` 3.12.4 は 2 値の差分（`until` / `Duration`）を公開していないため、
 * 差分は暦の加算で数える。固定のミリ秒定数で割らないので、月の長さ（28〜31日）が
 * 違っても単位の取り違えが起きない。
 */
const RELATIVE_UNITS = [
  { duration: { years: 1 }, unit: "year" },
  { duration: { months: 1 }, unit: "month" },
  { duration: { days: 7 }, unit: "week" },
  { duration: { days: 1 }, unit: "day" },
  { duration: { hours: 1 }, unit: "hour" },
  { duration: { minutes: 1 }, unit: "minute" },
] as const satisfies readonly {
  readonly duration: DateTimeDuration;
  readonly unit: Intl.RelativeTimeFormatUnit;
}[];

/**
 * `from` から `to` まで `duration` を何個ぶん進められるか。`from` より過去なら負。
 * 単位の選定は大きい順に行うため、繰り返しは「1 つ下の単位の個数 + 1」回で収まる。
 */
const countUnits = (
  from: ZonedDateTime,
  to: ZonedDateTime,
  duration: DateTimeDuration
): number => {
  const backwards = to.compare(from) < 0;
  const start = backwards ? to : from;
  const end = backwards ? from : to;

  let count = 0;
  let cursor = start;
  for (;;) {
    const next = cursor.add(duration);
    if (next.compare(end) > 0) {
      break;
    }
    cursor = next;
    count += 1;
  }

  return backwards ? -count : count;
};

/**
 * 一覧メタ用の相対時刻（「3 日前」「昨日」）。`now` はテストから差し替えられるよう引数化する。
 */
export const formatRelativeTime = (
  value: string | Date,
  now: Date = new Date()
): string => {
  const target = toZoned(value);
  const reference = toZoned(now);
  if (target === undefined || reference === undefined) {
    return String(value);
  }

  for (const { duration, unit } of RELATIVE_UNITS) {
    const count = countUnits(reference, target, duration);
    if (count !== 0) {
      return relativeFormatter.format(count, unit);
    }
  }

  return "たった今";
};
