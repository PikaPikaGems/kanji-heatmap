import { lazy } from "react";
import { PageWrapper } from "@/components/dependent/site-wide/PageWrapper";

const LazyDashboardScreen = lazy(() => import("./DashboardScreen"));

const DashboardScreen = () => (
  <PageWrapper>
    <LazyDashboardScreen />
  </PageWrapper>
);

export { DashboardScreen };
