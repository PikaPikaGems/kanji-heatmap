import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "@/components/error";
import { PageLoadingFallback } from "@/components/dependent/site-wide/PageLoadingFallback";

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col px-2 pt-12 min-h-dvh bg-background pb-28">
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
};

export { PageWrapper };
