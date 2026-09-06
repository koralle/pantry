import { describe, expect, test, vi } from "vitest";

import { fetchPageTitle } from "./fetch-page-title.server";

describe(fetchPageTitle, () => {
  test("extracts title from HTML", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("<html><head><title>Example title</title></head></html>", {
          headers: { "content-type": "text/html" },
          status: 200,
        })
    );

    await expect(
      fetchPageTitle("https://example.com", fetchMock)
    ).resolves.toStrictEqual({
      kind: "fetched",
      title: "Example title",
    });
  });

  test("rejects private hosts as url-not-allowed", async () => {
    await expect(fetchPageTitle("http://127.0.0.1")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(fetchPageTitle("http://localhost/")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(fetchPageTitle("http://192.168.1.1/")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
  });

  test("rejects IPv4-mapped IPv6 loopback as url-not-allowed", async () => {
    await expect(
      fetchPageTitle("http://[::ffff:127.0.0.1]/")
    ).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(
      fetchPageTitle("http://[::ffff:10.0.0.1]/")
    ).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(fetchPageTitle("http://[::1]/")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
  });

  test("rejects private IPv6 ranges as url-not-allowed", async () => {
    await expect(fetchPageTitle("http://[fc00::1]/")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(
      fetchPageTitle("http://[fd12:3456:789a::1]/")
    ).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
    await expect(fetchPageTitle("http://[fe80::1]/")).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
  });

  test("returns unavailable on network failure", async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error("network down");
    });

    await expect(
      fetchPageTitle("https://offline.example", failingFetch)
    ).resolves.toStrictEqual({
      kind: "unavailable",
    });
  });

  test("follows limited redirects and validates each hop", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://example.com/start") {
        return new Response(null, {
          headers: { location: "https://example.com/final" },
          status: 302,
        });
      }
      return new Response("<title>Final</title>", {
        headers: { "content-type": "text/html; charset=utf-8" },
        status: 200,
      });
    });

    await expect(
      fetchPageTitle("https://example.com/start", fetchMock)
    ).resolves.toStrictEqual({
      kind: "fetched",
      title: "Final",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("rejects redirect to private host as url-not-allowed", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          headers: { location: "http://127.0.0.1/secret" },
          status: 302,
        })
    );

    await expect(
      fetchPageTitle("https://example.com/start", fetchMock)
    ).resolves.toStrictEqual({
      kind: "url-not-allowed",
    });
  });

  test("non-ok status is unavailable", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("<title>gone</title>", {
          headers: { "content-type": "text/html" },
          status: 404,
        })
    );

    await expect(
      fetchPageTitle("https://example.com/missing", fetchMock)
    ).resolves.toStrictEqual({
      kind: "unavailable",
    });
  });

  test("unsupported content type is unavailable", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response('{"title":"json"}', {
          headers: { "content-type": "application/json" },
          status: 200,
        })
    );

    await expect(
      fetchPageTitle("https://example.com/api", fetchMock)
    ).resolves.toStrictEqual({
      kind: "unavailable",
    });
  });

  test("page without title is unavailable", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("<html><body>no title here</body></html>", {
          headers: { "content-type": "text/html" },
          status: 200,
        })
    );

    await expect(
      fetchPageTitle("https://example.com", fetchMock)
    ).resolves.toStrictEqual({
      kind: "unavailable",
    });
  });
});
