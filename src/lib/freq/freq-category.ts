import { cnSquare } from "../generic-cn";

export type FreqCategory = 0 | 1 | 2 | 3 | 4;
// TODO: Generate this as a function of freqCategoryCount
// generating these tw classes on the fly actually doesn't work idk why
export const freqCategoryCn: Record<FreqCategory, string> = {
  0: "background-theme-color-with-opacity-0",
  1: "background-theme-color-with-opacity-25",
  2: "background-theme-color-with-opacity-50",
  3: "background-theme-color-with-opacity-75",
  4: "background-theme-color-with-opacity-100",
};

export const freqCategoryCount = Object.keys(freqCategoryCn).length;

export const freqCategoryOpacity: Record<FreqCategory, number> = {
  0: 0.1,
  1: 0.25,
  2: 0.5,
  3: 0.75,
  4: 1,
};

export const freqRankMaxMin: Record<
  FreqCategory,
  { min: number; max: number }
> = {
  0: { min: 1700, max: Infinity },
  1: { min: 1100, max: 1700 },
  2: { min: 650, max: 1100 },
  3: { min: 300, max: 650 },
  4: { min: 0, max: 300 },
};

export const getFreqCategory = (freqRank?: number | null) => {
  return freqRank == null || freqRank < 1 || freqRank > freqRankMaxMin[0].min
    ? 0
    : freqRankMaxMin[1].min < freqRank && freqRank <= freqRankMaxMin[1].max
      ? 1
      : freqRankMaxMin[2].min < freqRank && freqRank <= freqRankMaxMin[2].max
        ? 2
        : freqRankMaxMin[3].min < freqRank && freqRank <= freqRankMaxMin[3].max
          ? 3
          : 4;
};

export const getFreqCnByRank = (rank: number | null) => {
  const freqRankCategory = rank == null || rank < 1 ? 0 : getFreqCategory(rank);

  const bgColor = freqCategoryCn[freqRankCategory];
  return `${cnSquare} ${bgColor}`;
};
