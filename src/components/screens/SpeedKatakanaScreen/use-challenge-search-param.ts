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
 * - Selecting a challenge → URL (replace, so browsing sets doesn't spam history)
 */
export const useChallengeSearchParam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSetting] = useLocalStorage<SpeedKatakanaSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const challengeFromUrl = parseChallengeParam(
    searchParams.get(URL_PARAMS.challenge)
  );

  useLayoutEffect(() => {
    if (
      challengeFromUrl != null &&
      challengeFromUrl !== settings.challengeSet
    ) {
      setSetting("challengeSet", challengeFromUrl);
    }
  }, [challengeFromUrl, settings.challengeSet, setSetting]);

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
