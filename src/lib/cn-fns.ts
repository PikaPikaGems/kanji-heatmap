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
  const b = freqCategoryCn[selectRandom([0, 1, 2, 3, 4, 5] as const)] ?? 0;
  const c = selectRandom(duration);
  const d = selectRandom(delay);
  return `${JLPTListItems[a].cnBorder} ${b} ${c} ${d}`;
};
export const randomCn = () => {
  return `${cnNormal()} !bg-[#fb02a8] ${BIG_TILE_CN}`;
};

export const randomCn2 = () => {
  return `${cnNormal()}  !bg-[#fb02a8] ${SMALL_TILE_CN}`;
};

export const cnRandomDurationDelay = () => {
  const a = selectRandom(duration);
  const b = selectRandom(delay);

  return `${a} ${b} bg-gray-100 dark:bg-gray-200 animate-pulse`;
};
