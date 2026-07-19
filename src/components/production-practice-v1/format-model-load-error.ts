/** True when ORT failed because the WASM heap could not be allocated. */
export const isOrtWasmOutOfMemoryError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error ?? "");
  return /out of memory/i.test(message);
};

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
      "ort: onnxruntime-web@^1.27 (wasm numThreads=1)",
    ];
    if (error.stack) {
      lines.push("", "stack:", error.stack);
    }
    return lines.join("\n");
  }

  // ORT/Emscripten sometimes rejects with a bare number (wasm abort code).
  const detail =
    typeof error === "number"
      ? `numeric abort ${error} (0x${error.toString(16)})`
      : String(error);

  return [
    "DaKanji model warmup failed",
    "───────────────────────────",
    `time: ${now}`,
    `url: ${href}`,
    `error: ${detail}`,
    `ua: ${ua}`,
    "ort: onnxruntime-web@^1.27 (wasm numThreads=1)",
  ].join("\n");
};
