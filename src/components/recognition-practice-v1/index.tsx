import { lazy, Suspense } from "react";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { ErrorBoundary } from "@/components/error";

const LazyRecognitionPracticeV1 = lazy(() => import("./RecognitionPracticeV1"));

const RecognitionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<KaomojiAnimation />}>
        <LazyRecognitionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { RecognitionPracticeV1Screen };
export default RecognitionPracticeV1Screen;
