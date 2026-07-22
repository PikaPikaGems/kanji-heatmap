import { isKanji } from "@/lib/utils";
import { SearchType } from "@/lib/settings/settings";
import { SEARCH_TYPE_OPTIONS, translateMap } from "@/lib/search-input-maps";
import wanakana, { translateValue, hasKanji } from "@/lib/wanakana-adapter";

// Search types that open a drawer instead of accepting typed input.
export type DialogType =
  | "radicals"
  | "handwriting"
  | "handwriting-alt"
  | "handwriting-alt-2";
const DIALOG_TYPES: DialogType[] = [
  "radicals",
  "handwriting",
  "handwriting-alt",
  "handwriting-alt-2",
];
export const isDialogType = (type: SearchType): type is DialogType =>
  (DIALOG_TYPES as SearchType[]).includes(type);

export const stripToKanji = (text: string) =>
  text.split("").filter(isKanji).join("");

export const searchTypeLabel = (type: SearchType) =>
  SEARCH_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;

// Infer a search type from Japanese IME / typed input. Returns null when
// the script is ambiguous or gives no reason to switch.
export const inferSearchTypeFromText = (
  text: string,
  currentType: SearchType
): SearchType | null => {
  if (text.length === 0) {
    return null;
  }
  if (hasKanji(text)) {
    // Similar is intentionally kanji-based — keep it instead of jumping
    // to multi-kanji when IME confirms a kanji candidate.
    if (currentType === "similar") {
      return null;
    }
    return "multi-kanji";
  }
  if (wanakana.isKana(text)) {
    return "readings";
  }
  // Multi-kanji expects Japanese characters — a roman word belongs in meanings.
  if (currentType === "multi-kanji" && wanakana.isRomaji(text)) {
    return "meanings";
  }
  return null;
};

export type PasteResolution = {
  /** The full new field value after inserting the paste. */
  value: string;
  /** Caret position after the inserted text. */
  caret: number;
  nextType: SearchType;
  /** Announce the type switch to the user (only shown when the type changed). */
  announce: boolean;
};

/**
 * Decide what a paste should do: where the pasted text lands in the field,
 * which search type the pasted script implies, and whether to announce the
 * switch. Returns null when the paste should be ignored entirely.
 */
export const resolvePaste = ({
  pasted,
  currentValue,
  selectionStart,
  selectionEnd,
  searchType,
}: {
  pasted: string;
  currentValue: string;
  selectionStart: number;
  selectionEnd: number;
  searchType: SearchType;
}): PasteResolution | null => {
  const processedText = pasted.trim();

  if (processedText.length === 0) {
    // it's as if you didn't paste anything at all
    return null;
  }

  const insertAt = (insertion: string) => ({
    value: `${currentValue.slice(0, selectionStart)}${insertion}${currentValue.slice(selectionEnd)}`,
    caret: selectionStart + insertion.length,
  });

  if (hasKanji(processedText)) {
    if (searchType === "similar") {
      // Similar only wants kanji in the field — strip everything else.
      const kanjiOnly = stripToKanji(insertAt(processedText).value);
      // hasKanji (wanakana) can disagree with isKanji — don't wipe the field.
      if (kanjiOnly.length === 0) {
        return null;
      }
      return {
        value: kanjiOnly,
        caret: kanjiOnly.length,
        nextType: "similar",
        announce: false,
      };
    }

    return {
      ...insertAt(processedText),
      nextType: "multi-kanji",
      announce: true,
    };
  }

  // No kanji: auto-pick a search type from the pasted script.
  if (wanakana.isKana(processedText)) {
    return { ...insertAt(processedText), nextType: "readings", announce: true };
  }

  if (wanakana.isRomaji(processedText)) {
    const nextType: SearchType =
      searchType === "keyword" ? "keyword" : "meanings";
    const insertion = translateValue(processedText, translateMap[nextType]);
    return { ...insertAt(insertion), nextType, announce: true };
  }

  // Mixed / ambiguous: keep current search type.
  const insertion = translateValue(processedText, translateMap[searchType]);
  return { ...insertAt(insertion), nextType: searchType, announce: false };
};
