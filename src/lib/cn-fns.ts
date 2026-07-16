import { freqCategoryCn } from "./freq/freq-category";
import { JLPTListItems, validJlpts as jlpts } from "./jlpt";
import { selectRandom } from "./utils";

const duration: string[] = ["duration-1000", "duration-700"];
const delay: string[] = ["", "delay-500", "delay-1000"];

export const cnColorful = () => {
  const a = selectRandom(jlpts);
  const b = selectRandom(jlpts);
  const c = selectRandom(duration);
  const d = selectRandom(delay);

  return `${JLPTListItems[a].cn} ${JLPTListItems[b].cnBorder} ${c} ${d}`;
};

const SMALL_TILE_CN =
  "!border-4 !rounded-lg !hover:border-cyan-500 !hover:bg-lime-500 motion-reduce:transition-none";

const BIG_TILE_CN = "!border-8 !rounded-xl motion-reduce:transition-none";
export const randomCnColorful = () => {
  return `${cnColorful()} ${BIG_TILE_CN}`;
};

export const randomCn2Colorful = () => {
  return `${cnColorful()} ${SMALL_TILE_CN}`;
};

export const cnNormal = () => {
  const a = selectRandom(jlpts);
  const b = freqCategoryCn[selectRandom([0, 1, 2, 3, 4] as const)] ?? 0;
  const c = selectRandom(duration);
  const d = selectRandom(delay);
  return `${JLPTListItems[a].cnBorder} ${b} ${c} ${d}`;
};
export const randomCn = () => {
  return `${cnNormal()} background-theme-color-with-opacity-100 ${BIG_TILE_CN}`;
};

export const randomCn2 = () => {
  return `${cnNormal()}  background-theme-color-with-opacity-100 ${SMALL_TILE_CN}`;
};

const ALT_BORDER_CN = [
  "border-theme-color-with-opacity-25",
  "border-theme-color-with-opacity-50",
  "border-theme-color-with-opacity-75",
] as const;

const ALT_BIG_TILE_CN = "!border-8 !rounded-xl motion-reduce:transition-none";
const ALT_SMALL_TILE_CN = "!border-4 !rounded-lg motion-reduce:transition-none";

const cnGradientAlt = () => {
  // Skip 0/100 so tiles stay mid-opacity — pulse reads on every tile.
  const bg = freqCategoryCn[selectRandom([1, 2, 3] as const)] ?? 0;
  const border = selectRandom([...ALT_BORDER_CN]);
  return `${bg} ${border}`;
};

export const randomCnGradientAlt = () => {
  return `${cnGradientAlt()} ${ALT_BIG_TILE_CN}`;
};

export const randomCn2GradientAlt = () => {
  return `${cnGradientAlt()} ${ALT_SMALL_TILE_CN}`;
};
