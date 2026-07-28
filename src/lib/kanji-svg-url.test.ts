import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOCAL_KANJI_SVG_BASE_URI,
  kanjiSvgCode,
  localKanjiSvgUrl,
  resolveKanjiSvgBaseUri,
} from "./kanji-svg-url";

function svgResponse(code: string, ok = true): Response {
  return {
    ok,
    text: () =>
      Promise.resolve(
        ok ? `<svg><g id="kvg:${code}"></g></svg>` : "<html>not found</html>"
      ),
  } as Response;
}

describe("kanjiSvgCode", () => {
  it("returns the KanjiVG 5-digit hex stem", () => {
    expect(kanjiSvgCode("一")).toBe("04e00");
    expect(kanjiSvgCode("日")).toBe("065e5");
  });
});

describe("localKanjiSvgUrl", () => {
  it("points at same-origin /svg/, not the CDN", () => {
    expect(LOCAL_KANJI_SVG_BASE_URI).toBe("/svg/");
    expect(localKanjiSvgUrl("一")).toBe("/svg/04e00.svg");
    expect(localKanjiSvgUrl("日")).not.toContain("pikapikagems.com");
    expect(localKanjiSvgUrl("日")).not.toContain("tagaini.net");
  });
});

describe("resolveKanjiSvgBaseUri", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the local base when /svg/ has a valid KanjiVG payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/svg/04e00.svg") return svgResponse("04e00");
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveKanjiSvgBaseUri("一", new AbortController().signal)
    ).resolves.toBe("/svg/");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/svg/04e00.svg",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("does not hit the CDN when the local SVG is valid", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/svg/")) return svgResponse("04e00");
      throw new Error(`CDN should not be fetched: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await resolveKanjiSvgBaseUri("一", new AbortController().signal);

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.every((url) => url.startsWith("/svg/"))).toBe(true);
    expect(urls.some((url) => url.includes("pikapikagems.com"))).toBe(false);
    expect(urls.some((url) => url.includes("tagaini.net"))).toBe(false);
  });

  it("falls back to the CDN when local is missing or invalid", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/svg/")) return svgResponse("04e00", false);
      if (url.includes("/kanji/04e00.svg")) return svgResponse("04e00");
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const baseUri = await resolveKanjiSvgBaseUri(
      "一",
      new AbortController().signal
    );

    expect(baseUri).toMatch(/\/kanji\/$/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe("/svg/04e00.svg");
    expect(String(fetchMock.mock.calls[1][0])).toMatch(/04e00\.svg$/);
  });

  it("rejects SPA-style HTML that lacks the kvg: root, then tries CDN", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith("/svg/")) {
        return {
          ok: true,
          text: () => Promise.resolve("<!doctype html><html></html>"),
        } as Response;
      }
      if (url.includes("/kanji/04e00.svg")) return svgResponse("04e00");
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveKanjiSvgBaseUri("一", new AbortController().signal)
    ).resolves.toMatch(/\/kanji\/$/);
  });

  it("returns null when neither local nor CDN has a valid SVG", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => svgResponse("04e00", false))
    );

    await expect(
      resolveKanjiSvgBaseUri("一", new AbortController().signal)
    ).resolves.toBeNull();
  });
});

describe("committed public/svg set", () => {
  it("covers every kanji_main.json key used by Download Kanji SVGs", () => {
    const main = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "public/json/v2/kanji_main.json"),
        "utf8"
      )
    ) as Record<string, unknown>;
    const svgDir = path.join(process.cwd(), "public/svg");
    const onDisk = new Set(
      fs.readdirSync(svgDir).filter((name) => name.endsWith(".svg"))
    );

    const missing = Object.keys(main)
      .map((kanji) => `${kanjiSvgCode(kanji)}.svg`)
      .filter((name) => !onDisk.has(name));

    expect(missing).toEqual([]);
    expect(onDisk.size).toBe(Object.keys(main).length);
  });
});
