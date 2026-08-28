const passkeyCreatedAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((entry) => entry.type === type)?.value ?? ''
}

export function formatPasskeyCreatedAt(date: string | Date): string {
  const parts = passkeyCreatedAtFormatter.formatToParts(
    typeof date === 'string' ? new Date(date) : date
  )

  return `${part(parts, 'year')}/${part(parts, 'month')}/${part(parts, 'day')} ${part(parts, 'hour')}:${part(parts, 'minute')}`
}
