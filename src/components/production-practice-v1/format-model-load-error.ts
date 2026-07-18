export const formatModelLoadErrorReport = (error: unknown): string => {
  const now = new Date().toISOString();
  const href =
    typeof window !== "undefined" ? window.location.href : "(unknown)";
  const ua =
    typeof navigator !== "undefined" ? navigator.userAgent : "(unknown)";

  if (error instanceof Error) {
    const lines = [
      "DaKanji model warmup failed",
      "───────────────────────────",
      `time: ${now}`,
      `url: ${href}`,
      `name: ${error.name}`,
      `message: ${error.message}`,
      `ua: ${ua}`,
    ];
    if (error.stack) {
      lines.push("", "stack:", error.stack);
    }
    return lines.join("\n");
  }

  return [
    "DaKanji model warmup failed",
    "───────────────────────────",
    `time: ${now}`,
    `url: ${href}`,
    `error: ${String(error)}`,
    `ua: ${ua}`,
  ].join("\n");
};
