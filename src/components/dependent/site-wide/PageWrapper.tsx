import { ReactNode, Suspense } from "react";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { ErrorBoundary } from "@/components/error";

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-dvh bg-background pt-12 pb-20 px-2">
      <ErrorBoundary>
        <Suspense fallback={<KaomojiAnimation />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
};

export { PageWrapper };
