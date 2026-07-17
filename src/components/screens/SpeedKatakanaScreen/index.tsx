import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PracticeRouteLoadingFallback } from "@/components/shared-practice/PracticeRouteLoadingFallback";

const LazySpeedKatakanaScreen = lazy(() => import("./SpeedKatakanaScreen"));

const SpeedKatakanaScreen = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={<PracticeRouteLoadingFallback label="speed katakana" />}
      >
        <LazySpeedKatakanaScreen />
      </Suspense>
    </ErrorBoundary>
  );
};

export { SpeedKatakanaScreen };
