import { describe, expect, test, vi } from 'vitest'

import { fetchPageTitle } from './title-fetcher.server'

describe('fetchPageTitle', () => {
  test('extracts title from HTML', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('<html><head><title>Example title</title></head></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' }
        })
    )

    expect(await fetchPageTitle('https://example.com', fetchMock)).toBe('Example title')
  })

  test('rejects private hosts', async () => {
    await expect(fetchPageTitle('http://127.0.0.1')).rejects.toThrow('URL is not allowed')
    await expect(fetchPageTitle('http://localhost/')).rejects.toThrow('URL is not allowed')
    await expect(fetchPageTitle('http://192.168.1.1/')).rejects.toThrow('URL is not allowed')
  })

  test('returns null on network failure', async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error('network down')
    })

    expect(await fetchPageTitle('https://offline.example', failingFetch)).toBeNull()
  })

  test('follows limited redirects and validates each hop', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === 'https://example.com/start') {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://example.com/final' }
        })
      }
      return new Response('<title>Final</title>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' }
      })
    })

    expect(await fetchPageTitle('https://example.com/start', fetchMock)).toBe('Final')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('rejects redirect to private host', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'http://127.0.0.1/secret' }
        })
    )

    await expect(fetchPageTitle('https://example.com/start', fetchMock)).rejects.toThrow(
      'URL is not allowed'
    )
  })
})
