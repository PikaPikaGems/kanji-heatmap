import { ReactNode, useEffect, useRef } from "react";

/** Banner height, so bottom-pinned UI (FloatingIsland, PracticeFab) can sit above it. */
const HEIGHT_VAR = "--bottom-banner-height";

/** `wide` fills the full-width bar (md and up); `narrow` the phone pill. */
export const BottomBannerLayout = ({
  wide,
  narrow,
}: {
  wide: ReactNode;
  narrow: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Effect needed: measures the visible banner (it wraps on narrow phones)
  // into a CSS variable, and clears it when the banner goes away.
  useEffect(() => {
    const root = document.documentElement;
    const bars = [...(ref.current?.children ?? [])];
    const update = () =>
      root.style.setProperty(
        HEIGHT_VAR,
        `${Math.max(0, ...bars.map((el) => el.getBoundingClientRect().height))}px`
      );
    const observer = new ResizeObserver(update);
    bars.forEach((el) => observer.observe(el));
    update();
    return () => {
      observer.disconnect();
      root.style.removeProperty(HEIGHT_VAR);
    };
  }, []);

  return (
    <div role="status" ref={ref}>
      <div className="fixed-viewport-layer fix-scroll-layout-shift-right hidden md:block fixed z-50 bottom-0 left-0 bg-foreground text-background w-full text-sm text-center font-extrabold px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {wide}
      </div>
      <div
        style={{ bottom: "env(safe-area-inset-bottom)" }}
        className="fixed-viewport-layer fixed z-50 flex items-center justify-center w-full pointer-events-none md:hidden fix-scroll-layout-shift-right"
      >
        <div
          style={{ width: "calc(100vw - 30px)" }}
          className="flex items-center justify-center my-1 text-xs font-extrabold"
        >
          <div className="px-4 py-1 text-center pointer-events-auto bg-foreground text-background rounded-xl w-fit">
            {narrow}
          </div>
        </div>
      </div>
    </div>
  );
};
