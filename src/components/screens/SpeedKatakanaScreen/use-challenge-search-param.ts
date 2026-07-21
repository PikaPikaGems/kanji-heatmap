import { useCallback, useLayoutEffect } from "react";
import { useSearchParams } from "@/hooks/routing-hooks";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { SpeedKatakanaSettings } from "./types";
import { parseChallengeParam } from "./challenge-search-param";

/**
 * Keeps Speed Katakana `challengeSet` in sync with `?challenge=` on the URL:
 * - Valid URL param → settings (so InitialScreen selection + stats match)
 * - Invalid / empty URL param → removed from the URL (replace)
 * - Selecting a challenge → URL (replace, so browsing sets doesn't spam history)
 */
export const useChallengeSearchParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSetting] = useLocalStorage<SpeedKatakanaSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const rawChallenge = searchParams.get(URL_PARAMS.challenge);
  const challengeFromUrl = parseChallengeParam(rawChallenge);

  useLayoutEffect(() => {
    // Present but invalid (e.g. ?challenge=999 or ?challenge=abc) → strip it.
    if (rawChallenge != null && challengeFromUrl == null) {
      setSearchParams(
        (prev) => {
          if (!prev.has(URL_PARAMS.challenge)) return prev;
          const next = new URLSearchParams(prev);
          next.delete(URL_PARAMS.challenge);
          return next;
        },
        { replace: true }
      );
      return;
    }

    if (
      challengeFromUrl != null &&
      challengeFromUrl !== settings.challengeSet
    ) {
      setSetting("challengeSet", challengeFromUrl);
    }
  }, [
    rawChallenge,
    challengeFromUrl,
    settings.challengeSet,
    setSetting,
    setSearchParams,
  ]);

  const syncChallengeToUrl = useCallback(
    (challengeSet: number) => {
      setSearchParams(
        (prev) => {
          const value = String(challengeSet);
          if (prev.get(URL_PARAMS.challenge) === value) return prev;
          const next = new URLSearchParams(prev);
          next.set(URL_PARAMS.challenge, value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectChallengeSet = useCallback(
    (challengeSet: number) => {
      setSetting("challengeSet", challengeSet);
      syncChallengeToUrl(challengeSet);
    },
    [setSetting, syncChallengeToUrl]
  );

  return {
    settings,
    setSetting,
    selectChallengeSet,
    syncChallengeToUrl,
  };
};
