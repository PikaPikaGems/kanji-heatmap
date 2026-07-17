import { ReactNode, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/error";

/** Full-page route loading state — vertically centered in the viewport. */
export const PageLoadingFallback = () => (
  <div
    className="flex flex-1 w-full items-center justify-center"
    role="status"
    aria-label="Loading"
  >
    <Loader2 className="size-7 animate-spin" />
  </div>
);

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col bg-background pt-12 pb-28 px-2">
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
};

export { PageWrapper };
