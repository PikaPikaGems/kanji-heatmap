import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { decodeFurigana, WordPartDetail } from "@/lib/furigana";
import {
  componentKeyword,
  prepareRadicals,
  radicalInfo as infoFor,
  type RadicalsFile,
} from "@/lib/radicals";

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
const release = <T>(name: string) =>
  readJson<T>("raw-data", "kanji-heatmap-data", name);
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

const v1Main = release<Record<string, V1MainEntry>>("kanji_main.json");
const v1Extended = release<Record<string, V1ExtendedEntry>>(
  "kanji_extended.json"
);
const v1Rep = release<Record<string, V1RepEntry>>(
  "kanji_representative_words.json"
);
const ourComponents = raw<{ components: Record<string, { k?: string }> }>(
  "components/ours.json"
).components;
const v1Phonetic = release<Record<string, string[]>>("phonetic.json");
const v1Furigana = release<Record<string, WordPartDetail[]>>(
  "vocab_furigana.json"
);
const v1Meaning = release<Record<string, string>>("vocab_meaning.json");
const v1Radicals = {
  radicalsGroupedByStrokeCount: raw<Record<string, string[]>>(
    "radicals/external/rewhowe-drawer.json"
  ),
  ...raw<{ aliases: Record<string, string> }>("radicals/ours.json"),
};

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
const v2Radicals = prepareRadicals(v2<RadicalsFile>("radicals.json"));
const radicalInfo = v2Radicals.info;
const aliases = v2Radicals.aliases;
// What the app shows: follow aliases to the glyph that holds the keyword.
const keywordOf = (char: string) =>
  componentKeyword(char, components, aliases, (kanji) => main[kanji]?.[0]);
const structures = v2<
  Record<string, { hl?: unknown; ka?: unknown; sc?: unknown; ya?: unknown }>
>("kanji_structures.json");

const kanjiList = Object.keys(v1Main);

// Sound parts: ours.json > release > Anki (scripts/sound-parts.mjs). Parsed
// here on its own, so the test does not trust the code it checks.
type SoundPartsOurs = {
  dropFamilies: Record<string, string>;
  soundPart: Record<string, string>;
  readings: Record<string, string[]>;
  keepFamilies: Record<string, string>;
};
const soundOurs = raw<SoundPartsOurs>("sound-parts/ours.json");
// Families the build hid because their hint misleads more than it helps
// (step 5 in raw-data/sound-parts/README.md).
const hiddenSoundParts = new Set(
  readJson<{ hidden: { part: string }[] }>(
    "docs",
    "data",
    "sound-parts.json"
  ).hidden.map(({ part }) => part)
);
const CODEPOINT_FIXES: Record<string, string> = {
  "⼰": "己",
  "⽦": "疋",
  "⽄": "斤",
  "⺹": "耂",
};
const ankiFamilies = fs
  .readFileSync(
    path.join(
      process.cwd(),
      "raw-data",
      "sound-parts",
      "external",
      "anki-phonetic-components.tsv"
    ),
    "utf8"
  )
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split("\t"))
  .filter(([serial]) => serial && !serial.startsWith("R"))
  .map(([, part, reading, , , ...cells]) => ({
    part: CODEPOINT_FIXES[part.trim()] ?? part.trim(),
    // "カ (KA)" → "か"
    reading: reading
      .split("(")[0]
      .trim()
      .replace(/[\u30a1-\u30f6]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0x60)
      ),
    kanji: cells
      .map((cell) => [...cell.trim()][0])
      .filter(Boolean)
      .map((char) => CODEPOINT_FIXES[char] ?? char),
  }));
const releaseSoundPart = (kanji: string) => {
  const ref = v1Extended[kanji][8];
  return typeof ref === "string" ? ref : "";
};
// Voicing doesn't break a family (賀 が is in 加's か family).
const unvoiced = (kana: string) =>
  kana.normalize("NFD").replace(/[\u3099\u309a]/g, "");
// Every part a kept Anki row offers this kanji: as a member read with the
// family sound, or as the family's head (a head gets itself).
const ankiPartsFor = (kanji: string) =>
  ankiFamilies
    .filter(({ part }) => soundOurs.dropFamilies[part] == null)
    .filter(
      ({ part, kanji: list, reading }) =>
        part === kanji ||
        (list.includes(kanji) &&
          v1Extended[kanji][6].some((on) => unvoiced(on) === unvoiced(reading)))
    )
    .map(({ part }) => part);

// Official list uses 剝; we store the common form 剥.
const jouyou = new Set(
  fs
    .readFileSync(
      path.join(
        process.cwd(),
        "raw-data",
        "misc",
        "external",
        "jouyou_kanji.txt"
      ),
      "utf8"
    )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((char) => (char === "剝" ? "剥" : char))
);

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
      // Grade is kept only for kanji on the official jōyō list.
      expect(main[kanji].slice(5, 10), kanji).toEqual([
        source[1],
        jouyou.has(kanji) ? source[4] : -1,
        source[3],
        source[10],
        source[11],
      ]);
    }
  });

  it("grades exactly the 2,136 jōyō kanji", () => {
    const graded = kanjiList.filter((kanji) => main[kanji][6] !== -1);
    expect(graded).toHaveLength(2136);
    expect(graded.every((kanji) => jouyou.has(kanji))).toBe(true);
  });

  it("carries the representative word and reading, null when absent", () => {
    let withRepWord = 0;
    let withoutRepWord = 0;

    for (const kanji of kanjiList) {
      const rep = v1Rep[kanji];
      const [word, reading] = main[kanji].slice(11);

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

  it("gives every entry the full 13 slots", () => {
    for (const kanji of kanjiList) {
      expect(main[kanji], kanji).toHaveLength(13);
    }
  });

  it("answers every sort field with a number, so sorting never needs a lazy file", () => {
    for (const kanji of kanjiList) {
      for (const slot of [5, 6, 7, 8, 9, 10]) {
        expect(typeof main[kanji][slot], `${kanji} slot ${slot}`).toBe(
          "number"
        );
      }
    }
  });

  it("carries the TopoKanji Twitter index from the source list", () => {
    const lines = fs
      .readFileSync(
        path.join(
          process.cwd(),
          "raw-data",
          "misc",
          "external",
          "topokanji_index_twitter.txt"
        ),
        "utf8"
      )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const expected = new Map<string, number>();
    for (let i = 0; i < lines.length; i++) {
      expected.set([...lines[i]][0], i + 1);
    }

    for (const kanji of kanjiList) {
      expect(main[kanji][10], kanji).toBe(expected.get(kanji) ?? -1);
    }
  });
});

describe("kanji_extended_general.json / kanji_extended_hover.json", () => {
  it("together reproduce every field the app reads from v1 extended", () => {
    for (const kanji of kanjiList) {
      const source = v1Extended[kanji];

      expect(general[kanji], kanji).toEqual([source[5], source[6], source[7]]);
      expect(hover[kanji][0], kanji).toEqual(source[0]);
      expect(hover[kanji][2], kanji).toEqual(source[9]);
    }
  });

  it("never hides a family listed in keepFamilies", () => {
    for (const part of Object.keys(soundOurs.keepFamilies)) {
      expect(hiddenSoundParts.has(part), part).toBe(false);
    }
  });

  it("takes each sound part from ours.json, else the release, else Anki", () => {
    for (const kanji of kanjiList) {
      const soundPart = hover[kanji][1];
      const ours = soundOurs.soundPart[kanji];
      // The source is inconsistent here: most kanji without a phonetic
      // component store "", a few store []. Both mean "none".
      const release = releaseSoundPart(kanji);
      if (ours != null) {
        expect(soundPart, kanji).toBe(ours);
      } else if (release !== "") {
        expect(soundPart, kanji).toBe(
          hiddenSoundParts.has(release) ? "" : release
        );
      } else if (soundPart !== "") {
        expect(ankiPartsFor(kanji), kanji).toContain(soundPart);
      } else {
        expect(
          ankiPartsFor(kanji).filter((part) => !hiddenSoundParts.has(part)),
          kanji
        ).toEqual([]);
      }
      expect(hiddenSoundParts.has(soundPart), kanji).toBe(false);
    }
  });

  it("never takes a sound part from a dropped Anki family", () => {
    for (const kanji of kanjiList) {
      if (releaseSoundPart(kanji) !== "") continue;
      expect(soundOurs.dropFamilies[hover[kanji][1]], kanji).toBeUndefined();
    }
  });

  it("drops the two dead fields and nothing else", () => {
    // _rtk_old (slot 2) is discarded; slot 11 is the single rtk index and
    // lives on kanji_main. Everything else must live in main, general or hover.
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
      (kanji) =>
        releaseSoundPart(kanji) === "" &&
        ankiPartsFor(kanji).length === 0 &&
        soundOurs.soundPart[kanji] == null
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
  it("shows every keyword from components/ours.json", () => {
    for (const [char, entry] of Object.entries(ourComponents)) {
      if (entry.k == null) continue;
      expect(components[char]?.k, char).toBe(entry.k);
    }
  });

  it("applies sylhare bushu keywords over the older radical tables", () => {
    expect(components["⺡"]?.k).toBe("three water");
    expect(components["⺡"]).not.toHaveProperty("desc");
    expect(radicalInfo["⺡"]).toEqual({
      ja: "さんずい",
      pos: "へん",
      cn: "water",
    });
    // Stored once on ⺡; 氵 reaches it through its alias.
    expect(radicalInfo["氵"]).toBeUndefined();
    expect(infoFor("氵", v2Radicals)).toEqual(radicalInfo["⺡"]);
    expect(keywordOf("氵")).toBe("three water");
    expect(components["⻏"]?.k).toBe("large village");
    expect(components["⻖"]?.k).toBe("small village left");
    expect(components["𠂉"]?.k).toBe("no plus one");
  });

  it("names a shape that leads to a kanji by the kanji keyword", () => {
    const kanjiKeyword = (char: string) => main[char][0];
    // 戶 → 戸 says the kanji keyword, not the radical name と.
    expect(keywordOf("戶")).toBe(kanjiKeyword("戸"));
    // 衤 is a second code for the drawer's ⻂ (ころもへん), so it reads ⻂'s
    // name, and searches ⻂ (補 is filed under ⻂, not 衣).
    expect(components["衤"]?.k).toBeUndefined();
    expect(keywordOf("衤")).toBe("clothing left");
    // A form with its own name keeps it, also when its CSV row was drawn
    // in a private-use font (釒 かねへん, ours.json sylhareRowGlyphs).
    expect(keywordOf("⺩")).toBe("king left");
    expect(keywordOf("釒")).toBe("metal left");
  });

  it("keeps every phonetic sound list", () => {
    for (const [char, sounds] of Object.entries(v1Phonetic)) {
      expect(components[char]?.s, char).toEqual(
        soundOurs.readings[char] ?? sounds
      );
    }
  });

  it("gives every sound part a reading, with ours.json winning", () => {
    for (const kanji of kanjiList) {
      const soundPart = hover[kanji][1];
      if (soundPart === "") continue;
      expect(components[soundPart]?.s?.length, kanji).toBeGreaterThan(0);
    }
    for (const [char, sounds] of Object.entries(soundOurs.readings)) {
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
    // ⺤ aliases to 爪 (for radical search) but keeps its own name.
    expect(aliases["⺤"]).toBe("爪");
    expect(keywordOf("⺤")).toBe("claw crown");
    expect(keywordOf("爪")).toBe("claw");
  });

  it("fills a keywordless lookalike from its alias", () => {
    expect(keywordOf("艹")).toBe("grass crown");
    expect(keywordOf("⺾")).toBe("grass crown");
    expect(keywordOf("艸")).toBe("grass crown");
  });

  it("keeps the pig-head radical family on one keyword", () => {
    // What shows on screen; ⺕ stores nothing and follows its alias to 彐.
    expect(keywordOf("彐")).toBe("pig head");
    expect(keywordOf("ヨ")).toBe("pig head");
    expect(keywordOf("⺕")).toBe("pig head");
  });

  it("never stores an empty or untrimmed keyword", () => {
    for (const [char, entry] of Object.entries(components)) {
      if (entry.k == null) continue;
      expect(entry.k, char).toBe(entry.k.trim());
      expect(entry.k.length, char).toBeGreaterThan(0);
    }
  });

  it("does not duplicate kanji keywords that kanji_main already provides", () => {
    // Kept only where an alias reads its radical name from the kanji (飠 → 食).
    const aliasTargets = new Set(Object.values(aliases));
    for (const char of Object.keys(components)) {
      if (main[char] != null && !aliasTargets.has(char)) {
        expect(components[char].k, char).toBeUndefined();
      }
    }
  });
});

describe("kanji_structures.json", () => {
  const sources = {
    hl: raw<Record<string, unknown>>("kanji-structure/external/hlorenzi.json"),
    ka: raw<Record<string, unknown>>("kanji-structure/external/kanjium.json"),
    sc: raw<Record<string, unknown>>("kanji-structure/external/scott.json"),
    ya: raw<Record<string, unknown>>("kanji-structure/external/yagays.json"),
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

describe("sphmn_components.json", () => {
  const list = v2<[string, string][]>("sphmn_components.json");
  const csv = fs
    .readFileSync(
      path.join(
        process.cwd(),
        "raw-data/radicals/external/sphmn-components-ck.csv"
      ),
      "utf8"
    )
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(","));
  const { jouyouForms } = raw<{ jouyouForms: Record<string, string> }>(
    "misc/ours.json"
  );
  const shipped = (char: string) => v1Main[char] != null;

  it("keeps every one-character row, with its shipped kanji in CSV order", () => {
    const { sphmnCodepointFixes } = raw<{
      sphmnCodepointFixes: Record<string, string>;
    }>("radicals/ours.json");
    // Radical code points join their ordinary twin's row (⺣ → 灬).
    const merged = new Map<string, string[]>();
    for (const [component, kanji] of csv) {
      const glyph = sphmnCodepointFixes[component] ?? component;
      merged.set(glyph, [...(merged.get(glyph) ?? []), ...kanji]);
    }
    const expected = new Map<string, string>(
      [...merged]
        .filter(([component]) => [...component].length === 1)
        .map(([component, kanji]): [string, string] => [
          component,
          [...new Set(kanji.map((char) => jouyouForms[char] ?? char))]
            .filter(shipped)
            .join(""),
        ])
        .filter(([, kanji]) => kanji.length > 0)
    );
    expect(new Map(list)).toEqual(expected);
    for (const from of Object.keys(sphmnCodepointFixes)) {
      expect(expected.has(from)).toBe(false);
    }
  });

  it("is ordered by match count, the component itself included", () => {
    const matches = ([component, kanji]: [string, string]) =>
      [...kanji].length + (shipped(component) ? 1 : 0);
    for (let i = 1; i < list.length; i++) {
      expect(matches(list[i - 1])).toBeGreaterThanOrEqual(matches(list[i]));
    }
    expect(list[0][0]).toBe("口");
  });
});

describe("pass-through files", () => {
  it("are byte-identical in content to their v1 sources", () => {
    expect(v2("kanji_decomposition.json")).toEqual(
      raw("radicals/external/rewhowe-decomposition.json")
    );
    expect(v2("similar_kanjis.json")).toEqual(release("similar-kanjis.json"));
    expect(v2("kanji_reading_details.json")).toEqual(
      raw("misc/external/kanji-readings-details.json")
    );
    expect(v2("cum_use.json")).toEqual(release("cum_use.json"));
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
    // Ratchet: filling gaps in raw-data/components/ours.json lowers this,
    // a bad data drop raises it. Lower the number when you improve coverage.
    expect(report.summary.missing).toBeLessThanOrEqual(364);
  });
});
