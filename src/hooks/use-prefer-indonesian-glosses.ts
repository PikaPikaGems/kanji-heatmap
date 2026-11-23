import { useLocalStorageFlag } from "@/hooks/use-local-storage";

const PREFER_INDONESIAN_GLOSSES_KEY = "prefer-indonesian-glosses";

/**
 * User Preferences → "Prefer Indonesian vocabulary glosses" (off by default).
 * Its own module, like use-show-indonesian-meanings, so the word hooks can
 * read it without importing the Settings modal.
 */
export const usePreferIndonesianGlosses = () =>
  useLocalStorageFlag(PREFER_INDONESIAN_GLOSSES_KEY);
