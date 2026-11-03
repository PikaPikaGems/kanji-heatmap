import { lazy, Suspense } from "react";
import { ListScreenFallback } from "../ListScreen/ListScreenFallback";

const LazyMasteryScreen = lazy(() => import("./MasteryScreen"));

const MasteryScreen = () => (
  <Suspense fallback={<ListScreenFallback />}>
    <LazyMasteryScreen />
  </Suspense>
);

export { MasteryScreen };
