import { translateValue, tryConvertRomaji } from "@/lib/wanakana-adapter";

/** Normalize a reading candidate for allowlist membership. */
export const normalizeReadingForm = (raw: string): string => {
  const cleaned = raw.replace(/\s+/g, "").trim();
  if (!cleaned) return "";
  const kana = translateValue(cleaned, "hiragana").replace(/\s+/g, "");
  return tryConvertRomaji(kana).toLowerCase();
};

/**
 * Build the set of accepted answer forms for a stored reading.
 * Readings with "・" are split; each part contributes kana + romaji forms.
 */
export const buildAcceptedReadings = (reading: string): Set<string> => {
  const accepted = new Set<string>();
  const parts = reading
    .split("・")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const kana = translateValue(part.replace(/\s+/g, ""), "hiragana");
    const romaji = tryConvertRomaji(kana).toLowerCase();
    if (kana) accepted.add(normalizeReadingForm(kana));
    if (romaji) accepted.add(romaji);
    // Also accept the raw part normalized (covers already-romaji storage edge cases)
    const normalized = normalizeReadingForm(part);
    if (normalized) accepted.add(normalized);
  }

  return accepted;
};

export const isReadingCorrect = (input: string, reading: string): boolean => {
  const accepted = buildAcceptedReadings(reading);
  if (accepted.size === 0) return false;

  const cleaned = input.replace(/\s+/g, "").trim();
  if (!cleaned) return false;

  // Drop trailing uncommitted romaji tail (IME mid-type), same idea as Speed Katakana
  const withoutPartial = cleaned.replace(/[a-zA-Z]+$/, "");
  const candidates = [cleaned, withoutPartial].filter(Boolean);

  for (const candidate of candidates) {
    const form = normalizeReadingForm(candidate);
    if (form && accepted.has(form)) return true;
  }
  return false;
};
