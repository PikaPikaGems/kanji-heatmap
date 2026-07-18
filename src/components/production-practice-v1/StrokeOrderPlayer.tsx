import { StrokeOrderReplay } from "@/components/common/KanjiDmak";

export const StrokeOrderPlayer = ({
  kanji,
  size = 160,
}: {
  kanji: string;
  size?: number;
}) => (
  <div className="flex flex-col items-center gap-2">
    <StrokeOrderReplay
      kanji={kanji}
      size={size}
      buttonRowClassName="flex justify-center space-x-1.5 sm:space-x-2"
      buttonClassName="w-10 h-10 sm:h-12 sm:w-12"
    />
  </div>
);
