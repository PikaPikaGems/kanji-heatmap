import LoadingKanjis from "./KanjiList/LoadingKanjis";

/** Reserves ControlBar space so nav from other routes doesn't flash empty. */
export const ListScreenFallback = () => (
  <>
    <div className="fixed-viewport-layer fix-scroll-layout-shift-right fixed w-full pt-12 pb-2 z-40 bg-background">
      <section className="mx-auto max-w-screen-xl flex border-0 space-x-1 sticky pt-1 pl-2 pr-1 w-full">
        <div
          className="h-9 flex-1 min-w-0 rounded-md border bg-muted/40 animate-pulse"
          aria-hidden
        />
        <div
          className="h-9 w-9 shrink-0 rounded-md border bg-muted/40 animate-pulse"
          aria-hidden
        />
        <div
          className="h-9 w-9 shrink-0 rounded-md border bg-muted/40 animate-pulse"
          aria-hidden
        />
      </section>
    </div>
    <div className="relative pt-24 -z-0 min-h-48 overflow-x-hidden">
      <LoadingKanjis />
    </div>
  </>
);
