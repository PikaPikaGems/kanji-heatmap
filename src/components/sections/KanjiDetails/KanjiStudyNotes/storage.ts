export const MAX_STUDY_NOTE_LENGTH = 1000;

export const getKanjiStudyNotesStorageKey = (kanji: string) =>
  `kanji-study-notes:v1:${encodeURIComponent(kanji)}`;
