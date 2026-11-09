import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazyReadingMastery = lazy(() => import("./ReadingMastery"));
const LazyReadingMastery2 = lazy(() => import("./ReadingMastery2"));
const LazyWritingMastery = lazy(() => import("./WritingMastery"));

const ReadingMasteryScreen = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyReadingMastery />
    </Suspense>
  </ErrorBoundary>
);

const ReadingMastery2Screen = () => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoadingFallback />}>
      <LazyReadingMastery2 />
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

export { ReadingMasteryScreen, ReadingMastery2Screen, WritingMasteryScreen };
