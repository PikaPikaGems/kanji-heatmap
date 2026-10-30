import { lazy, Suspense } from "react";
import { ListScreenFallback } from "./ListScreenFallback";

const LazyListScreen = lazy(() =>
  import("./ListScreen").then((m) => ({ default: m.ListScreen }))
);

const ListScreen = () => (
  <Suspense fallback={<ListScreenFallback />}>
    <LazyListScreen />
  </Suspense>
);

export { ListScreen };
