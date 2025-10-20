import { selectRandom } from "@/lib/utils";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const kaomojiFrames = {
  wFace: [
    "(´･ω･`)...",
    "(´･ω･`)..",
    "(´･ω･`).",
    "(´･ω･`)",
    "(´･ω･)つ",
    "つ(´･ω･`)",
    "ヽ(´･ω･`)",
    "(´･ω･`)ﾉ",
  ],
  bouncingBall: ["( ゜o゜)", "( ゜O゜)", "( ゜ｏ゜)"],
  happyFace: ["٩(◕‿◕)۶", "٩(◕‿◕｡)۶", "٩(｡◕‿◕)۶", "٩(◑‿◑)۶"],
  waggingDog: ["(◕ᴥ◕)つ", "⊂(◕ᴥ◕)つ", "つ(◕ᴥ◕)つ", "⊃(◕ᴥ◕)つ"],
  dancingPerson: ["ヽ(⌒▽⌒)ﾉ", "ヽ(^o^)ﾉ", "ヽ(★ω★)ﾉ", "ヽ(≧◡≦)ﾉ"],
  sweatingNervously: [
    "(;; ・_・)",
    "(;;; ・_・)",
    "(;;;; ・_・)",
    "(;;;;; ・_・)",
  ],
  wavingHello: ["(^_^)/~~~", "(^_^)ノ~~~", "(^_^)／~~~"],
  surprisedBlink: ["(☉_☉)", "(◕_◕)", "(☉_☉)", "(◕_◕)"],
  sparkleEyes: ["★~(◠‿◕✿)", "☆~(◠‿◕✿)", "★~(◠‿◕✿)", "☆~(◠‿◕✿)"],
  sleepyCat: [
    "(=^･ｪ･^=)...",
    "(=^･ｪ･^=)..",
    "(=^･ｪ･^=).",
    "(=^･ｪ･^=)",
    "(=^･ｪ･^=) zzz",
  ],
  excitedFace: ["٩(๑>◡<๑)۶", "٩(๑>ω<๑)۶", "٩(๑>ᴗ<๑)۶"],
  wavingFox: ["⊂(◕‿◕)つ", "つ(◕‿◕)つ", "⊃(◕‿◕)つ", "つ(◕‿◕)つ"],
  ninjaMoves: ["┌(∵)┘", "┐( ∵)┌", "└(∵)┘", "┌(∵)┐"],
  flyingBird: ["ヽ(✿ﾟ▽ﾟ)ノ", "ヽ(ﾟ▽ﾟ)/", "ヽ(°▽°)ﾉ", "ヽ(｡◕‿◕｡)ﾉ"],
  // 驚きと混乱
  confusedAlien: ["(°□°)", "(°ロ°)", "(°Д°)", "(°ㅁ°)", "(°□°)"],
  // 喜びのジャンプ
  joyfulJump: ["└( ＾ω＾ )┘", "└( ＾ω＾ )┐", "┌( ＾ω＾ )┘", "└( ＾ω＾ )┘"],
  // 眠そうな顔
  sleepyFace: ["(－ω－)zzZ", "(－ω－)｡ｏO", "(－ω－)zzZ"],
  // きらきらした目
  glitterEyes: ["(☆ω☆)", "(✧ω✧)", "(☆ω☆)"],
  // 疲れた顔
  tiredFace: ["(-_-;)・・・", "(-_-;)・・", "(-_-;)・", "(-_-;)・"],
} as const;

/*

ローディング (Rōdingu)
- Direct transliteration of "loading" in katakana. Commonly used in casual or modern interfaces, especially in gaming or apps.

読み込み中 (Yomikomichū) or 読込中
- Literally "reading in progress." Widely used in software, apps, or websites to indicate data is being loaded (e.g., files, pages).

通信中 (Tsūshinchū)
- Translates to "communicating." Used when the site is exchanging data with a server, such as during form submissions or updates.

処理中 (Shorichū)
- Means "processing." Indicates the system is handling a task, often overlapping with loading (e.g., after submitting a form).

ロード中 (Rōdochū)
- A hybrid of English ("load") and Japanese (中 for "in progress"). Seen in contexts like game loading screens or media buffering.
*/
const loadingTexts = [
  "ローディング",
  "読み込み中",
  "通信中",
  "処理中",
  "ロード中",
];

const KaomojiAnimation = ({
  delay = 200,
  cn = "font-bolder text-5xl text-pink-500 my-4",
}: {
  delay?: number;
  cn?: string;
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const framesRef = useRef<readonly string[]>([]);
  const loadingTextRef = useRef(loadingTexts[0]);

  useLayoutEffect(() => {
    loadingTextRef.current = selectRandom(loadingTexts);
  }, []);
  useEffect(() => {
    const frameName = selectRandom(
      Object.keys(kaomojiFrames)
    ) as keyof typeof kaomojiFrames;
    const frames = kaomojiFrames[frameName] ?? kaomojiFrames.wFace;
    framesRef.current = frames;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, delay);

    return () => clearInterval(interval);
  }, [delay]);

  return (
    <>
      <div
        className={cn}
        style={{
          fontFamily: "monospace",
          whiteSpace: "pre",
        }}
      >
        {framesRef.current?.[currentFrame] ?? kaomojiFrames.wFace[0]}
      </div>
      <span className="text-2xl sm:text-3xl my-1 kanji-font">
        {loadingTextRef.current}
      </span>
      <div className="font-extrabold text-xs">Loading...</div>
    </>
  );
};

const KaomojiWithDelay = () => {
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShowLoading(true);
    }, 150);
  }, []);

  if (!showLoading) {
    return null;
  }

  return <KaomojiAnimation />;
};

export default KaomojiWithDelay;
