import { ReactNode, Suspense } from "react";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { ErrorBoundary } from "@/components/error";

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="pt-12 pb-20 px-2 h-dvh">
      <ErrorBoundary>
        <Suspense fallback={<KaomojiAnimation />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
};

export { PageWrapper };
