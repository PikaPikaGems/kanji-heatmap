import "./JFonts.css";
import React from "react";

import { ThemeProvider } from "@/providers/theme-provider";
import { KanjiFunctionalityProvider } from "./providers/kanji-functionality-provider";
import { useUrlLocation } from "./components/dependent/routing/routing-hooks";
import { Route, Switch } from "./components/dependent/routing";

import {
  ErrorBoundary,
  PageNotFound,
  DefaultErrorFallback,
} from "./components/error";
import { Header, Nav } from "@/components/site-layout/";
import pageItems from "@/components/items/page-items";

import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { docPages } from "./components/items/nav-items";
import { GlobalKeyboardShortcutProvider } from "./providers/global-keyboard-shortcut-provider";

const LazyBottomBanner = React.lazy(
  () => import("./components/site-layout/BottomBanner")
);

const { kanjiPage, cumUseGraphPage } = pageItems;

export const NavBar = () => {
  const location = useUrlLocation();

  const triggerTitle =
    [kanjiPage, cumUseGraphPage].find((item) => item.href === location)
      ?.title ?? "Menu";

  return (
    <Nav
      triggerTitle={triggerTitle}
      navItems={[kanjiPage, cumUseGraphPage]}
      footer={
        <>
          <ExternalTextLink
            href={`${pageItems.docsPage.href}${docPages.about.hash}`}
            text={docPages.about.title}
          />
          <ExternalTextLink
            href={`${pageItems.docsPage.href}${docPages.terms.hash}`}
            text={docPages.terms.title}
          />
          <ExternalTextLink
            href={`${pageItems.docsPage.href}${docPages.privacy.hash}`}
            text={docPages.privacy.title}
          />
        </>
      }
    />
  );
};

const App = () => {
  return (
    <ErrorBoundary
      details="App"
      fallback={
        <div className="w-full pr-4">
          <DefaultErrorFallback />
        </div>
      }
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <GlobalKeyboardShortcutProvider>
          <Header nav={<NavBar />} />
          <main className="bg-background">
            <ErrorBoundary
              details="App"
              fallback={
                <div className="w-full pr-4 mt-14">
                  <DefaultErrorFallback />
                </div>
              }
            >
              <KanjiFunctionalityProvider>
                <Switch>
                  <Route
                    path={cumUseGraphPage.href}
                    component={cumUseGraphPage.Component}
                  />
                  <Route
                    path={kanjiPage.href}
                    component={kanjiPage.Component}
                  />
                  <Route
                    path={pageItems.docsPage.href}
                    component={pageItems.docsPage.Component}
                  />
                  <Route path="*">
                    <div className="w-full pr-4 mt-14">
                      <PageNotFound />
                    </div>
                  </Route>
                </Switch>
              </KanjiFunctionalityProvider>
            </ErrorBoundary>
          </main>
        </GlobalKeyboardShortcutProvider>
      </ThemeProvider>
      <LazyBottomBanner />
    </ErrorBoundary>
  );
};

export default App;
