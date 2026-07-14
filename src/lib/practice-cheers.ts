import { selectRandom } from "@/lib/utils";

const CORRECT_CHEERS = [
  "せいかい！",
  "やった！",
  "ばっちり！",
  "いいね！",
  "すごーい！",
] as const;

const FORGOT_CHEERS = [
  "おしい！",
  "つぎはできる！",
  "だいじょうぶ！",
  "もういっかい！",
] as const;

const END_CHEERS = [
  "すごいですね！",
  "やったね！",
  "よくできました！",
  "すてき！",
  "がんばったね！",
  "かんぺき！",
] as const;

export const pickCorrectCheer = () => selectRandom([...CORRECT_CHEERS]);
export const pickForgotCheer = () => selectRandom([...FORGOT_CHEERS]);
export const pickEndCheer = () => selectRandom([...END_CHEERS]);
