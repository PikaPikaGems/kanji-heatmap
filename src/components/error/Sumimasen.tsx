import { selectRandom } from "@/lib/generic-utils";

const APOLOGIZING_SYMBOL = [
  "(シ_ _)シ",
  "m(_ _)m",
  "m(._.)m",
  "<(_ _)>",
  "(_ _*)",
  "m(｡≧ _ ≦｡)m",
  //  "(´；ω；｀)",
  "(｡•́︿•̀｡)",
  //  "(；人；)",
  "(;-;)",
  "(>_<)",
  "(·.·)",
  "(^-^*)",
  "\\(^Д^)/",
  "\\(o_o)/",
  "(˚Δ˚)b",
  "(≥o≤)",
  "(='X'=)",
  "(o^^)o",
  "(╬ Ò ‸ Ó)",
];

export const Sumimasen = () => {
  return (
    <>
      <span className="text-3xl sm:text-3xl my-1 kanji-font">
        {"すみません"}
      </span>
      <div className="flex space-x-2 my-4 justify-center items-center">
        {Math.random() < 0.8 ? (
          <code className="font-bolder text-4xl text-pink-500">
            {selectRandom(APOLOGIZING_SYMBOL)}
          </code>
        ) : (
          <div className="text-3xl">{"🙇🏽‍♀️ 🙇"}</div>
        )}
      </div>
    </>
  );
};
