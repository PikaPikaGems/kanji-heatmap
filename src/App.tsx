import "./JFonts.css";
import "./theme.css";
import React from "react";

import { ThemeProvider } from "@/providers/theme-provider";
import { KanjiFunctionalityProvider } from "./providers/kanji-functionality-provider";
import { Route, Switch } from "./components/dependent/routing";
import { Redirect } from "wouter";

import {
  ErrorBoundary,
  PageNotFound,
  DefaultErrorFallback,
} from "./components/error";
import { Header } from "@/components/site-layout/";
import pageItems from "@/components/items/page-items";
import { GlobalKeyboardShortcutProvider } from "./providers/global-keyboard-shortcut-provider";

const LazyBottomBanner = React.lazy(
  () => import("./components/site-layout/BottomBanner")
);

const { kanjiPage, cumUseGraphPage, aboutPage, termsPage, privacyPage } =
  pageItems;

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
          <Header />
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
                    path={aboutPage.href}
                    component={aboutPage.Component}
                  />
                  <Route
                    path={termsPage.href}
                    component={termsPage.Component}
                  />
                  <Route
                    path={privacyPage.href}
                    component={privacyPage.Component}
                  />
                  <Route path="/docs">
                    <Redirect to="/about" />
                  </Route>
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
