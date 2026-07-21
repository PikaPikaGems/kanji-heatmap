import { URL_PARAMS } from "@/lib/settings/url-params";
import { speedKatakanaPageMeta } from "@/lib/pages/practice-pages";
import { SPEED_KATAKANA_TOTAL_CHALLENGES } from "./constants";

/**
 * Parse `?challenge=` into a valid challenge set id (1–200), or null when
 * missing / non-integer / out of range.
 */
export const parseChallengeParam = (raw: string | null): number | null => {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > SPEED_KATAKANA_TOTAL_CHALLENGES) {
    return null;
  }
  return n;
};

/** Build `/speed-katakana?challenge=<id>` for deep links (e.g. dashboard). */
export const speedKatakanaChallengeHref = (challengeSet: number) =>
  `${speedKatakanaPageMeta.href}?${URL_PARAMS.challenge}=${challengeSet}`;
