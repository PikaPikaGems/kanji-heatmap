import type React from "react";
import { useState, useCallback, useEffect } from "react";

type CopyStatus = "inactive" | "copied" | "failed";

export function useCopyToClipboard(resetInterval = 500) {
  const [text, setText] = useState<string>("");
  const [status, setStatus] = useState<CopyStatus>("inactive");

  const copy = useCallback(async (value: string, e?: React.MouseEvent) => {
    // Stop event propagation to prevent popover from closing

    try {
      // Check if we're in a browser environment
      if (typeof navigator !== "undefined") {
        // Modern browsers - Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          // Fallback for older browsers

          if (e == undefined) {
            return;
          }
          const targetElement = e.target as HTMLElement;
          // Get the parent element

          const parentElement = targetElement.parentElement;

          const textArea = document.createElement("textarea");
          textArea.value = value;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";

          if (parentElement == null) {
            return;
          }
          parentElement.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          parentElement.removeChild(textArea);
        }

        setText(value);
        setStatus("copied");
      }
    } catch (error) {
      console.error("Failed to copy text: ", error);
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    if (status === "inactive") return;

    const timer = setTimeout(() => {
      setStatus("inactive");
    }, resetInterval);

    return () => clearTimeout(timer);
  }, [status, resetInterval]);

  return { text, copy, status };
}
