import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { PostMessageResponseType } from "@/lib/kanji/kanji-worker-types";

/**
 * Exercises the worker's message dispatch: the reply envelope, error handling
 * and request isolation. The worker module installs `self.onmessage` when it
 * is imported, so the test drives it exactly as the browser would.
 *
 * Fetches are served from raw-data so the handlers work on real data.
 */

const posted: PostMessageResponseType[] = [];

const readFile = (...segments: string[]) =>
  fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");

const rawFile = (name: string) => readFile("raw-data", name);

// Maps the paths in assets-paths.ts onto the files that back them. Main info
// is served from the generated v2 file; the rest still come from raw-data.
const FILE_BY_PATH: Record<string, string> = {
  "/json/kanji_extended.json": "kanji_extended.json",
  "/json/phonetic.json": "phonetic.json",
  "/json/component_keyword.json": "component_keyword.json",
  "/json/vocab_furigana.json": "vocab_furigana.json",
  "/json/vocab_meaning.json": "vocab_meaning.json",
  "/json/kanji_decomposition.json": "kanji_decomposition.json",
  "/json/similar-kanjis.json": "similar-kanjis.json",
};

const send = (id: number, type: string, payload?: unknown) => {
  (self.onmessage as (event: { data: unknown }) => void)({
    data: { id, data: { type, payload } },
  });
};

/** Resolves once every pending microtask/fetch chain has settled. */
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

const replyFor = (id: number) => posted.find((message) => message.id === id);

beforeAll(async () => {
  vi.stubGlobal("fetch", (input: string) => {
    if (input === "/json/v2/kanji_main.json") {
      return Promise.resolve({
        ok: true,
        json: () =>
          JSON.parse(readFile("public", "json", "v2", "kanji_main.json")),
      });
    }
    const file = FILE_BY_PATH[input];
    if (file == null) {
      return Promise.reject(new Error(`unexpected fetch: ${input}`));
    }
    return Promise.resolve({ ok: true, json: () => JSON.parse(rawFile(file)) });
  });

  vi.spyOn(self, "postMessage").mockImplementation(((
    message: PostMessageResponseType
  ) => {
    posted.push(message);
  }) as typeof self.postMessage);

  // Silence the worker's own error logging; the assertions read `posted`.
  vi.spyOn(console, "error").mockImplementation(() => {});

  await import("./kanji-worker");

  // Populate the caches the search/extended handlers need.
  send(1, "kanji-main-map");
  send(2, "initialize-extended-kanji-map");
  send(3, "initialize-segmented-vocab-map");
  await settle();
});

afterEach(() => {
  posted.length = 0;
});

describe("reply envelope", () => {
  it("answers a successful request with COMPLETED and the handler's data", async () => {
    send(10, "retrieve-vocab-info", "一つ");
    await settle();

    expect(replyFor(10)?.response).toMatchObject({
      requestType: "retrieve-vocab-info",
      status: "COMPLETED",
    });
    expect(replyFor(10)?.response.data).toMatchObject({ word: "一つ" });
  });

  it("echoes the request id so out-of-order replies can be matched up", async () => {
    send(21, "retrieve-vocab-info", "一つ");
    send(22, "retrieve-vocab-info", "一万");
    await settle();

    expect(replyFor(21)?.response.data).toMatchObject({ word: "一つ" });
    expect(replyFor(22)?.response.data).toMatchObject({ word: "一万" });
  });

  it("answers an unknown request type with ERRORED rather than silence", async () => {
    send(30, "not-a-real-request", "payload");
    await settle();

    expect(replyFor(30)?.response.status).toBe("ERRORED");
    expect(replyFor(30)?.response.error?.message).toContain("Not implemented");
  });

  it("reports a missing payload instead of throwing", async () => {
    send(40, "kanji-similar");
    await settle();

    expect(replyFor(40)?.response.status).toBe("ERRORED");
    expect(replyFor(40)?.response.error?.message).toContain(
      "One of them is missing"
    );
  });
});

describe("handler errors", () => {
  it("fails only the offending request and keeps serving the next one", async () => {
    send(50, "kanji-extended", "🐟"); // not a kanji in the cache
    send(51, "kanji-extended", "一");
    await settle();

    expect(replyFor(50)?.response.status).toBe("ERRORED");
    expect(replyFor(50)?.response.error?.message).toContain(
      "No Kanji Info On Extended Cache"
    );
    expect(replyFor(51)?.response.status).toBe("COMPLETED");
  });

  it("names the failing request in the error message", async () => {
    send(60, "kanji-extended", "🐟");
    await settle();

    expect(replyFor(60)?.response.error?.message).toContain(
      "request:kanji-extended failed"
    );
  });
});

describe("data handlers", () => {
  it("returns the main info map keyed by kanji", async () => {
    send(70, "kanji-main-map");
    await settle();

    const data = replyFor(70)?.response.data as Record<string, unknown>;
    expect(Object.keys(data)).toHaveLength(2426);
    expect(data["一"]).toMatchObject({ keyword: "one", jlpt: "n5" });
  });

  it("returns phonetic sounds as arrays", async () => {
    send(80, "phonetic-map");
    await settle();

    const data = replyFor(80)?.response.data as Record<string, string[]>;
    expect(data["𠦝"]).toEqual(["ちょう", "かん"]);
  });

  it("assembles extended info with its sample vocabulary", async () => {
    send(90, "kanji-extended", "一");
    await settle();

    const data = replyFor(90)?.response.data as {
      vocabInfo: { first: { word: string } | null };
      meanings: string[];
    };
    expect(data.meanings).toContain("one");
    expect(data.vocabInfo.first?.word).toBe("一つ");
  });

  it("returns null vocab info for an unknown word", async () => {
    send(100, "retrieve-vocab-info", "not-a-word");
    await settle();

    expect(replyFor(100)?.response.data).toBeNull();
  });

  it("filters similar kanji down to ones the app knows", async () => {
    send(110, "kanji-similar", "五");
    await settle();

    const data = replyFor(110)?.response.data as string[];
    expect(data.length).toBeGreaterThan(0);
    expect(data).toContain("玉");
  });

  const searchSettings = (text: string) => ({
    textSearch: { type: "keyword" as const, text },
    filterSettings: {
      strokeRange: { min: 1, max: 99 },
      jlpt: [],
      jouyouGrade: [],
      freq: { source: "none" as const, rankRange: { min: 1, max: 99999 } },
      bookmarkedOnly: false,
      withAnchorWordsOnly: false,
    },
    sortSettings: { primary: "none" as const, secondary: "none" as const },
  });

  it("counts every kanji when the search is unrestricted", async () => {
    send(120, "search-result-count", searchSettings(""));
    await settle();

    expect(replyFor(120)?.response.status).toBe("COMPLETED");
    expect(replyFor(120)?.response.data).toBe(2426);
  });

  it("sorts by every sort key using only the main info", async () => {
    // The whole point of moving strokes/grade/wk/kklc/rtk into kanji_main is
    // that a URL-driven sort works at first paint without the extended file.
    for (const primary of ["strokes", "grade", "wk-level", "rtk-index"]) {
      posted.length = 0;
      send(200, "search", {
        ...searchSettings(""),
        sortSettings: { primary, secondary: "none" },
      });
      await settle();

      expect(replyFor(200)?.response.status, primary).toBe("COMPLETED");
      const { kanjis } = replyFor(200)?.response.data as { kanjis: string[] };
      expect(kanjis, primary).toHaveLength(2426);
    }
  });

  it("orders a stroke-count sort ascending", async () => {
    send(210, "search", {
      ...searchSettings(""),
      sortSettings: { primary: "strokes", secondary: "none" },
    });
    await settle();

    const { kanjis } = replyFor(210)?.response.data as { kanjis: string[] };
    const main = JSON.parse(
      readFile("public", "json", "v2", "kanji_main.json")
    ) as Record<string, [string, string, string, number, number[], number]>;
    const strokes = kanjis.slice(0, 50).map((kanji) => main[kanji][5]);

    expect(strokes).toEqual([...strokes].sort((a, b) => a - b));
  });

  it("runs a keyword search and returns the matching kanji", async () => {
    send(130, "search", searchSettings("water"));
    await settle();

    expect(replyFor(130)?.response.status).toBe("COMPLETED");
    const data = replyFor(130)?.response.data as { kanjis: string[] };
    expect(data.kanjis).toContain("水");
  });
});
