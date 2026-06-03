export function getDb(env: Env): D1Database {
  return env.DB
}

export function generateId(): string {
  const timestamp = Date.now()
  const hex = crypto.getRandomValues(new Uint8Array(10))

  const timeHex = timestamp.toString(16).padStart(12, '0')
  const randHex = [...hex].map((b) => b.toString(16).padStart(2, '0')).join('')

  return [
    timeHex.slice(0, 8),
    timeHex.slice(8, 12),
    `7${randHex.slice(0, 3)}`,
    (8 + (Number.parseInt(randHex[3]!, 16) & 3)).toString(16) + randHex.slice(4, 8),
    randHex.slice(8, 20)
  ].join('-')
}

export function nowUTC(): string {
  return new Date().toISOString()
}
