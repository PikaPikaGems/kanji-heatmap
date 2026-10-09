/**
 * Each kanji's sound part and each sound part's readings, from
 * raw-data/sound-parts/ and the Kanji Heatmap Data release.
 *
 *   ours.json                            ─┐
 *   release phonetic.json + kanji field 8 ├─▶ buildSoundParts → { soundPartOf, readings, report }
 *   external/anki-phonetic-components.tsv ─┘
 *
 * Precedence: ours.json > release > Anki. Anki only fills kanji that have no
 * sound part. Files in external/ and the release are read, never written.
 * See raw-data/sound-parts/README.md for the rules.
 */

import fs from "node:fs";
import path from "node:path";

// Voicing doesn't break a family: 賀 が is in 加's か family.
const UNVOICED = Object.fromEntries(
  [..."がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ"].map((ch, i) => [
    ch,
    "かきくけこさしすせそたちつてとはひふへほはひふへほ"[i],
  ])
);
const unvoiced = (kana) => [...kana].map((ch) => UNVOICED[ch] ?? ch).join("");

const toHiragana = (text) =>
  text.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );

/**
 * Reads raw-data/sound-parts/. Each Anki row becomes { part, reading, kanji }.
 * Rows R01–R20 are rhyme groups, not sound families, and are skipped.
 */
export const readSoundPartSources = (rawDir) => {
  const dir = path.join(rawDir, "sound-parts");
  const read = (name) => fs.readFileSync(path.join(dir, name), "utf8");
  const ours = JSON.parse(read("ours.json"));

  // The Anki deck writes a few parts at Kangxi-radical or radical-supplement
  // codepoints. Read them as the ordinary character the rest of our data uses
  // (⺹ is 耂 in every parts list), so the breakdown never shows one shape
  // twice. The pairs live in ours.json `codepointFixes`.
  const codepointFixes = ours.codepointFixes ?? {};
  const fixCodepoint = (char) => codepointFixes[char] ?? char;

  const [, ...lines] = read("external/anki-phonetic-components.tsv")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const ankiRows = lines
    .map((line) => line.split("\t"))
    .filter(([serial]) => !serial.startsWith("R"))
    .map(([, part, reading, , , ...cells]) => ({
      part: fixCodepoint(part.trim()),
      // "エイ (EI)" → "えい"
      reading: toHiragana(reading.split("(")[0].trim()),
      // "泳 to swim" → "泳". The last column is Audio, always empty.
      kanji: cells
        .map((cell) => [...cell.trim()][0])
        .filter(Boolean)
        .map(fixCodepoint),
    }));

  return { ankiRows, ours };
};

/**
 * - `soundPartOf`: kanji → its sound part (one per kanji).
 * - `readings`: sound part → readings, for every part some kanji uses.
 * - `report`: what Anki and ours.json changed, for docs/data/.
 *
 * `onReadingsOf(kanji)` gives a kanji's on readings: Anki fills a kanji only
 * if it is read with the family sound (the hint test; see the README).
 *
 * Throws when an ours.json entry matches nothing or repeats what the sources
 * already say, or when a sound part ends up with no readings.
 */
export const buildSoundParts = ({
  releaseSoundPartOf,
  releaseReadings,
  ankiRows,
  ours,
  isKanji,
  onReadingsOf,
  kanjiWithPart = () => [],
}) => {
  const dropFamilies = ours.dropFamilies ?? {};
  const keepFamilies = ours.keepFamilies ?? {};
  const soundPartOverrides = ours.soundPart ?? {};
  const readingOverrides = ours.readings ?? {};
  const problems = [];

  const ankiParts = new Set(ankiRows.map((row) => row.part));
  for (const part of Object.keys(dropFamilies)) {
    if (!ankiParts.has(part)) {
      problems.push(`dropFamilies: ${part} is not an Anki family`);
    }
  }

  // 1. Release. 2. Anki fills kanji with no sound part:
  //    a. members, if the kanji is read with the family sound;
  //    b. then each family head that is a kanji gets itself (加 → 加), as the
  //       release does for its heads (旨 → 旨). Its chip says kanji with it
  //       are often read so, even when the head isn't (門 もん, family かん).
  //       Members go first, so a kanji in one family and at the head of
  //       another keeps the hint for its own reading (少 → 小 しょう, not 少 さ).
  const soundPartOf = { ...releaseSoundPartOf };
  const ankiReadings = {};
  const added = [];
  const kept = [];
  const notReadSo = [];
  const keptRows = ankiRows.filter(({ part }) => dropFamilies[part] == null);
  const fill = (char, part) => {
    const current = soundPartOf[char];
    if (current === part) return false;
    if (current != null) {
      kept.push({ kanji: char, kept: current, anki: part });
      return false;
    }
    soundPartOf[char] = part;
    added.push({ kanji: char, part });
    return true;
  };
  for (const { part, reading, kanji } of keptRows) {
    ankiReadings[part] ??= reading;
    for (const char of new Set(kanji)) {
      if (char === part || !isKanji(char)) continue;
      const readsSo = onReadingsOf(char).some(
        (on) => unvoiced(on) === unvoiced(reading)
      );
      if (readsSo) fill(char, part);
      else notReadSo.push({ kanji: char, part, reading });
    }
  }
  for (const { part } of new Map(
    keptRows.map((row) => [row.part, row])
  ).values()) {
    if (isKanji(part)) fill(part, part);
  }

  // 3. ours.json soundPart wins over both.
  const overridden = [];
  for (const [kanji, part] of Object.entries(soundPartOverrides)) {
    if (!isKanji(kanji)) {
      problems.push(`soundPart: ${kanji} is not a kanji in our set`);
      continue;
    }
    if (soundPartOf[kanji] === part) {
      problems.push(`soundPart: ${kanji} already has ${part}; remove it`);
      continue;
    }
    overridden.push({ kanji, from: soundPartOf[kanji] ?? "", to: part });
    soundPartOf[kanji] = part;
  }

  // Readings: ours.json, else the release (every entry, as before), else
  // Anki for a part some kanji now uses.
  const used = new Set(Object.values(soundPartOf));
  const readings = { ...releaseReadings };
  for (const part of used) {
    if (readings[part] == null && ankiReadings[part] != null) {
      readings[part] = [ankiReadings[part]];
    }
  }
  for (const [part, value] of Object.entries(readingOverrides)) {
    if (!used.has(part)) {
      problems.push(`readings: ${part} is not anyone's sound part`);
      continue;
    }
    if (JSON.stringify(readings[part]) === JSON.stringify(value)) {
      problems.push(`readings: ${part} already reads ${value}; remove it`);
      continue;
    }
    readings[part] = value;
  }
  for (const part of used) {
    if (readings[part] == null) {
      problems.push(`${part} is a sound part but has no readings`);
    }
  }

  // 4. Hide a family whose hint misleads more than it helps: most kanji
  //    with the part (as a direct part, kanjiWithPart) are not read with
  //    its sound, and no more than 2 of its own kanji are. A family where
  //    every such kanji is read so never meets the first condition.
  //    ours.json keepFamilies lists the families kept anyway (果: 課 菓).
  const readsSo = (kanji, part) =>
    onReadingsOf(kanji).some((on) =>
      (readings[part] ?? []).some(
        (reading) => unvoiced(on) === unvoiced(reading)
      )
    );
  const membersOf = {};
  for (const [kanji, part] of Object.entries(soundPartOf)) {
    if (kanji !== part) (membersOf[part] ??= []).push(kanji);
  }
  const hidden = [];
  for (const part of used) {
    const members = membersOf[part] ?? [];
    const withPart = new Set([
      ...kanjiWithPart(part).filter((kanji) => kanji !== part),
      ...members,
    ]);
    const right = [...withPart].filter((kanji) => readsSo(kanji, part));
    const wrong = [...withPart].filter((kanji) => !readsSo(kanji, part));
    const helps = members.filter((kanji) => readsSo(kanji, part)).length;
    if (wrong.length <= right.length || helps > 2) continue;
    if (keepFamilies[part] != null) continue;
    hidden.push({
      part,
      members: members.join(""),
      right: right.join(""),
      wrong: wrong.join(""),
    });
    for (const kanji of [...members, part]) {
      if (soundPartOf[kanji] === part) delete soundPartOf[kanji];
    }
  }
  for (const part of Object.keys(keepFamilies)) {
    if (!used.has(part)) {
      problems.push(`keepFamilies: ${part} is not anyone's sound part`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`sound parts:\n  - ${problems.join("\n  - ")}`);
  }
  return {
    soundPartOf,
    readings,
    report: {
      added,
      overridden,
      // Anki offers another part; the one the kanji already had stays (from the
      // release, or an earlier Anki row). Not shown when ours.json decided.
      kept: kept.filter(({ kanji }) => soundPartOverrides[kanji] == null),
      // Anki lists the kanji, but it isn't read with the family sound.
      notReadSo,
      // Families hidden by step 4, with the kanji that do and don't fit.
      hidden,
    },
  };
};
