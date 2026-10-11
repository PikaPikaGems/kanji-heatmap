export const cnSquare =
  "rounded-sm border border-opacity-50 border-gray-500 dark:border-gray-600 dark:border-opacity-50";

export const cnTextLink =
  "underline hover:bg-neon-accent hover:text-black rounded-md p-1";

export const cnDottedUnderlineTrigger =
  "inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-4 hover:bg-neon-accent hover:text-black px-1 rounded-lg";

/** Same focus ring as the text inputs (foreground-ish `--ring`). */
export const cnFocusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Selectable option tile (fonts, voice engine, voice presets): solid theme
 * border when selected, a light dashed one otherwise.
 */
export const cnOptionTile = (selected: boolean) =>
  [
    "rounded-xl border transition-colors",
    cnFocusRing,
    selected
      ? "border-theme-color-with-opacity-100 background-theme-color-with-opacity-25"
      : "border-dashed border-muted-foreground/40 hover:bg-accent hover:border-muted-foreground/70",
  ].join(" ");

export const themeColors = {
  pink: "#fb02a8",
  neonAccent: "#2effff",
  lime: "#a3e635",
};
