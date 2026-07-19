import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazyRecognitionPracticeV1 = lazy(() => import("./RecognitionPracticeV1"));

const RecognitionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyRecognitionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { RecognitionPracticeV1Screen };
export default RecognitionPracticeV1Screen;
