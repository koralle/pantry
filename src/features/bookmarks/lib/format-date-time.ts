const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
})

const listDateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})

/**
 * Wire 上の timestamp は ISO 文字列で来る。SSR の dehydrate を JSON で通すため、
 * Date インスタンスは契約に載せない。
 */
function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value
}

export function formatDateTime(date: string | Date): string {
  return dateTimeFormatter.format(toDate(date))
}

export function formatListDateTime(date: string | Date): string {
  return listDateTimeFormatter.format(toDate(date))
}
