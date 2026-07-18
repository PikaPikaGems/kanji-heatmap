import { JLPTListItems } from "@/lib/jlpt";
import { freqCategoryCn, getFreqCategory } from "@/lib/freq/freq-category";
import { freqMap } from "@/lib/options/options-label-maps";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { useBgSrc } from "@/hooks/routing-hooks";
import { useGetRepresentativeWordFn } from "@/providers/kanji-representative-word-provider";
import { isBookmarked } from "@/lib/bookmarks";
import { BorderColorMeaning } from "@/lib/settings/settings";
import { JLTPTtypes } from "@/lib/jlpt";

export const cn = `animate-fade-in-fast h-95 w-full p-1.5 rounded-lg text-2xl ml-1 border-4 bg-opacity-100 z-0 hover:border-[#2effff] transition-all transition-discrete duration-500`;
export const loadingCn = `${cn} animate-pulse duration-1000 h-full !bg-lime-400 !border-3 border-white dark:border-black`;
export const ellipsisCn =
  "!text-ellipsis !text-nowrap !w-24 !overflow-hidden !whitespace-nowrap";

export const useItemType = () => {
  const itemSettings = useDeferredItemSettings();
  return itemSettings.cardType;
};

const getStudyStatusBorderCn = (
  kanji: string,
  word: string | null
): string | null => {
  if (!word) return null;
  return isBookmarked(kanji, word) ? "border-green-500" : null;
};

const getBorderCn = (
  borderColorMeaning: BorderColorMeaning,
  jlpt: JLTPTtypes,
  kanji: string,
  representativeWord: string | null,
  dontIncludeFreq: boolean,
  freqRankCategory: number
): string => {
  const fallback =
    dontIncludeFreq === false || freqRankCategory === 0
      ? "border-black border-opacity-10 dark:border-white dark:border-opacity-10"
      : `border-theme-color-with-opacity-${25 * freqRankCategory}`;

  if (borderColorMeaning === "jlpt") return JLPTListItems[jlpt].cnBorder;
  if (borderColorMeaning === "study-status") {
    return getStudyStatusBorderCn(kanji, representativeWord) ?? fallback;
  }
  return fallback;
};

export const useItemBtnCn = (kanji: string) => {
  const getInfo = useGetKanjiInfoFn();
  const getRepresentativeWord = useGetRepresentativeWordFn();
  const bgSrc = useBgSrc();
  const itemType = useItemType();
  const { borderColorMeaning } = useDeferredItemSettings();

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

  const textColor = dontIncludeFreq
    ? "text-black dark:text-white"
    : freqRankCategory > 3
      ? "text-white"
      : "dark:text-white text-gray-700";
  const jlpt = kanjiInfo?.jlpt ?? "none";

  const representativeWord = getRepresentativeWord(kanji)?.word ?? null;
  const border = getBorderCn(
    borderColorMeaning,
    jlpt,
    kanji,
    representativeWord,
    dontIncludeFreq,
    freqRankCategory
  );

  const bgColor = dontIncludeFreq
    ? ""
    : freqRankCategory === 0
      ? "bg-background"
      : freqCategoryCn[freqRankCategory];

  const btnCnRaw = `${cn} ${border} ${bgColor} ${textColor}`;
  const btnCn =
    itemType === "compact"
      ? `${btnCnRaw} kanji-font`
      : `${btnCnRaw} border-8 flex flex-col justify-center items-center`;

  return btnCn;
};
