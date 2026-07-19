import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazySpeedKatakanaScreen = lazy(() => import("./SpeedKatakanaScreen"));

const SpeedKatakanaScreen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <LazySpeedKatakanaScreen />
      </Suspense>
    </ErrorBoundary>
  );
};

export { SpeedKatakanaScreen };
