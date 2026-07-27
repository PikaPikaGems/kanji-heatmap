/**
 * Furigana is stored as one string per word instead of an array of segments,
 * because the array form costs roughly twice the bytes for the same content.
 *
 * The format is the one Anki uses: a reading follows its text in square
 * brackets, and a space separates a bracketed segment from the plain segment
 * before it.
 *
 *   会[かい]社[しゃ]      → [["会","かい"], ["社","しゃ"]]
 *   あん 肝[きも]         → [["あん"], ["肝","きも"]]
 *   お 兄[にい]ちゃん     → [["お"], ["兄","にい"], ["ちゃん"]]
 *
 * The separating space is what makes the format unambiguous. Without it,
 * "あん肝[きも]" could mean either あん + 肝[きも] or あん肝[きも] — 140 of
 * the 4,408 words in the corpus hit that case.
 */

export type WordPartDetail = [string, string?];

const SEGMENT = / ?([^ [\]]+)\[([^\]]*)\]| ?([^ [\]]+)/g;

/** Characters that would make an encoded string impossible to parse back. */
const UNSAFE = /[ [\]]/;

export const encodeFurigana = (parts: WordPartDetail[]): string => {
  let encoded = "";

  parts.forEach(([text, reading], index) => {
    if (UNSAFE.test(text) || (reading != null && UNSAFE.test(reading))) {
      throw new Error(
        `Cannot encode furigana segment ${JSON.stringify([text, reading])}: ` +
          `spaces and square brackets are format delimiters`
      );
    }

    if (reading == null) {
      encoded += text;
      return;
    }

    // Only a plain segment directly before this one needs the separator; after
    // a "]" the boundary is already unambiguous.
    const previous = parts[index - 1];
    if (index > 0 && previous?.[1] == null) {
      encoded += " ";
    }
    encoded += `${text}[${reading}]`;
  });

  return encoded;
};

export const decodeFurigana = (encoded: string): WordPartDetail[] => {
  const parts: WordPartDetail[] = [];

  for (const match of encoded.matchAll(SEGMENT)) {
    const [, bracketedText, reading, plainText] = match;
    parts.push(bracketedText != null ? [bracketedText, reading] : [plainText]);
  }

  return parts;
};
