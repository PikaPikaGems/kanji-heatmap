/**
 * Signed-out note drafts live in sessionStorage so they survive switching
 * kanji but not closing the tab (they are never sent anywhere). Storage can be
 * blocked or full, so every access is guarded: a failed read is "no draft".
 */
const draftKey = (kanji: string) => `kh-note-draft:${kanji}`;

export const readNoteDraft = (kanji: string): string => {
  try {
    return sessionStorage.getItem(draftKey(kanji)) ?? "";
  } catch {
    return "";
  }
};

export const writeNoteDraft = (kanji: string, text: string) => {
  try {
    if (text.length === 0) sessionStorage.removeItem(draftKey(kanji));
    else sessionStorage.setItem(draftKey(kanji), text);
  } catch {
    // Quota or blocked storage: the draft just won't survive a kanji switch.
  }
};

export const clearNoteDraft = (kanji: string) => writeNoteDraft(kanji, "");
