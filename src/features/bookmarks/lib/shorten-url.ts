export function shortenUrl(url: string, maxLength = 56): string {
  const truncate = (value: string) =>
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value

  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname
    const display = `${parsed.host}${path}`
    return truncate(display)
  } catch {
    return truncate(url)
  }
}
