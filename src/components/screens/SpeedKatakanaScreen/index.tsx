import { lazy, Suspense } from "react";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { ErrorBoundary } from "@/components/error";

const LazySpeedKatakanaScreen = lazy(() => import("./SpeedKatakanaScreen"));

const SpeedKatakanaScreen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<KaomojiAnimation />}>
        <LazySpeedKatakanaScreen />
      </Suspense>
    </ErrorBoundary>
  );
};

export { SpeedKatakanaScreen };
