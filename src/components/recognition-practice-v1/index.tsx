import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PracticeRouteLoadingFallback } from "@/components/shared-practice/PracticeRouteLoadingFallback";

const LazyRecognitionPracticeV1 = lazy(() => import("./RecognitionPracticeV1"));

const RecognitionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={<PracticeRouteLoadingFallback label="recognition practice" />}
      >
        <LazyRecognitionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { RecognitionPracticeV1Screen };
export default RecognitionPracticeV1Screen;
