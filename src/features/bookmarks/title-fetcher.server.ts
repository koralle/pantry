const MAX_BODY_BYTES = 1_000_000
const MAX_TITLE_BYTES = 65_536
const MAX_REDIRECTS = 3
const TIMEOUT_MS = 3000
const DNS_OVER_HTTPS_ENDPOINT = 'https://cloudflare-dns.com/dns-query'
const IPV4_OCTET_BASE = 256
const IPV6_PART_BASE = 65_536
const IPV6_GLOBAL_UNICAST_PREFIX = 2n ** 125n

const metadataIpv4Addresses = new Set(['100.100.100.200'])
const blockedIpv6DestinationPrefixes = [
  [1_048_704n, 23n],
  [35_188_667_187_200n, 48n],
  [536_939_960n, 32n],
  [262_128n, 20n],
  [24_320n, 16n],
  [122_099_644_659_926_101_980_610_560n, 96n],
  [433_785_077_761n, 48n],
  [8194n, 16n],
  [536_936_448n, 32n]
] as const

// The title RPC represents an unavailable title as null.
const unavailableTitle = new Headers().get('x-pantry-title') as null

type HostnameResolver = (hostname: string, signal: AbortSignal) => Promise<string[] | null>

type DnsQuery = {
  hostname: string
  queryType: 'A' | 'AAAA'
  recordType: number
  signal: AbortSignal
}

type DnsResponse = {
  Answer?: Array<{
    data?: string
    type?: number
  }>
}

type BodyState = {
  chunks: Uint8Array[]
  titleBytes: number
  totalBytes: number
}

type FetchContext = {
  url: URL
  resolveHostname: HostnameResolver
  signal: AbortSignal
  redirects: number
}

function isIpv4Octet(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) <= IPV4_OCTET_BASE - 1
}

function parseIpv4(value: string): number | null {
  const octets = value.split('.')

  if (octets.length !== 4 || !octets.every(isIpv4Octet)) {
    return unavailableTitle
  }

  return octets.reduce((address, octet) => address * IPV4_OCTET_BASE + Number(octet), 0)
}

function ipv4Octets(address: number): [number, number, number, number] {
  return [
    Math.floor(address / IPV4_OCTET_BASE ** 3) % IPV4_OCTET_BASE,
    Math.floor(address / IPV4_OCTET_BASE ** 2) % IPV4_OCTET_BASE,
    Math.floor(address / IPV4_OCTET_BASE) % IPV4_OCTET_BASE,
    address % IPV4_OCTET_BASE
  ]
}

function formatIpv4(address: number): string {
  return ipv4Octets(address).join('.')
}

function isPrivateOrLoopbackIpv4(first: number, second: number): boolean {
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168))
  )
}

function isSpecialUseIpv4(first: number, second: number, third: number): boolean {
  return (
    (first === 192 && second === 88 && third === 99) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  )
}

function isBlockedIpv4(address: number): boolean {
  const [first, second, third] = ipv4Octets(address)

  return (
    isPrivateOrLoopbackIpv4(first, second) ||
    isSpecialUseIpv4(first, second, third) ||
    metadataIpv4Addresses.has(formatIpv4(address))
  )
}

function formatIpv4AsIpv6Parts(address: number): string {
  const high = Math.floor(address / IPV6_PART_BASE)
  const low = address % IPV6_PART_BASE

  return `${high.toString(16)}:${low.toString(16)}`
}

function normalizeEmbeddedIpv4(value: string): string | null {
  if (!value.includes('.')) {
    return value
  }

  const ipv4Index = value.lastIndexOf(':')
  const ipv4 = parseIpv4(value.slice(ipv4Index + 1))

  if (ipv4 === unavailableTitle) {
    return unavailableTitle
  }

  return `${value.slice(0, ipv4Index)}${formatIpv4AsIpv6Parts(ipv4)}`
}

function splitIpv6Side(value: string): string[] {
  if (value === '') {
    return []
  }

  return value.split(':')
}

function splitIpv6Parts(value: string): [string[], string[]] | null {
  const doubleColonIndex = value.indexOf('::')

  if (doubleColonIndex !== value.lastIndexOf('::')) {
    return unavailableTitle
  }

  if (doubleColonIndex === -1) {
    return [value.split(':'), []]
  }

  return [
    splitIpv6Side(value.slice(0, doubleColonIndex)),
    splitIpv6Side(value.slice(doubleColonIndex + 2))
  ]
}

function expandIpv6Parts(value: string): string[] | null {
  const parts = splitIpv6Parts(value)

  if (parts === unavailableTitle) {
    return unavailableTitle
  }

  const [left, right] = parts
  const missingParts = 8 - left.length - right.length
  const hasDoubleColon = value.includes('::')

  if ((!hasDoubleColon && missingParts !== 0) || (hasDoubleColon && missingParts < 1)) {
    return unavailableTitle
  }

  return [...left, ...Array<string>(missingParts).fill('0'), ...right]
}

function isIpv6Part(value: string): boolean {
  return /^[\da-f]{1,4}$/i.test(value)
}

function parseIpv6(value: string): bigint | null {
  const normalized = normalizeEmbeddedIpv4(value)

  if (normalized === unavailableTitle) {
    return unavailableTitle
  }

  const parts = expandIpv6Parts(normalized)

  if (parts === unavailableTitle || !parts.every(isIpv6Part)) {
    return unavailableTitle
  }

  return parts.reduce((address, part) => address * BigInt(IPV6_PART_BASE) + BigInt(`0x${part}`), 0n)
}

function matchesIpv6Prefix(address: bigint, prefix: bigint, length: bigint): boolean {
  return address / 2n ** (128n - length) === prefix
}

function isGlobalUnicastIpv6(address: bigint): boolean {
  return (
    !blockedIpv6DestinationPrefixes.some(([prefix, length]) =>
      matchesIpv6Prefix(address, prefix, length)
    ) && address / IPV6_GLOBAL_UNICAST_PREFIX === 1n
  )
}

function isBlockedIpAddress(hostname: string): boolean {
  const address = hostname.replace(/^\[|\]$/g, '')
  const ipv4 = parseIpv4(address)

  if (ipv4 !== unavailableTitle) {
    return isBlockedIpv4(ipv4)
  }

  const ipv6 = parseIpv6(address)

  return ipv6 !== unavailableTitle && !isGlobalUnicastIpv6(ipv6)
}

function isIpAddress(hostname: string): boolean {
  const address = hostname.replace(/^\[|\]$/g, '')

  return parseIpv4(address) !== unavailableTitle || parseIpv6(address) !== unavailableTitle
}

function isPublicIpAddress(hostname: string): boolean {
  const address = hostname.replace(/^\[|\]$/g, '')
  const ipv4 = parseIpv4(address)

  if (ipv4 !== unavailableTitle) {
    return !isBlockedIpv4(ipv4)
  }

  const ipv6 = parseIpv6(address)

  return ipv6 !== unavailableTitle && isGlobalUnicastIpv6(ipv6)
}

function parseUrl(value: string, base?: URL): URL {
  try {
    return new URL(value, base)
  } catch {
    throw new Error('Invalid URL')
  }
}

function validateUrl(value: string, base?: URL): URL {
  const url = parseUrl(value, base)
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, '')

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid URL')
  }

  if (hostname === 'localhost' || hostname.endsWith('.localhost') || isBlockedIpAddress(hostname)) {
    throw new Error('Invalid URL')
  }

  return url
}

function isRedirect(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308
}

function responseHeader(response: Response, name: string): string | null {
  return response.headers.get(name)
}

function isOversized(contentLength: string | null): boolean {
  return (
    contentLength !== unavailableTitle &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > MAX_BODY_BYTES
  )
}

function isHtml(contentType: string | null): boolean {
  if (contentType === unavailableTitle) {
    return false
  }

  const [mediaType = ''] = contentType.split(';')

  return mediaType.trim().toLowerCase() === 'text/html'
}

async function discardResponse(response: Response): Promise<void> {
  const { body } = response

  if (!body) {
    return
  }

  try {
    await body.cancel()
  } catch {
    // The response was already closed or canceled.
  }
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  try {
    await reader.cancel()
  } catch {
    // The stream is already closed or canceled.
  }
}

function appendBodyChunk(state: BodyState, value: Uint8Array): boolean {
  state.totalBytes += value.byteLength

  if (state.totalBytes > MAX_BODY_BYTES) {
    return false
  }

  if (state.titleBytes < MAX_TITLE_BYTES) {
    const chunk = value.subarray(0, MAX_TITLE_BYTES - state.titleBytes)

    state.chunks.push(chunk)
    state.titleBytes += chunk.byteLength
  }

  return true
}

async function readBodyChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  state: BodyState
): Promise<BodyState | null> {
  try {
    const { done, value } = await reader.read()

    if (done) {
      return state
    }

    if (!appendBodyChunk(state, value)) {
      await cancelReader(reader)

      return unavailableTitle
    }

    return readBodyChunks(reader, state)
  } catch {
    await cancelReader(reader)

    return unavailableTitle
  }
}

function decodeBody(state: BodyState): string {
  const bytes = new Uint8Array(state.titleBytes)
  let offset = 0

  for (const chunk of state.chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(bytes)
}

async function readBody(body: ReadableStream<Uint8Array> | null): Promise<string | null> {
  if (!body) {
    return unavailableTitle
  }

  const reader = body.getReader()
  const state: BodyState = { chunks: [], titleBytes: 0, totalBytes: 0 }

  try {
    const completeBody = await readBodyChunks(reader, state)

    if (completeBody === unavailableTitle) {
      return unavailableTitle
    }

    return decodeBody(completeBody)
  } finally {
    reader.releaseLock()
  }
}

function createTitleCollector(): { rewriter: HTMLRewriter; title: () => string | null } {
  let firstTitleSeen = false
  let collectingTitle = false
  let title = ''
  const rewriter = new HTMLRewriter().on('title', {
    element() {
      collectingTitle = !firstTitleSeen
      firstTitleSeen = true
    },
    text(text) {
      if (collectingTitle) {
        title += text.text
      }

      if (text.lastInTextNode) {
        collectingTitle = false
      }
    }
  })

  return {
    rewriter,
    title() {
      const trimmedTitle = title.trim()

      if (trimmedTitle === '') {
        return unavailableTitle
      }

      return trimmedTitle
    }
  }
}

async function parseTitle(html: string): Promise<string | null> {
  const collector = createTitleCollector()
  const transformed = collector.rewriter.transform(new Response(html))
  const { body } = transformed

  if (!body) {
    return unavailableTitle
  }

  try {
    await body.pipeTo(new WritableStream())

    return collector.title()
  } catch {
    return unavailableTitle
  }
}

async function titleFromResponse(response: Response): Promise<string | null> {
  const contentLength = responseHeader(response, 'content-length')
  const contentType = responseHeader(response, 'content-type')

  if (isOversized(contentLength) || !isHtml(contentType)) {
    await discardResponse(response)

    return unavailableTitle
  }

  const html = await readBody(response.body)

  if (html === unavailableTitle) {
    return unavailableTitle
  }

  return parseTitle(html)
}

function dnsQueryUrl(hostname: string, queryType: DnsQuery['queryType']): URL {
  const url = new URL(DNS_OVER_HTTPS_ENDPOINT)

  url.searchParams.set('name', hostname)
  url.searchParams.set('type', queryType)

  return url
}

function dnsAddresses(body: DnsResponse, recordType: number): string[] {
  if (!body.Answer) {
    return []
  }

  return body.Answer.flatMap((answer) => {
    if (answer.type !== recordType || typeof answer.data !== 'string') {
      return []
    }

    return [answer.data]
  })
}

async function queryDnsOverHttps(query: DnsQuery): Promise<string[] | null> {
  try {
    const response = await fetch(dnsQueryUrl(query.hostname, query.queryType), {
      headers: { accept: 'application/dns-json' },
      signal: query.signal
    })

    if (!response.ok) {
      await discardResponse(response)

      return unavailableTitle
    }

    const body: DnsResponse = await response.json()

    return dnsAddresses(body, query.recordType)
  } catch {
    return unavailableTitle
  }
}

async function resolveHostnameWithDnsOverHttps(
  hostname: string,
  signal: AbortSignal
): Promise<string[] | null> {
  const [ipv4Addresses, ipv6Addresses] = await Promise.all([
    queryDnsOverHttps({ hostname, queryType: 'A', recordType: 1, signal }),
    queryDnsOverHttps({ hostname, queryType: 'AAAA', recordType: 28, signal })
  ])

  if (ipv4Addresses === unavailableTitle || ipv6Addresses === unavailableTitle) {
    return unavailableTitle
  }

  return [...ipv4Addresses, ...ipv6Addresses]
}

async function resolvesToPublicAddresses(
  hostname: string,
  resolveHostname: HostnameResolver,
  signal: AbortSignal
): Promise<boolean> {
  try {
    const addresses = await resolveHostname(hostname.replace(/\.+$/, ''), signal)

    return (
      addresses !== unavailableTitle && addresses.length > 0 && addresses.every(isPublicIpAddress)
    )
  } catch {
    return false
  }
}

async function fetchResponse(url: URL, signal: AbortSignal): Promise<Response | null> {
  try {
    return await fetch(url, { redirect: 'manual', signal })
  } catch {
    return unavailableTitle
  }
}

async function redirectedUrl(response: Response, url: URL, redirects: number): Promise<URL | null> {
  const location = responseHeader(response, 'location')

  await discardResponse(response)

  if (location === unavailableTitle) {
    return unavailableTitle
  }

  const destination = validateUrl(location, url)

  if (redirects >= MAX_REDIRECTS) {
    return unavailableTitle
  }

  return destination
}

async function fetchPublicResponse(context: FetchContext): Promise<Response | null> {
  if (
    !isIpAddress(context.url.hostname) &&
    !(await resolvesToPublicAddresses(
      context.url.hostname,
      context.resolveHostname,
      context.signal
    ))
  ) {
    return unavailableTitle
  }

  return fetchResponse(context.url, context.signal)
}

async function fetchTitleAt(context: FetchContext): Promise<string | null> {
  const response = await fetchPublicResponse(context)

  if (response === unavailableTitle) {
    return unavailableTitle
  }

  if (!isRedirect(response.status)) {
    return titleFromResponse(response)
  }

  const destination = await redirectedUrl(response, context.url, context.redirects)

  if (destination === unavailableTitle) {
    return unavailableTitle
  }

  return fetchTitleAt({
    ...context,
    redirects: context.redirects + 1,
    url: destination
  })
}

export async function fetchPageTitle(
  value: string,
  resolveHostname: HostnameResolver = resolveHostnameWithDnsOverHttps
): Promise<string | null> {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  const title = await fetchTitleAt({
    redirects: 0,
    resolveHostname,
    signal,
    url: validateUrl(value)
  })

  return title
}
