import ErrorBoundary from "./ErrorBoundary";
import { ReactNode } from "react";
import { ReportBugIconBtn } from "../common/ReportBugIconBtn";

export const BugIconErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary fallback={<ReportBugIconBtn />}>{children}</ErrorBoundary>
);
