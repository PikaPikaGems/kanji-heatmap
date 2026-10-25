import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazyReadingMastery = lazy(() => import("./ReadingMastery"));
const LazyWritingMastery = lazy(() => import("./WritingMastery"));

const ReadingMasteryScreen = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyReadingMastery />
    </Suspense>
  </ErrorBoundary>
);

const WritingMasteryScreen = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyWritingMastery />
    </Suspense>
  </ErrorBoundary>
);

export { ReadingMasteryScreen, WritingMasteryScreen };
