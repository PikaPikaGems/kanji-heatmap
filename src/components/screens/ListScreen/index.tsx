import { lazy, Suspense } from "react";

const LazyListScreen = lazy(() =>
  import("./ListScreen").then((m) => ({ default: m.ListScreen }))
);

/** Reserves ControlBar space so nav from other routes doesn't flash empty. */
const ListScreenFallback = () => (
  <>
    <div className="fix-scroll-layout-shift-right fixed top-0 left-0 w-full pt-[calc(var(--app-header-height)+env(safe-area-inset-top,0px))] pb-2 z-40 bg-background">
      <section className="mx-auto max-w-screen-xl flex border-0 space-x-1 pt-1 pl-2 pr-1 w-full">
        <div
          className="h-9 flex-1 min-w-0 rounded-md border bg-muted/40"
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
    <div
      className="relative pt-[calc(6rem+env(safe-area-inset-top,0px))] -z-0 flex min-h-48 items-center justify-center overflow-x-hidden"
      role="status"
      aria-label="Loading"
    />
  </>
);

const ListScreen = () => (
  <Suspense fallback={<ListScreenFallback />}>
    <LazyListScreen />
  </Suspense>
);

export { ListScreen };
