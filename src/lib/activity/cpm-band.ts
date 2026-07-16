import type { FreqCategory } from "@/lib/freq/freq-category";

/** Map qualified CPM to opacity band 0–4 (0 = never qualified). */
export const cpmToBand = (
  bestCpmWithAccuracyOver70: number | null | undefined
): FreqCategory => {
  const cpm = bestCpmWithAccuracyOver70 ?? 0;
  if (cpm <= 0) return 0;
  if (cpm < 30) return 1;
  if (cpm < 70) return 2;
  if (cpm < 120) return 3;
  return 4;
};

export const CPM_BAND_LABELS: Record<FreqCategory, string> = {
  0: "Not attempted",
  1: ">0–29 CPM",
  2: "30–69 CPM",
  3: "70–119 CPM",
  4: "120+ CPM",
};

/** Count of challenges per CPM band (bands 0–4). */
export const countBands = (bands: FreqCategory[]): number[] => {
  const counts = [0, 0, 0, 0, 0];
  for (const band of bands) {
    counts[band] += 1;
  }
  return counts;
};
