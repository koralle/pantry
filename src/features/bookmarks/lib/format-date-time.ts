const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Tokyo",
  year: "numeric",
});

const listDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Tokyo",
  year: "numeric",
});

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。
 */
const toDate = (value: string | Date): Date =>
  typeof value === "string" ? new Date(value) : value;

export const formatDateTime = (date: string | Date): string =>
  dateTimeFormatter.format(toDate(date));

export const formatListDateTime = (date: string | Date): string =>
  listDateTimeFormatter.format(toDate(date));
