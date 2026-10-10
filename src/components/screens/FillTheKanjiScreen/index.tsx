import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazyFillTheKanjiScreen = lazy(() => import("./FillTheKanjiScreen"));

const FillTheKanjiScreen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyFillTheKanjiScreen />
      </Suspense>
    </ErrorBoundary>
  );
};

export { FillTheKanjiScreen };
