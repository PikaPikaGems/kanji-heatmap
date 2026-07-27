import "./JFonts.css";
import "./theme.css";

import { ThemeProvider } from "@/providers/theme-provider";
import { KanjiFunctionalityProvider } from "./providers/kanji-functionality-provider";
import {
  PracticeReturnPathMemory,
  Route,
  Switch,
} from "./components/dependent/routing";
import { Redirect } from "wouter";

import {
  ErrorBoundary,
  PageNotFound,
  DefaultErrorFallback,
} from "./components/error";
import { Header, FloatingIsland, PracticeFab } from "@/components/site-layout/";
import { PageFadeIn } from "@/components/dependent/site-wide/PageFadeIn";
import pageItems from "@/components/items/page-items";
import { GlobalKeyboardShortcutProvider } from "./providers/global-keyboard-shortcut-provider";

const {
  kanjiPage,
  cumUseGraphPage,
  dashboardPage,
  masteryPage,
  aboutPage,
  termsPage,
  privacyPage,
  speedKatakanaPage,
  recognitionPracticeV1Page,
  productionPracticeV1Page,
} = pageItems;

const RecognitionPracticeV1 = recognitionPracticeV1Page.Component;
const ProductionPracticeV1 = productionPracticeV1Page.Component;

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
          <KanjiFunctionalityProvider>
            <PracticeReturnPathMemory />
            <Switch>
              {/* Speed Katakana renders its own slim header, so it lives
                  outside the shared layout below. */}
              <Route
                path={speedKatakanaPage.href}
                component={speedKatakanaPage.Component}
              />
              {/* Recognition practice has its own header. */}
              <Route
                path={recognitionPracticeV1Page.href}
                component={RecognitionPracticeV1}
              />
              {/* Production (writing) practice has its own header + ONNX. */}
              <Route
                path={productionPracticeV1Page.href}
                component={ProductionPracticeV1}
              />
              <Route>
                <Header />
                <main className="min-h-dvh bg-background">
                  <ErrorBoundary
                    details="App"
                    fallback={
                      <div className="w-full pr-4 mt-14">
                        <DefaultErrorFallback />
                      </div>
                    }
                  >
                    <PageFadeIn>
                      <Switch>
                        <Route
                          path={dashboardPage.href}
                          component={dashboardPage.Component}
                        />
                        <Route
                          path={masteryPage.href}
                          component={masteryPage.Component}
                        />
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
                    </PageFadeIn>
                  </ErrorBoundary>
                </main>
                <FloatingIsland />
                <PracticeFab />
              </Route>
            </Switch>
          </KanjiFunctionalityProvider>
        </GlobalKeyboardShortcutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
