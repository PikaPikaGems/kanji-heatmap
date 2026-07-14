import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";

const LazyRecognitionPracticeV1 = lazy(() => import("./RecognitionPracticeV1"));

const PracticeRouteFallback = () => (
  <div className="fixed inset-0 bg-background animate-fade-in" aria-hidden />
);

const RecognitionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PracticeRouteFallback />}>
        <LazyRecognitionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { RecognitionPracticeV1Screen };
export default RecognitionPracticeV1Screen;
