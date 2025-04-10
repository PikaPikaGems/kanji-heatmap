import { forwardRef } from "react";
import wanakana from "@/lib/wanakana-adapter";
import { JLPTListItems } from "@/lib/jlpt";
import { freqCategoryCn, getFreqCategory } from "@/lib/freq/freq-category";
import { freqMap } from "@/lib/options/options-label-maps";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { useDeferredItemSettings } from "@/providers/item-settings-hooks";
import { ReportBugIconBtn } from "@/components/common/ReportBugIconBtn";

interface TriggerProps {
  onClick?: () => void;
  kanji: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const cn = `animate-fade-in-fast h-95 w-full p-1.5 rounded-lg text-2xl ml-1 border-4 bg-opacity-100 z-0 hover:border-[#2effff] transition-all transition-discrete duration-500`;
const ellipsisCn =
  "!text-ellipsis !text-nowrap !w-24 !overflow-hidden !whitespace-nowrap";
const loadingCn = `${cn} animate-pulse duration-1000 h-full !bg-lime-400 !border-3 border-white dark:border-black`;

const ExpandedBtnContent = ({ kanji }: { kanji: string }) => {
  const getInfo = useGetKanjiInfoFn();
  const kanjiInfo = getInfo?.(kanji);

  if (kanjiInfo == null) {
    return (
      <span
        className={`${loadingCn} block`}
        role="status"
        aria-label="loading"
      />
    );
  }

  const { on, kun, keyword } = kanjiInfo;

  return (
    <>
      <span className={`${ellipsisCn} block text-sm kanji-font`}>
        {wanakana.toKatakana(on)}
        <>
          {kun && kun.length > 0 ? (
            <>
              {" • "}
              {kun}
            </>
          ) : (
            ""
          )}
        </>
      </span>
      <span className="kanji-font text-5xl block">{kanji}</span>
      <span
        className={`${ellipsisCn} block text-xs font-extrabold uppercase mt-1`}
      >
        {keyword}
      </span>
    </>
  );
};

const useItemType = () => {
  const itemSettings = useDeferredItemSettings();
  return itemSettings.cardType;
};

const useItemBgSettings = () => {
  const itemSettings = useDeferredItemSettings();
  return itemSettings.backgroundColorSettingDataSource;
};

const useItemDontIncludeJLPT = () => {
  const itemSettings = useDeferredItemSettings();
  return itemSettings.borderColorAttached === false;
};

const useItemBtnCn = (kanji: string) => {
  const getInfo = useGetKanjiInfoFn();
  const bgSrc = useItemBgSettings();
  const itemType = useItemType();
  const dontIncludeJLPT = useItemDontIncludeJLPT();

  const kanjiInfo = getInfo?.(kanji);

  if (kanjiInfo == null) {
    return loadingCn;
  }

  const dontIncludeFreq = bgSrc == null || bgSrc == "none";

  const freqData = kanjiInfo.frequency;
  const freqType = freqMap[bgSrc];
  const freqRank = freqType ? freqData[freqType] : undefined;
  const freqRankCategory = getFreqCategory(freqRank);

  const textColor =
    freqRankCategory > 3 || dontIncludeFreq
      ? "text-white"
      : "dark:text-white text-gray-700";
  const { jlpt } = kanjiInfo;

  const border = !dontIncludeJLPT
    ? JLPTListItems[jlpt].cnBorder
    : dontIncludeFreq === false || freqRankCategory === 0
      ? " border-black border-opacity-10 dark:border-white dark:border-opacity-10"
      : `border-theme-color-with-opacity-${20 * freqRankCategory}`;

  const bgColor =
    freqRankCategory === 0
      ? "bg-background"
      : dontIncludeFreq
        ? "background-theme-color-with-opacity-100"
        : freqCategoryCn[freqRankCategory];

  const btnCnRaw = `${cn} ${border} ${bgColor} ${textColor}`;
  const btnCn =
    itemType === "compact"
      ? `${btnCnRaw} kanji-font`
      : `${btnCnRaw} border-8 flex flex-col justify-center items-center`;

  return btnCn;
};

export const KanjiBtnErrorFallback = () => {
  return (
    <div className={`${loadingCn} h-full`}>
      <ReportBugIconBtn />
    </div>
  );
};

const KanjiItemButton = forwardRef<HTMLButtonElement, TriggerProps>(
  (props, ref) => {
    const { kanji, ...rest } = props;
    const btnCn = useItemBtnCn(kanji);
    const itemType = useItemType();

    if (itemType === "compact") {
      return (
        <button className={btnCn} ref={ref} {...rest}>
          {kanji}
        </button>
      );
    }

    return (
      <button className={btnCn} ref={ref} {...rest}>
        <ExpandedBtnContent kanji={kanji} />
      </button>
    );
  }
);

KanjiItemButton.displayName = "KanjiItemButton";

export { KanjiItemButton };
