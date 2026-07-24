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

/** Records which datasets the worker actually fetched, in order. */
const fetched: string[] = [];

// Every dataset now comes from the generated v2 directory.
const V2_FILES = [
  "kanji_main.json",
  "kanji_extended_general.json",
  "kanji_extended_hover.json",
  "components.json",
  "vocab.json",
  "kanji_decomposition.json",
  "similar_kanjis.json",
];

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
    const file = V2_FILES.find((name) => input === `/json/v2/${name}`);
    if (file == null) {
      return Promise.reject(new Error(`unexpected fetch: ${input}`));
    }
    fetched.push(file);
    return Promise.resolve({
      ok: true,
      json: () => JSON.parse(readFile("public", "json", "v2", file)),
    });
  });

  vi.spyOn(self, "postMessage").mockImplementation(((
    message: PostMessageResponseType
  ) => {
    posted.push(message);
  }) as typeof self.postMessage);

  // Silence the worker's own error logging; the assertions read `posted`.
  vi.spyOn(console, "error").mockImplementation(() => {});

  await import("./kanji-worker");
  await settle();
});

afterEach(() => {
  posted.length = 0;
});

describe("lazy datasets", () => {
  it("fetches nothing but the main info until a request needs more", () => {
    // The worker starts loading kanji_main at module load; everything else
    // waits for a request that actually reads it.
    expect(fetched).toEqual(["kanji_main.json"]);
  });

  it("fetches the components file only when the snapshot is requested", async () => {
    send(2, "init");
    await settle();

    expect(fetched).toContain("components.json");
    expect(fetched).not.toContain("vocab.json");
    expect(fetched).not.toContain("kanji_extended_hover.json");
  });

  it("fetches hover datasets only on the first hover request", async () => {
    expect(fetched).not.toContain("kanji_extended_hover.json");

    send(3, "kanji-hover", "五");
    await settle();

    expect(fetched).toContain("kanji_extended_hover.json");
    expect(fetched).toContain("vocab.json");
  });

  it("does not refetch a dataset it already has", async () => {
    const before = fetched.filter((f) => f === "kanji_extended_hover.json");

    send(4, "kanji-hover", "六");
    await settle();

    expect(
      fetched.filter((f) => f === "kanji_extended_hover.json")
    ).toHaveLength(before.length);
  });

  it("does not need the meanings file for a non-text search", async () => {
    expect(fetched).not.toContain("kanji_extended_general.json");

    send(5, "search-result-count", {
      textSearch: { type: "keyword", text: "" },
      filterSettings: {
        strokeRange: { min: 1, max: 99 },
        jlpt: [],
        jouyouGrade: [],
        freq: { source: "none", rankRange: { min: 1, max: 99999 } },
        bookmarkedOnly: false,
        withAnchorWordsOnly: false,
      },
      sortSettings: { primary: "strokes", secondary: "none" },
    });
    await settle();

    expect(replyFor(5)?.response.status).toBe("COMPLETED");
    expect(fetched).not.toContain("kanji_extended_general.json");
  });
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
    send(50, "kanji-hover", "🐟"); // not a kanji we have data for
    send(51, "kanji-hover", "一");
    await settle();

    expect(replyFor(50)?.response.status).toBe("ERRORED");
    expect(replyFor(50)?.response.error?.message).toContain(
      "No information about this Kanji"
    );
    expect(replyFor(51)?.response.status).toBe("COMPLETED");
  });

  it("names the failing request in the error message", async () => {
    send(60, "kanji-hover", "🐟");
    await settle();

    expect(replyFor(60)?.response.error?.message).toContain(
      "request:kanji-hover failed"
    );
  });
});

describe("data handlers", () => {
  it("hands the main thread the snapshot it renders from", async () => {
    send(70, "init");
    await settle();

    const data = replyFor(70)?.response.data as {
      mainInfoMap: Record<string, unknown>;
      componentsMap: Record<string, { k?: string; s?: string[] }>;
    };
    expect(Object.keys(data.mainInfoMap)).toHaveLength(2426);
    expect(data.mainInfoMap["一"]).toMatchObject({
      keyword: "one",
      jlpt: "n5",
      strokes: 1,
      repWord: "一",
    });
    expect(data.componentsMap["𠦝"].s).toEqual(["ちょう", "かん"]);
  });

  it("assembles a hover payload with its sample vocabulary", async () => {
    send(90, "kanji-hover", "一");
    await settle();

    const data = replyFor(90)?.response.data as {
      keyword: string;
      mainVocab: { first: { word: string; meaning: string } };
    };
    expect(data.keyword).toBe("one");
    expect(data.mainVocab.first.word).toBe("一つ");
    expect(data.mainVocab.first.meaning).toContain("one");
  });

  it("assembles a general payload with katakana onyomi", async () => {
    send(95, "kanji-general", "朝");
    await settle();

    const data = replyFor(95)?.response.data as {
      allOn: string[];
      meanings: string[];
      jlpt: string;
    };
    expect(data.allOn).toEqual(["チョウ"]);
    expect(data.meanings).toContain("morning");
    expect(data.jlpt).toBe("n4");
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
