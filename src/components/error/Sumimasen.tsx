export const Sumimasen = ({
  layout = "stacked",
}: {
  layout?: "stacked" | "inline";
}) => {
  if (layout === "inline") {
    return (
      <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
        <span className="text-3xl leading-none kanji-font">すみません</span>
        <span className="text-2xl leading-none" aria-hidden="true">
          {"🙏🏽 🙇"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-3xl leading-none kanji-font">すみません</span>
      <span className="text-3xl leading-none" aria-hidden="true">
        {"🙏🏽 🙇"}
      </span>
    </div>
  );
};
