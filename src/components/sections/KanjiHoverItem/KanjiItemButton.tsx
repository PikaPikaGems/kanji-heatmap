import { forwardRef } from "react";
import { ReportBugIconBtn } from "@/components/common/ReportBugIconBtn";
import {
  loadingCn,
  useItemBtnCn,
  useItemType,
} from "./kanji-item-button-hooks";
import { ExpandedBtnContent } from "./ExpandedBtnContent";
import { useSetOpenedParam } from "@/hooks/routing-hooks";

export const KanjiBtnErrorFallback = () => {
  return (
    <div className={`${loadingCn} h-full`}>
      <ReportBugIconBtn />
    </div>
  );
};

interface TriggerProps {
  onClick?: () => void;
  kanji: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// forwardRef required: rendered as the child of `<HoverCardTrigger asChild>`
// in HoverKanji — Radix injects a ref to anchor the hover card to this button.
const KanjiItemButton = forwardRef<HTMLButtonElement, TriggerProps>(
  (props, ref) => {
    const { kanji, onClick, ...rest } = props;
    const btnCn = useItemBtnCn(kanji);
    const itemType = useItemType();
    const setKanji = useSetOpenedParam();

    if (itemType === "compact") {
      return (
        <button
          className={`${btnCn}`}
          onClick={() => {
            onClick?.();
            setKanji(kanji);
          }}
          ref={ref}
          {...rest}
        >
          {kanji}
        </button>
      );
    }

    return (
      <button
        className={`${btnCn}`}
        onClick={() => {
          onClick?.();
          setKanji(kanji);
        }}
        ref={ref}
        {...rest}
      >
        <ExpandedBtnContent kanji={kanji} />
      </button>
    );
  }
);

KanjiItemButton.displayName = "KanjiItemButton";

const KanjiItemSimpleButton = ({
  kanji,
  onClick,
}: {
  kanji: string;
  onClick: () => void;
}) => {
  const btnCn = useItemBtnCn(kanji);
  const setKanji = useSetOpenedParam();

  return (
    <button
      className={`${btnCn} flex flex-col justify-center items-center w-full `}
      onClick={() => {
        onClick();
        setKanji(kanji);
      }}
    >
      <ExpandedBtnContent kanji={kanji} />
    </button>
  );
};

export { KanjiItemButton, KanjiItemSimpleButton };
