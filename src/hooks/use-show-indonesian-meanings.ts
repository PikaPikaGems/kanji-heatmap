import { useLocalStorageFlag } from "@/hooks/use-local-storage";

const SHOW_INDONESIAN_MEANINGS_KEY = "show-indonesian-meanings";

/**
 * User Preferences → "Show Indonesian meanings" (off by default). Its own
 * module so the worker search hooks can read it without importing
 * indonesian-meanings-hooks, which imports them back.
 */
export const useShowIndonesianMeanings = () =>
  useLocalStorageFlag(SHOW_INDONESIAN_MEANINGS_KEY);
