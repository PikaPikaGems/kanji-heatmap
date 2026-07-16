import { Bug } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";
import { ReactNode } from "react";

const BugIconFallback = () => (
  <div className="flex items-center justify-center w-8 h-8 rounded-xl border border-muted text-muted-foreground">
    <Bug className="w-4 h-4" />
  </div>
);

export const BugIconErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary fallback={<BugIconFallback />}>{children}</ErrorBoundary>
);
