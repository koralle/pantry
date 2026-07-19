import { afterEach, describe, expect, test, vi } from 'vitest'

import { fetchPageTitle } from './title-fetcher.server'

const maxBodyBytes = 1024 * 1024

function expectFetchRequest(fetch: ReturnType<typeof vi.fn>, index: number, url: string) {
  const call = fetch.mock.calls[index]
  const input = call?.[0]
  const init = call?.[1] as RequestInit | undefined

  expect(input == null ? null : String(input)).toBe(url)
  expect(init).toMatchObject({ redirect: 'manual' })
  expect(init?.signal).toBeDefined()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fetchPageTitle', () => {
  test('returns a trimmed title from an HTML response', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response('<html><head><title>  Pantry  </title></head></html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' }
      })
    )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com')).resolves.toBe('Pantry')
    expectFetchRequest(fetch, 0, 'https://example.com/')
  })

  test('uses a three-second timeout for the complete fetch operation', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<title>Pantry</title>', { headers: { 'content-type': 'text/html' } })
        )
    )

    await fetchPageTitle('https://example.com')

    expect(timeout).toHaveBeenCalledWith(3000)
  })

  test('revalidates each manual redirect before fetching it', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: '/destination' }
        })
      )
      .mockResolvedValueOnce(
        new Response('<title>Destination</title>', {
          headers: { 'content-type': 'text/html' }
        })
      )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com/origin')).resolves.toBe('Destination')
    expectFetchRequest(fetch, 0, 'https://example.com/origin')
    expectFetchRequest(fetch, 1, 'https://example.com/destination')
  })

  test('rejects a redirect to an invalid address without fetching it', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/private' }
      })
    )
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com')).rejects.toThrow('Invalid URL')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('stops after three redirects', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/one' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/two' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/three' } }))
      .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: '/four' } }))
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  test.each([
    'not a URL',
    'ftp://example.com',
    'http://localhost',
    'http://localhost.',
    'http://subdomain.localhost',
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://192.168.0.1',
    'http://169.254.1.1',
    'http://100.100.100.200',
    'http://[::1]',
    'http://[fc00::1]',
    'http://[fe80::1]'
  ])('throws a validation error for %s', async (url) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    await expect(fetchPageTitle(url)).rejects.toThrow('Invalid URL')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('returns null for a network or timeout failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')))

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
  })

  test('returns null without parsing a non-HTML response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('<title>Not HTML</title>', {
            headers: { 'content-type': 'application/json' }
          })
        )
    )

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
  })

  test('returns null when an HTML response has no title', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><head></head><body>Pantry</body></html>', {
          headers: { 'content-type': 'text/html' }
        })
      )
    )

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
  })

  test('rejects a response with a known body larger than one megabyte', async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true
      }
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          headers: {
            'content-length': String(maxBodyBytes + 1),
            'content-type': 'text/html'
          }
        })
      )
    )

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
    expect(cancelled).toBe(true)
  })

  test('cancels a streamed HTML response once it exceeds one megabyte', async () => {
    let cancelled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(maxBodyBytes))
        controller.enqueue(new Uint8Array([0]))
      },
      cancel() {
        cancelled = true
      }
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { headers: { 'content-type': 'text/html' } }))
    )

    await expect(fetchPageTitle('https://example.com')).resolves.toBeNull()
    expect(cancelled).toBe(true)
  })
})
