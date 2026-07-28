import { afterEach, describe, expect, it, vi } from "vitest";
import assetsPaths from "@/lib/assets-paths";
import {
  KANJI_SVG_CACHE_NAME,
  clearKanjiSvgCache,
  preloadKanjiSvgs,
} from "./offline-preload";

describe("preloadKanjiSvgs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("warms cache from same-origin /svg/ URLs, never the CDN", async () => {
    const fetched: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      fetched.push(url);

      if (url === assetsPaths.MAIN_KANJI_INFO_FILE_PATH) {
        return {
          ok: true,
          json: () => Promise.resolve({ 一: {}, 日: {}, 人: {} }),
        } as Response;
      }

      if (url.startsWith("/svg/") && url.endsWith(".svg")) {
        return { ok: true, text: () => Promise.resolve("<svg/>") } as Response;
      }

      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const progress: Array<[number, number]> = [];
    const { promise } = preloadKanjiSvgs((done, total) => {
      progress.push([done, total]);
    });
    await promise;

    expect(fetched[0]).toBe(assetsPaths.MAIN_KANJI_INFO_FILE_PATH);

    const svgUrls = fetched.slice(1).sort();
    expect(svgUrls).toEqual([
      "/svg/04e00.svg", // 一
      "/svg/04eba.svg", // 人
      "/svg/065e5.svg", // 日
    ]);

    expect(fetched.every((url) => !url.includes("pikapikagems.com"))).toBe(
      true
    );
    expect(fetched.every((url) => !url.includes("tagaini.net"))).toBe(true);
    expect(fetched.every((url) => !url.includes("/json/svg/"))).toBe(true);

    expect(progress.at(-1)).toEqual([3, 3]);
  });

  it("can cancel before the kanji_main.json response is handled", async () => {
    let resolveMain!: (value: Response) => void;
    const mainPromise = new Promise<Response>((resolve) => {
      resolveMain = resolve;
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === assetsPaths.MAIN_KANJI_INFO_FILE_PATH) return mainPromise;
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { promise, cancel } = preloadKanjiSvgs();
    cancel();
    resolveMain({
      ok: true,
      json: () => Promise.resolve({ 一: {} }),
    } as Response);

    await promise;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("clearKanjiSvgCache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes the shared kanji-svg-cache", async () => {
    const deleteMock = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("caches", { delete: deleteMock });

    await clearKanjiSvgCache();

    expect(KANJI_SVG_CACHE_NAME).toBe("kanji-svg-cache");
    expect(deleteMock).toHaveBeenCalledWith("kanji-svg-cache");
  });
});
