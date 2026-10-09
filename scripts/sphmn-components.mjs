/**
 * Component search data, from sph-mn's component → kanji table.
 *
 *   radicals/external/sphmn-components-ck.csv ─▶ buildSphmnComponents → [[component, kanji], ...]
 *
 * Each row is `component,kanji` where `kanji` is every jōyō kanji containing
 * the component at any depth (寺 → 侍持待時特等詩). The component itself is
 * never in its own row. Files in external/ are read, never written. See
 * raw-data/radicals/README.md for the rules.
 */

import fs from "node:fs";
import path from "node:path";

/** Reads the CSV as `{ component, kanji: string[] }` rows, unfiltered. */
export const readSphmnComponents = (rawDir) =>
  fs
    .readFileSync(
      path.join(rawDir, "radicals", "external", "sphmn-components-ck.csv"),
      "utf8"
    )
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
      const [component, kanji = ""] = line.split(",");
      return { component, kanji: [...kanji] };
    });

/**
 * Keeps rows whose component is one character (drops `中一` and the empty
 * one), reads radical code points as the ordinary character (`codepointFixes`,
 * ⺣ → 灬, merging the two rows), writes kanji in the forms we ship
 * (`jouyouForms`, 剝 → 剥), keeps only shipped kanji and drops components left
 * with none.
 *
 * Order is the drawer order: most matches first, where a match is a kanji
 * that contains the component, plus the component itself when it is a kanji
 * we ship (component search returns it too). Ties go to fewer strokes, then
 * unknown stroke counts, then code point.
 */
export const buildSphmnComponents = ({
  rows,
  codepointFixes,
  jouyouForms,
  isKanji,
  strokesOf,
}) => {
  const problems = [];
  const dropped = [];

  // Scott's composition map, which sph-mn expands, mixes radical code points
  // and ordinary characters for one shape (点 has 灬, 勲 has ⺣). Read them as
  // one component, keeping the first row's place and kanji order.
  const merged = new Map();
  for (const { component, kanji } of rows) {
    const glyph = codepointFixes[component] ?? component;
    merged.set(glyph, [...(merged.get(glyph) ?? []), ...kanji]);
  }
  for (const [from, to] of Object.entries(codepointFixes)) {
    if (!rows.some(({ component }) => component === from)) {
      problems.push(`sphmnCodepointFixes: ${from} is not a component`);
    }
    if (!rows.some(({ component }) => component === to)) {
      problems.push(
        `sphmnCodepointFixes: ${to} (for ${from}) is not a component`
      );
    }
  }

  const entries = [];
  for (const [component, kanji] of merged) {
    if ([...component].length !== 1) {
      dropped.push(component);
      continue;
    }
    const shipped = [
      ...new Set(kanji.map((char) => jouyouForms[char] ?? char)),
    ].filter((char) => isKanji(char));
    if (shipped.length === 0) {
      dropped.push(component);
      continue;
    }
    entries.push({
      component,
      kanji: shipped.join(""),
      matches: shipped.length + (isKanji(component) ? 1 : 0),
      strokes: strokesOf(component),
    });
  }

  entries.sort(
    (a, b) =>
      b.matches - a.matches ||
      (a.strokes ?? Infinity) - (b.strokes ?? Infinity) ||
      (a.component < b.component ? -1 : a.component > b.component ? 1 : 0)
  );

  return {
    list: entries.map(({ component, kanji }) => [component, kanji]),
    dropped,
    problems,
  };
};
