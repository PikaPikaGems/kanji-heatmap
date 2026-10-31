import { useContext } from "react";
import { JLPTListItems } from "@/lib/jlpt";
import { JouyouGradeListItems, toJouyouGrade } from "@/lib/jouyou-grade";
import { freqCategoryCn, getFreqCategory } from "@/lib/freq/freq-category";
import { freqMap } from "@/lib/options/options-label-maps";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { useBgSrc } from "@/hooks/routing-hooks";
import {
  useBookmarkedKanji,
  useReviewingKanji,
} from "@/lib/engine/use-kanji-sets";
import { BorderColorMeaning } from "@/lib/settings/settings";
import { JLTPTtypes } from "@/lib/jlpt";
import { TileColorContext } from "./tile-color-context";
import { cnHatched } from "@/lib/generic-cn";

export const cn = `animate-fade-in-fast h-95 w-full p-1.5 rounded-lg text-2xl ml-1 border-4 bg-opacity-100 z-0 hover:border-neon-accent transition-all transition-discrete duration-500`;
export const loadingCn = `${cn} animate-pulse duration-1000 h-full !bg-lime-400 !border-3 border-white dark:border-black`;
export const ellipsisCn =
  "!text-ellipsis !text-nowrap !w-24 !overflow-hidden !whitespace-nowrap";

export const useItemType = () => {
  const itemSettings = useDeferredItemSettings();
  return itemSettings.cardType;
};

const getStudyStatusBorderCn = (
  isBookmarked: boolean,
  isReviewing: boolean
): string | null => {
  if (isBookmarked && isReviewing) return "border-lime-500";
  if (isBookmarked) return "border-green-500";
  if (isReviewing) return "border-foreground";
  return null;
};

const getBorderCn = (
  borderColorMeaning: BorderColorMeaning,
  jlpt: JLTPTtypes,
  grade: number | undefined,
  isBookmarked: boolean,
  isReviewing: boolean,
  dontIncludeFreq: boolean,
  freqRankCategory: number
): string => {
  const fallback =
    dontIncludeFreq === false || freqRankCategory === 0
      ? "border-black border-opacity-10 dark:border-white dark:border-opacity-10"
      : `border-theme-color-with-opacity-${25 * freqRankCategory}`;

  if (borderColorMeaning === "jlpt") return JLPTListItems[jlpt].cnBorder;
  if (borderColorMeaning === "grade") {
    return JouyouGradeListItems[toJouyouGrade(grade)].cnBorder;
  }
  if (borderColorMeaning === "study-status") {
    return getStudyStatusBorderCn(isBookmarked, isReviewing) ?? fallback;
  }
  return fallback;
};

export const useItemBtnCn = (kanji: string) => {
  const getInfo = useGetKanjiInfoFn();
  const bookmarks = useBookmarkedKanji();
  const reviewing = useReviewingKanji();
  const bgSrc = useBgSrc();
  const itemType = useItemType();
  const { borderColorMeaning } = useDeferredItemSettings();
  const tileColor = useContext(TileColorContext)?.(kanji);

  const kanjiInfo = getInfo?.(kanji);

  if (kanji.length === 0) {
    return loadingCn;
  }
  const freqType =
    bgSrc == null || bgSrc == "none" ? "none" : (freqMap[bgSrc] ?? "none");
  const dontIncludeFreq = freqType == "none";

  const freqData = kanjiInfo?.frequency;
  const freqRank =
    freqType !== "none"
      ? freqData
        ? freqData[freqType]
        : undefined
      : undefined;
  const freqRankCategory = getFreqCategory(freqRank);

  const textColor =
    tileColor?.textCn ??
    (dontIncludeFreq
      ? "text-black dark:text-white"
      : freqRankCategory > 3
        ? "text-white"
        : "dark:text-white text-gray-700");
  const jlpt = kanjiInfo?.jlpt ?? "none";

  const border = getBorderCn(
    borderColorMeaning,
    jlpt,
    kanjiInfo?.jouyouGrade,
    bookmarks.kanji.has(kanji),
    reviewing.kanji.has(kanji),
    dontIncludeFreq,
    freqRankCategory
  );

  const bgColor =
    tileColor?.bgCn ??
    (dontIncludeFreq
      ? ""
      : freqRankCategory === 0
        ? "bg-background"
        : freqCategoryCn[freqRankCategory]);

  // Hatched: diagonal stripes over the fill, with muted text and 75%
  // opacity, so a kanji with nothing to color still reads as a tile.
  const hatchedCn = ` ${cnHatched} !text-muted-foreground opacity-75`;
  const btnCnRaw = `${cn} ${border} ${bgColor} ${textColor}${tileColor?.dimmed ? hatchedCn : ""}`;
  const btnCn =
    itemType === "compact"
      ? `${btnCnRaw} kanji-font`
      : `${btnCnRaw} border-8 flex flex-col justify-center items-center`;

  return btnCn;
};
