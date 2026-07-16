import { ReactNode, Suspense } from "react";
import KaomojiAnimation from "@/components/common/KaomojiLoading";
import { ErrorBoundary } from "@/components/error";

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-dvh bg-background pt-[calc(var(--app-header-height)+env(safe-area-inset-top,0px))] pb-28 px-2">
      <ErrorBoundary>
        <Suspense fallback={<KaomojiAnimation />}>{children}</Suspense>
      </ErrorBoundary>
    </div>
  );
};

export { PageWrapper };
