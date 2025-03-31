import { cnItemBg, cnSquare } from "../generic-cn";

export const freqCategoryCount = 6;
export type FreqCategory = 0 | 1 | 2 | 3 | 4 | 5;
// TODO: Generate this as a function of freqCategoryCount
// generating these tw classes on the fly actually doesn't work idk why
export const freqCategoryCn: Record<FreqCategory, string> = {
  0: "bg-opacity-0",
  1: "bg-opacity-20",
  2: "bg-opacity-40",
  3: "bg-opacity-60",
  4: "bg-opacity-80",
  5: "bg-opacity-100",
};

export const freqCategoryOpacity: Record<FreqCategory, number> = {
  0: 0.1,
  1: 0.25,
  2: 0.45,
  3: 0.65,
  4: 0.85,
  5: 1,
};

export const freqRankMaxMin: Record<
  FreqCategory,
  { min: number; max: number }
> = {
  0: { min: 2250, max: Infinity },
  1: { min: 1700, max: 2250 },
  2: { min: 1100, max: 1700 },
  3: { min: 650, max: 1100 },
  4: { min: 300, max: 650 },
  5: { min: 0, max: 300 },
};

export const getFreqCategory = (freqRank?: number | null) => {
  return freqRank == null || freqRank < 1 || freqRank > 2250
    ? 0
    : freqRankMaxMin[1].min < freqRank && freqRank <= freqRankMaxMin[1].max
      ? 1
      : freqRankMaxMin[2].min < freqRank && freqRank <= freqRankMaxMin[2].max
        ? 2
        : freqRankMaxMin[3].min < freqRank && freqRank <= freqRankMaxMin[3].max
          ? 3
          : freqRankMaxMin[4].min < freqRank &&
              freqRank <= freqRankMaxMin[4].max
            ? 4
            : 5;
};

export const getFreqCnByRank = (rank: number | null) => {
  const freqRankCategory = rank == null || rank < 1 ? 0 : getFreqCategory(rank);

  const bgColor = freqCategoryCn[freqRankCategory];
  return `${cnItemBg} ${cnSquare} ${bgColor}`;
};
