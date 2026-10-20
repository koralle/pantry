import { DateFormatter } from "@internationalized/date";

/**
 * 表示用の日付整形。ロケールとタイムゾーンは ja-JP / Asia/Tokyo に固定する。
 * 実行環境（ブラウザ・Worker・Node）の既定値に左右させず、同じ値が同じ文字列になるようにする。
 *
 * この module は `DateFormatter` と `Date` だけで完結させ、`ZonedDateTime` を読み込まない。
 * 日付だけを出す画面がカレンダー・タイムゾーン処理の一式を bundle しないようにするため、
 * 相対時刻は `@pantry/utils/relative-time` に分けている。
 */
const LOCALE = "ja-JP";
const TIME_ZONE = "Asia/Tokyo";

const dateFormatter = new DateFormatter(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。壊れた値で描画を落とさないよう生の値を返す。
 */
export const formatDate = (value: string | Date): string => {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime())
    ? String(value)
    : dateFormatter.format(date);
};
