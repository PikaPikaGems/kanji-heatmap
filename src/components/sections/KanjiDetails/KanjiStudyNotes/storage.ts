export const MAX_STUDY_NOTE_LENGTH = 800;

export const getKanjiStudyNotesStorageKey = (kanji: string) =>
  `kanji-study-notes:v1:${encodeURIComponent(kanji)}`;
