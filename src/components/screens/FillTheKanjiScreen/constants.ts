import { FillTheKanjiSettings } from "./types";

export const SETTINGS_KEY = "fill-the-kanji-settings";

export const DEFAULT_SETTINGS: FillTheKanjiSettings = {
  setId: "n5",
  batchBySet: {},
  sound: { enabled: true, type: "correct" },
  readAloudOnShow: false,
  tileCount: 8,
};
