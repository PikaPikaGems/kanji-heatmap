import { lazy } from "react";
import { PageWrapper } from "@/components/dependent/site-wide/PageWrapper";

const LazyMasteryScreen = lazy(() => import("./MasteryScreen"));

const MasteryScreen = () => (
  <PageWrapper>
    <LazyMasteryScreen />
  </PageWrapper>
);

export { MasteryScreen };
