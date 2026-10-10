import { useCallback, useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "@/hooks/routing-hooks";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { FillTheKanjiSetId } from "@/lib/fill-the-kanji/sets";
import {
  isFillTheKanjiSetId,
  isValidRound,
  roundCount,
} from "@/lib/fill-the-kanji/rounds";
import { readSetRoundStats } from "@/lib/fill-the-kanji/storage";
import { DEFAULT_SETTINGS, SETTINGS_KEY } from "./constants";
import { FillTheKanjiSettings } from "./types";

const SET_PARAM = URL_PARAMS.fillTheKanjiSet;
const ROUND_PARAM = URL_PARAMS.fillTheKanjiRound;

/** First round of a set with no recorded attempt, or 1 when all are played. */
const firstUnplayedRound = (setId: FillTheKanjiSetId): number => {
  const stats = readSetRoundStats(setId);
  const total = roundCount(setId);
  for (let round = 1; round <= total; round++) {
    if (!stats[String(round)]) return round;
  }
  return 1;
};

/** The round to show for a set: the remembered one, else the first unplayed. */
export const selectedRoundFor = (
  settings: FillTheKanjiSettings,
  setId: FillTheKanjiSetId
): number => {
  const remembered = settings.roundBySet[setId];
  return remembered != null && isValidRound(setId, remembered)
    ? remembered
    : firstUnplayedRound(setId);
};

/**
 * Settings for the start screen, kept in sync with `?set=` and `?round=`:
 * - Valid URL params → settings (so a dashboard "Practice Now" link lands on
 *   that round)
 * - Invalid params → removed from the URL (replace)
 * - Selecting a set or round → URL (replace, so browsing doesn't spam history)
 */
export const useFillTheKanjiSettings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSetting] = useLocalStorage<FillTheKanjiSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  // Stored settings may be from an older shape or name a removed set.
  const setId = isFillTheKanjiSetId(settings.setId)
    ? settings.setId
    : DEFAULT_SETTINGS.setId;
  const storedRoundBySet = settings.roundBySet;
  const roundBySet = useMemo(() => storedRoundBySet ?? {}, [storedRoundBySet]);
  const resolved: FillTheKanjiSettings = { ...settings, setId, roundBySet };
  const round = selectedRoundFor(resolved, setId);

  const rawSet = searchParams.get(SET_PARAM);
  const rawRound = searchParams.get(ROUND_PARAM);
  const setFromUrl =
    rawSet != null && isFillTheKanjiSetId(rawSet) ? rawSet : null;
  const roundNumber = rawRound == null ? NaN : Number(rawRound);
  const roundFromUrl =
    setFromUrl != null && isValidRound(setFromUrl, roundNumber)
      ? roundNumber
      : null;

  useLayoutEffect(() => {
    const badSet = rawSet != null && setFromUrl == null;
    const badRound = rawRound != null && roundFromUrl == null;
    if (badSet || badRound) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (badSet) next.delete(SET_PARAM);
          if (badRound) next.delete(ROUND_PARAM);
          return next;
        },
        { replace: true }
      );
    }

    if (setFromUrl != null && setFromUrl !== setId) {
      setSetting("setId", setFromUrl);
    }
    if (
      setFromUrl != null &&
      roundFromUrl != null &&
      roundBySet[setFromUrl] !== roundFromUrl
    ) {
      setSetting("roundBySet", { ...roundBySet, [setFromUrl]: roundFromUrl });
    }
  }, [
    rawSet,
    rawRound,
    setFromUrl,
    roundFromUrl,
    setId,
    roundBySet,
    setSetting,
    setSearchParams,
  ]);

  const syncToUrl = useCallback(
    (nextSet: FillTheKanjiSetId, nextRound: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(SET_PARAM, nextSet);
          next.set(ROUND_PARAM, String(nextRound));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectRound = useCallback(
    (nextSet: FillTheKanjiSetId, nextRound: number) => {
      setSetting("setId", nextSet);
      setSetting("roundBySet", { ...roundBySet, [nextSet]: nextRound });
      syncToUrl(nextSet, nextRound);
    },
    [roundBySet, setSetting, syncToUrl]
  );

  const selectSet = useCallback(
    (nextSet: FillTheKanjiSetId) => {
      const remembered = { ...DEFAULT_SETTINGS, roundBySet };
      selectRound(nextSet, selectedRoundFor(remembered, nextSet));
    },
    [roundBySet, selectRound]
  );

  return {
    settings: resolved,
    setId,
    round,
    setSetting,
    selectSet,
    selectRound,
  };
};
