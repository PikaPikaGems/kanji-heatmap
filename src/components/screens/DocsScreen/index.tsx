import { lazy } from "react";
import { PageWrapper } from "@/components/dependent/site-wide/PageWrapper";

const LazyAboutPage = lazy(() =>
  import("./DocsScreen").then((m) => ({ default: m.AboutPage }))
);
const LazyTermsPage = lazy(() =>
  import("./DocsScreen").then((m) => ({ default: m.TermsPage }))
);
const LazyPrivacyPage = lazy(() =>
  import("./DocsScreen").then((m) => ({ default: m.PrivacyPage }))
);

const AboutScreen = () => (
  <PageWrapper>
    <LazyAboutPage />
  </PageWrapper>
);

const TermsScreen = () => (
  <PageWrapper>
    <LazyTermsPage />
  </PageWrapper>
);

const PrivacyScreen = () => (
  <PageWrapper>
    <LazyPrivacyPage />
  </PageWrapper>
);

export { AboutScreen, TermsScreen, PrivacyScreen };
