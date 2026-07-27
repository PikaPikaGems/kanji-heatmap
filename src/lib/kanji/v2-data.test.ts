import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { decodeFurigana, WordPartDetail } from "@/lib/furigana";

/**
 * Parity tests for scripts/generate-v2-json.mjs.
 *
 * The generator reshapes every file the app fetches. Nothing in the UI can
 * tell us a field was dropped, renamed or reordered along the way — a hover
 * card just renders blank. So each generated file is compared field by field
 * against the raw source it was built from, for every entry, not a sample.
 */

const readJson = <T>(...segments: string[]): T =>
  JSON.parse(
    fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")
  ) as T;

const raw = <T>(name: string) => readJson<T>("raw-data", name);
const v2 = <T>(name: string) => readJson<T>("public", "json", "v2", name);

type FreqList = number[];
type V1MainEntry = [string, string, string, number, FreqList];
type V1ExtendedEntry = [
  string[], // parts
  number, // strokes
  number, // rtk (old)
  number, // wk
  number, // jouyou grade
  string[], // meanings
  string[], // allOn
  string[], // allKun
  string, // phonetic
  string[], // mainVocab
  number, // kklc
  number, // rtk
];
type V1RepEntry = [string, string, string, string] | null;

const v1Main = raw<Record<string, V1MainEntry>>("kanji_main.json");
const v1Extended = raw<Record<string, V1ExtendedEntry>>("kanji_extended.json");
const v1Rep = raw<Record<string, V1RepEntry>>(
  "kanji_representative_words.json"
);
const v1ComponentKeywords = raw<Record<string, string>>(
  "component_keyword.json"
);
const v1Phonetic = raw<Record<string, string[]>>("phonetic.json");
const v1Furigana = raw<Record<string, WordPartDetail[]>>("vocab_furigana.json");
const v1Meaning = raw<Record<string, string>>("vocab_meaning.json");
const v1Radicals = raw<{
  radicalsGroupedByStrokeCount: Record<string, string[]>;
  moreRadicalKeywords: Record<string, string>;
  nonRadicalVariantKeywords: Record<string, string>;
  radicalFalseFriends: Record<string, string>;
}>("radicals.json");

type V2MainEntry = [
  string,
  string,
  string,
  number,
  FreqList,
  number,
  number,
  number,
  number,
  number,
  string | null,
  string | null,
];
type ComponentEntry = { k?: string; s?: string[]; n?: number };

const main = v2<Record<string, V2MainEntry>>("kanji_main.json");
const general = v2<Record<string, [string[], string[], string[]]>>(
  "kanji_extended_general.json"
);
const hover = v2<Record<string, [string[], string, string[]]>>(
  "kanji_extended_hover.json"
);
const repDetails = v2<Record<string, [string, string]>>(
  "rep_word_details.json"
);
const vocab = v2<Record<string, [string, string]>>("vocab.json");
const components = v2<Record<string, ComponentEntry>>("components.json");
const structures = v2<
  Record<string, { hl?: unknown; ka?: unknown; sc?: unknown; ya?: unknown }>
>("kanji_structures.json");

const kanjiList = Object.keys(v1Main);

describe("kanji_main.json", () => {
  it("covers exactly the v1 kanji set", () => {
    expect(Object.keys(main).sort()).toEqual(kanjiList.sort());
    expect(kanjiList).toHaveLength(2426);
  });

  it("preserves keyword, readings, jlpt and every frequency rank", () => {
    for (const kanji of kanjiList) {
      const [keyword, on, kun, jlpt, freq] = v1Main[kanji];
      const entry = main[kanji];

      expect(entry.slice(0, 4), kanji).toEqual([keyword, on, kun, jlpt]);
      expect(entry[4], kanji).toEqual(freq);
    }
  });

  it("carries the five sort/filter fields over from kanji_extended", () => {
    for (const kanji of kanjiList) {
      const source = v1Extended[kanji];
      // v1 slots: 1 strokes, 3 wk, 4 jouyouGrade, 10 kklc, 11 rtk
      expect(main[kanji].slice(5, 10), kanji).toEqual([
        source[1],
        source[4],
        source[3],
        source[10],
        source[11],
      ]);
    }
  });

  it("carries the representative word and reading, null when absent", () => {
    let withRepWord = 0;
    let withoutRepWord = 0;

    for (const kanji of kanjiList) {
      const rep = v1Rep[kanji];
      const [word, reading] = main[kanji].slice(10);

      if (rep == null) {
        expect([word, reading], kanji).toEqual([null, null]);
        withoutRepWord += 1;
      } else {
        expect([word, reading], kanji).toEqual([rep[0], rep[1]]);
        withRepWord += 1;
      }
    }

    expect(withoutRepWord).toBe(78);
    expect(withRepWord).toBe(kanjiList.length - 78);
  });

  it("gives every entry the full 12 slots", () => {
    for (const kanji of kanjiList) {
      expect(main[kanji], kanji).toHaveLength(12);
    }
  });

  it("answers every sort field with a number, so sorting never needs a lazy file", () => {
    for (const kanji of kanjiList) {
      for (const slot of [5, 6, 7, 8, 9]) {
        expect(typeof main[kanji][slot], `${kanji} slot ${slot}`).toBe(
          "number"
        );
      }
    }
  });
});

describe("kanji_extended_general.json / kanji_extended_hover.json", () => {
  it("together reproduce every field the app reads from v1 extended", () => {
    for (const kanji of kanjiList) {
      const source = v1Extended[kanji];

      expect(general[kanji], kanji).toEqual([source[5], source[6], source[7]]);
      expect(hover[kanji], kanji).toEqual([
        source[0],
        // The source is inconsistent here: most kanji without a phonetic
        // component store "", a few store []. Both mean "none" and both
        // normalise to "".
        typeof source[8] === "string" ? source[8] : "",
        source[9],
      ]);
    }
  });

  it("drops the two dead fields and nothing else", () => {
    // _rtk_old (slot 2) was already discarded by the v1 transform, and rtkb
    // (slot 11 of the tuple type) never reached a runtime payload. Everything
    // else must live in main, general or hover.
    for (const kanji of kanjiList.slice(0, 200)) {
      const combined = [
        ...main[kanji].slice(5, 10),
        ...general[kanji].flat(),
        ...hover[kanji][0],
        hover[kanji][1],
        ...hover[kanji][2],
      ];
      expect(combined.length, kanji).toBeGreaterThan(0);
    }
  });

  it("uses an empty string for kanji with no phonetic component", () => {
    const withoutPhonetic = kanjiList.filter(
      (kanji) => (v1Extended[kanji][8] ?? "").length === 0
    );

    expect(withoutPhonetic.length).toBeGreaterThan(0);
    for (const kanji of withoutPhonetic) {
      expect(hover[kanji][1], kanji).toBe("");
    }
  });
});

describe("rep_word_details.json", () => {
  it("holds gloss and emoji tag for every kanji that has a representative word", () => {
    const expected = Object.entries(v1Rep).filter(([, entry]) => entry != null);

    expect(Object.keys(repDetails)).toHaveLength(expected.length);

    for (const [kanji, entry] of expected) {
      expect(repDetails[kanji], kanji).toEqual([entry![2], entry![3]]);
    }
  });

  it("omits kanji without a representative word", () => {
    for (const [kanji, entry] of Object.entries(v1Rep)) {
      if (entry == null) expect(repDetails[kanji], kanji).toBeUndefined();
    }
  });
});

describe("vocab.json", () => {
  it("covers every word from the two source files", () => {
    expect(Object.keys(vocab).sort()).toEqual(Object.keys(v1Furigana).sort());
  });

  it("decodes back to the exact v1 furigana segments for every word", () => {
    const failures: string[] = [];

    for (const [word, parts] of Object.entries(v1Furigana)) {
      const expected = parts.map((part) =>
        part[1] != null ? [part[0], part[1]] : [part[0]]
      );
      const actual = decodeFurigana(vocab[word][0]);

      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        failures.push(word);
      }
    }

    expect(failures).toEqual([]);
  });

  it("keeps each meaning verbatim", () => {
    for (const word of Object.keys(v1Furigana)) {
      expect(vocab[word][1], word).toBe(v1Meaning[word] ?? "");
    }
  });
});

describe("components.json", () => {
  it("keeps every component_keyword entry that is not itself a kanji", () => {
    for (const [char, keyword] of Object.entries(v1ComponentKeywords)) {
      if (main[char] != null) continue; // covered by the de-duplication test
      expect(components[char]?.k, char).toBe(keyword);
    }
  });

  it("drops the handful of component keywords that describe a kanji", () => {
    const kanjiEntries = Object.keys(v1ComponentKeywords).filter(
      (char) => main[char] != null
    );

    expect(kanjiEntries.length).toBeGreaterThan(0);
    for (const char of kanjiEntries) {
      // Unreachable at runtime: every lookup reads kanji_main first.
      expect(components[char]?.k, char).toBeUndefined();
      expect(main[char][0], char).toBeTruthy();
    }
  });

  it("keeps every hand-maintained radical keyword", () => {
    for (const [char, keyword] of Object.entries(
      v1Radicals.moreRadicalKeywords
    )) {
      expect(components[char]?.k, char).toBe(keyword);
    }
    for (const [char, keyword] of Object.entries(
      v1Radicals.nonRadicalVariantKeywords
    )) {
      expect(components[char]?.k, char).toBe(keyword);
    }
  });

  it("keeps every phonetic sound list", () => {
    for (const [char, sounds] of Object.entries(v1Phonetic)) {
      expect(components[char]?.s, char).toEqual(sounds);
    }
  });

  it("records the stroke count of every drawer radical", () => {
    for (const [strokes, list] of Object.entries(
      v1Radicals.radicalsGroupedByStrokeCount
    )) {
      for (const char of list) {
        expect(components[char]?.n, char).toBe(Number(strokes));
      }
    }
  });

  it("gives a component with its own keyword precedence over its alias", () => {
    // 罒 aliases ⺲, but both carry a keyword from different sources. The
    // character's own entry must win — aliases only fill gaps.
    expect(components["罒"]?.k).toBe(v1ComponentKeywords["罒"]);
    expect(components["⺲"]?.k).toBe(v1Radicals.moreRadicalKeywords["⺲"]);
    expect(components["罒"]?.k).not.toBe(components["⺲"]?.k);
  });

  it("fills a keywordless lookalike from its alias", () => {
    // 艹 has no keyword of its own. It previously mapped to " ⺾" (leading
    // space) and so resolved to nothing at all; now it inherits ⺾'s keyword.
    expect(v1ComponentKeywords["艹"]).toBeUndefined();
    expect(components["艹"]?.k).toBe(components["⺾"]?.k);
    expect(components["艹"]?.k).toBe("grass variant");
  });

  it("stops an alias chain at the first hop that has a keyword", () => {
    // ⺕ -> 彐 -> ヨ. 彐 ("pig snout") is a closer answer for ⺕ than ヨ
    // ("katakana yo") at the end of the chain.
    expect(components["彐"]?.k).toBe("pig snout");
    expect(components["ヨ"]?.k).toBe("katakana yo");
    expect(components["⺕"]?.k).toBe("pig snout");
  });

  it("never stores an empty or untrimmed keyword", () => {
    for (const [char, entry] of Object.entries(components)) {
      if (entry.k == null) continue;
      expect(entry.k, char).toBe(entry.k.trim());
      expect(entry.k.length, char).toBeGreaterThan(0);
    }
  });

  it("does not duplicate kanji keywords that kanji_main already provides", () => {
    for (const char of Object.keys(components)) {
      if (main[char] != null) {
        expect(components[char].k, char).toBeUndefined();
      }
    }
  });
});

describe("kanji_structures.json", () => {
  const sources = {
    hl: raw<Record<string, unknown>>("kanji-structure-hlorenzi.json"),
    ka: raw<Record<string, unknown>>("kanji-structure-kanjium.json"),
    sc: raw<Record<string, unknown>>("kanji-structure-scott.json"),
    ya: raw<Record<string, unknown>>("kanji-structure-yagays.json"),
  };

  it("reproduces each source's value verbatim under its short key", () => {
    for (const [key, source] of Object.entries(sources)) {
      for (const [kanji, value] of Object.entries(source)) {
        expect(
          structures[kanji]?.[key as keyof (typeof structures)[string]],
          `${key} ${kanji}`
        ).toEqual(value);
      }
    }
  });

  it("omits keys for sources that have no entry, rather than storing null", () => {
    for (const [kanji, entry] of Object.entries(structures)) {
      for (const [key, source] of Object.entries(sources)) {
        if (source[kanji] == null) {
          expect(key in entry, `${key} ${kanji}`).toBe(false);
        }
      }
      expect(Object.keys(entry).length, kanji).toBeGreaterThan(0);
    }
  });

  it("covers the union of all four sources", () => {
    const union = new Set(Object.values(sources).flatMap(Object.keys));
    expect(Object.keys(structures).sort()).toEqual([...union].sort());
  });
});

describe("pass-through files", () => {
  it("are byte-identical in content to their v1 sources", () => {
    expect(v2("kanji_decomposition.json")).toEqual(
      raw("kanji_decomposition.json")
    );
    expect(v2("similar_kanjis.json")).toEqual(raw("similar-kanjis.json"));
    expect(v2("kanji_reading_details.json")).toEqual(
      raw("kanji-readings-details.json")
    );
    expect(v2("cum_use.json")).toEqual(raw("cum_use.json"));
  });
});

describe("component coverage report", () => {
  const report = readJson<{
    summary: { referenced: number; withKeyword: number; missing: number };
    missing: { char: string; refs: number; sources: string[] }[];
  }>("docs", "data", "component-coverage.json");

  it("adds up", () => {
    expect(report.summary.withKeyword + report.summary.missing).toBe(
      report.summary.referenced
    );
    expect(report.missing).toHaveLength(report.summary.missing);
  });

  it("lists only components that really have no keyword", () => {
    for (const { char } of report.missing) {
      expect(components[char]?.k, char).toBeUndefined();
    }
  });

  it("excludes kanji and layout operators", () => {
    for (const { char } of report.missing) {
      expect(main[char], char).toBeUndefined();
      const code = char.codePointAt(0)!;
      // ⿰ ⿱ ⿸ … describe layout, not components.
      expect(code < 0x2ff0 || code > 0x2fff, char).toBe(true);
    }
  });

  it("is ordered by reference count so the worklist is prioritised", () => {
    const refs = report.missing.map((entry) => entry.refs);
    expect(refs).toEqual([...refs].sort((a, b) => b - a));
  });

  it("does not regress past the known gap count", () => {
    // Ratchet: filling gaps in components_manual_overrides.json lowers this,
    // a bad data drop raises it. Lower the number when you improve coverage.
    expect(report.summary.missing).toBeLessThanOrEqual(391);
  });
});
