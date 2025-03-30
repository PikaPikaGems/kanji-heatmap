import { forwardRef } from "react";
import wanakana from "@/lib/wanakana-adapter";
import { JLPTListItems } from "@/lib/jlpt";
import { freqCategoryCn, getFreqCategory } from "@/lib/freq/freq-category";
import { freqMap } from "@/lib/options/options-label-maps";
import { cnItemBg } from "@/lib/generic-cn";
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

const cn = `animate-fade-in-fast h-95 w-full p-1.5 rounded-lg text-2xl ml-1 border-4 bg-opacity-100 ${cnItemBg} z-0 hover:border-[#2effff] transition-all transition-discrete duration-500`;
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

const useItemBtnCn = (kanji: string) => {
  const getInfo = useGetKanjiInfoFn();
  const itemSettings = useDeferredItemSettings();
  const kanjiInfo = getInfo?.(kanji);
  const dontIncludeFreq =
    itemSettings.backgroundColorSettingDataSource == null ||
    itemSettings.backgroundColorSettingDataSource == "none";

  if (kanjiInfo == null) {
    return { loadingCn };
  }

  const dontIncludeJLPT = itemSettings.borderColorAttached === false;

  const freqData = kanjiInfo.frequency;
  const freqType = freqMap[itemSettings.backgroundColorSettingDataSource];
  const freqRank = freqType ? freqData[freqType] : undefined;
  const freqRankCategory = getFreqCategory(freqRank);

  const textColor =
    freqRankCategory > 3 || dontIncludeFreq
      ? "text-white"
      : "dark:text-white text-gray-700";
  const { jlpt } = kanjiInfo;

  const border = dontIncludeJLPT
    ? "border-[#fb02a8] border-opacity-10 dark:border-opacity-20"
    : JLPTListItems[jlpt].cnBorder;

  const bgColor =
    freqRankCategory === 0 && dontIncludeFreq === false
      ? "bg-background"
      : freqCategoryCn[freqRankCategory];

  const btnCnRaw = `${cn} ${border} ${bgColor} ${textColor}`;
  const btnCn =
    itemSettings.cardType === "compact"
      ? `${btnCnRaw} kanji-font`
      : `${btnCnRaw} border-8 flex flex-col justify-center items-center`;

  return { btnCn, itemType: itemSettings.cardType };
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
    const { loadingCn, btnCn, itemType } = useItemBtnCn(kanji);

    if (loadingCn) {
      return (
        <button
          ref={ref}
          className={loadingCn}
          role="status"
          aria-label="loading"
        />
      );
    }

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
