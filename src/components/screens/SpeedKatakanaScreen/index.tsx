import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";

const LazySpeedKatakanaScreen = lazy(() => import("./SpeedKatakanaScreen"));

const PracticeRouteFallback = () => (
  <div className="fixed inset-0 bg-background animate-fade-in" aria-hidden />
);

const SpeedKatakanaScreen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PracticeRouteFallback />}>
        <LazySpeedKatakanaScreen />
      </Suspense>
    </ErrorBoundary>
  );
};

export { SpeedKatakanaScreen };
