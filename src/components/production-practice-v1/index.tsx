import { lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";

const LazyProductionPracticeV1 = lazy(() => import("./ProductionPracticeV1"));

const PracticeRouteFallback = () => (
  <div className="fixed inset-0 bg-background animate-fade-in" aria-hidden />
);

const ProductionPracticeV1Screen = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PracticeRouteFallback />}>
        <LazyProductionPracticeV1 />
      </Suspense>
    </ErrorBoundary>
  );
};

export { ProductionPracticeV1Screen };
export default ProductionPracticeV1Screen;
