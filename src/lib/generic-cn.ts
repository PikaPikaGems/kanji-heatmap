export const cnSquare =
  "rounded-sm border border-opacity-50 border-gray-500 dark:border-gray-600 dark:border-opacity-50";

export const cnTextLink =
  "underline hover:bg-neon-accent hover:text-black rounded-md p-1";

export const cnDottedUnderlineTrigger =
  "inline-flex items-center gap-1 leading-loose underline cursor-pointer decoration-dotted underline-offset-4 hover:bg-neon-accent hover:text-black px-1 rounded-lg";

/**
 * Diagonal stripes for "nothing to show here": /mastery tiles with nothing to
 * color, and the progress table's "No 2nd word" cell.
 */
export const cnHatched =
  "bg-[repeating-linear-gradient(135deg,hsl(var(--foreground)/0.14)_0_2px,transparent_2px_8px)]";

export const themeColors = {
  pink: "#fb02a8",
  neonAccent: "#2effff",
  lime: "#a3e635",
};

/**
 * The one warning / error text color (warnings-bold-yellow.mdc). Change it
 * here to restyle every warning on the site.
 */
export const cnWarningTextColor = "text-yellow-600 dark:text-yellow-400";

/** Warning / error text: always bold, in the warning color. */
export const cnWarningText = `font-bold ${cnWarningTextColor}`;
