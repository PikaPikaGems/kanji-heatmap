import { lazy, Suspense } from "react";

const LazyListScreen = lazy(() =>
  import("./ListScreen").then((m) => ({ default: m.ListScreen }))
);

// Keep this shell light — LoadingKanjis pulls item-settings/virtual-list hooks
// that belong in the ListScreen chunk, not the app entry.
const ListScreenFallback = () => (
  <div
    className="relative pt-24 -z-0 flex min-h-48 items-center justify-center overflow-x-hidden"
    role="status"
    aria-label="Loading"
  />
);

const ListScreen = () => (
  <Suspense fallback={<ListScreenFallback />}>
    <LazyListScreen />
  </Suspense>
);

export { ListScreen };
