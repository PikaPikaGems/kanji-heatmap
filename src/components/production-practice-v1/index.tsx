import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PracticeRouteLoadingFallback } from "@/components/shared-practice/PracticeRouteLoadingFallback";

const LazyProductionPracticeV1 = lazy(() => import("./ProductionPracticeV1"));

const ProductionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={<PracticeRouteLoadingFallback label="writing practice" />}
      >
        <LazyProductionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { ProductionPracticeV1Screen };
export default ProductionPracticeV1Screen;
