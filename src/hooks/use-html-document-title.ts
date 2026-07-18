import { useEffect, useRef } from "react";

/**
 * A custom React hook that updates the document title.
 *
 * @param title - The title to set for the document
 */
function useHtmlDocumentTitle(title?: string): void {
  const previousTitle = useRef(document.title);

  // Effect needed: mutates document.title (external DOM) and restores the
  // previous title on unmount.
  useEffect(() => {
    document.title = title ? `${title} • Kanji Heatmap` : "Kanji Heatmap";

    const prevTitle = previousTitle.current;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

export default useHtmlDocumentTitle;
