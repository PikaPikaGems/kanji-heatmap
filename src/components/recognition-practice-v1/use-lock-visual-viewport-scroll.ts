import { useEffect } from "react";

/**
 * Keeps a play shell pinned to the layout top while the iOS soft keyboard
 * opens, instead of chasing visualViewport.offsetTop.
 */
export const useLockVisualViewportScroll = () => {
  // Effect needed (external DOM): chasing visualViewport.offsetTop while iOS
  // animates the keyboard makes the whole UI bob; "/" doesn't do that because
  // ListScreen isn't viewport-pinned at all.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const lockScroll = () => {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    vv.addEventListener("scroll", lockScroll);
    vv.addEventListener("resize", lockScroll);
    lockScroll();
    return () => {
      vv.removeEventListener("scroll", lockScroll);
      vv.removeEventListener("resize", lockScroll);
    };
  }, []);
};
