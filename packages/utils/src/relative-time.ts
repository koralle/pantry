import { fromDate, parseAbsolute } from "@internationalized/date";
import type { DateTimeDuration, ZonedDateTime } from "@internationalized/date";

/**
 * 一覧メタ用の相対時刻。ロケールとタイムゾーンは ja-JP / Asia/Tokyo に固定する。
 */
const LOCALE = "ja-JP";
const TIME_ZONE = "Asia/Tokyo";

/**
 * 月として扱い始める日数。暦の 1 か月に届かない期間でも、最短の月（28日）に達していれば
 * 「1 か月」と呼ぶ。この下限が無いと、ちょうど 30 日が「4 週間前」になる。
 */
const MIN_DAYS_FOR_MONTH = 28;

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。
 *
 * `parseAbsolute` はオフセット無し（`2026-08-28T03:00:00`）や日付のみ（`2026-08-28`）を
 * 受け付けないため、その場合は `Date` の解釈へ落とす。壊れた値で描画を落とさないよう
 * undefined を返す。
 */
const toZoned = (value: string | Date): ZonedDateTime | undefined => {
  if (typeof value !== "string") {
    return Number.isNaN(value.getTime())
      ? undefined
      : fromDate(value, TIME_ZONE);
  }

  try {
    return parseAbsolute(value, TIME_ZONE);
  } catch {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? undefined
      : fromDate(parsed, TIME_ZONE);
  }
};

interface Span {
  readonly backwards: boolean;
  readonly end: ZonedDateTime;
  readonly start: ZonedDateTime;
}

/** 単位を数える向きを揃える。`start` から `end` へ進む向きで数え、最後に符号を戻す。 */
const spanOf = (from: ZonedDateTime, to: ZonedDateTime): Span => {
  const backwards = to.compare(from) < 0;
  return {
    backwards,
    end: backwards ? from : to,
    start: backwards ? to : from,
  };
};

/**
 * `from` から `to` まで `duration` を何個ぶん進められるか。`from` より過去なら負。
 * 1 つ下の単位の個数ぶんしか回らないため、反復は最大でも 60 回に収まる。
 */
const countSteps = (
  from: ZonedDateTime,
  to: ZonedDateTime,
  duration: DateTimeDuration
): number => {
  const { backwards, end, start } = spanOf(from, to);

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
 * 暦のフィールド差を初期値にし、加算結果と比較して ±1 回だけ補正する。
 * 差分の大きさに比例した繰り返しを避けるため、遠い未来・過去でも計算量が変わらない。
 */
const settleCalendarCount = (
  to: ZonedDateTime,
  initial: number,
  add: (count: number) => ZonedDateTime
): number => {
  const sign = initial < 0 ? -1 : 1;
  let count = initial;

  if (count !== 0 && add(count).compare(to) * sign > 0) {
    count -= sign;
  }
  if (add(count + sign).compare(to) * sign <= 0) {
    count += sign;
  }

  return count;
};

const yearsBetween = (from: ZonedDateTime, to: ZonedDateTime): number =>
  settleCalendarCount(to, to.year - from.year, (count) =>
    from.add({ years: count })
  );

const monthsBetween = (from: ZonedDateTime, to: ZonedDateTime): number => {
  const calendar = settleCalendarCount(
    to,
    (to.year - from.year) * 12 + (to.month - from.month),
    (count) => from.add({ months: count })
  );
  if (calendar !== 0) {
    return calendar;
  }

  const { backwards, end, start } = spanOf(from, to);
  const reachedMinimum =
    start.add({ days: MIN_DAYS_FOR_MONTH }).compare(end) <= 0;
  if (!reachedMinimum) {
    return 0;
  }
  return backwards ? -1 : 1;
};

interface RelativeUnit {
  readonly count: (from: ZonedDateTime, to: ZonedDateTime) => number;
  readonly unit: Intl.RelativeTimeFormatUnit;
}

/**
 * 相対時刻に使う単位を大きい順に並べたもの。
 * `@internationalized/date` 3.12.4 は 2 値の差分（`until` / `Duration`）を公開していないため、
 * 差分は暦の加算で数える。固定のミリ秒定数で割らないので、月の長さ（28〜31日）が
 * 違っても単位の取り違えが起きない。
 */
const RELATIVE_UNITS: readonly RelativeUnit[] = [
  { count: yearsBetween, unit: "year" },
  { count: monthsBetween, unit: "month" },
  { count: (from, to) => countSteps(from, to, { days: 7 }), unit: "week" },
  { count: (from, to) => countSteps(from, to, { days: 1 }), unit: "day" },
  { count: (from, to) => countSteps(from, to, { hours: 1 }), unit: "hour" },
  { count: (from, to) => countSteps(from, to, { minutes: 1 }), unit: "minute" },
];

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, {
  numeric: "auto",
});

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

  for (const { count, unit } of RELATIVE_UNITS) {
    const steps = count(reference, target);
    if (steps !== 0) {
      return relativeFormatter.format(steps, unit);
    }
  }

  return "たった今";
};
