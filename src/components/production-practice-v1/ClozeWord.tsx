/** Word with the target kanji blanked as "?", or revealed after feedback. */
export const ClozeWord = ({
  word,
  kanji,
  fontIndex,
  revealed = false,
}: {
  word: string;
  kanji: string;
  fontIndex: number | null;
  /** When true, show the real kanji instead of the "?" blank. */
  revealed?: boolean;
}) => {
  const idx = word.indexOf(kanji);
  const before = idx === -1 ? "" : word.slice(0, idx);
  const after = idx === -1 ? word : word.slice(idx + kanji.length);
  const displayLen = before.length + after.length + 1;

  const sizeClass =
    displayLen > 6
      ? "text-4xl sm:text-5xl md:text-6xl"
      : displayLen < 3
        ? "text-6xl sm:text-7xl md:text-8xl"
        : "text-5xl sm:text-6xl md:text-7xl";

  return (
    <p
      className={`flex flex-wrap items-center justify-center max-w-full leading-tight ${sizeClass} ${
        fontIndex === null ? "kanji-font" : ""
      }`}
      style={
        fontIndex === null
          ? undefined
          : {
              fontFamily: `var(--jap-font-${fontIndex}), "Noto Sans JP", system-ui`,
            }
      }
    >
      {before ? <span className="break-all">{before}</span> : null}
      {revealed ? (
        <span className="mx-0.5">{kanji}</span>
      ) : (
        <span
          className="inline-flex items-center justify-center mx-1 min-w-[1.25em] px-2 pt-1 pb-4 border-2 border-dotted rounded-xl border-foreground/70 align-middle"
          aria-label="missing kanji"
        >
          ?
        </span>
      )}
      {after ? <span className="break-all">{after}</span> : null}
    </p>
  );
};
