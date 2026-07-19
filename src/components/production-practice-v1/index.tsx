import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const LazyProductionPracticeV1 = lazy(() => import("./ProductionPracticeV1"));

const ProductionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <LazyProductionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { ProductionPracticeV1Screen };
export default ProductionPracticeV1Screen;
