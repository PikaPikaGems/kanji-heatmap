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
import {
  BottomBanner,
  Header,
  FloatingIsland,
  PracticeFab,
} from "@/components/site-layout/";
import { PageFadeIn } from "@/components/dependent/site-wide/PageFadeIn";
import pageItems from "@/components/items/page-items";
import { GlobalKeyboardShortcutProvider } from "./providers/global-keyboard-shortcut-provider";
import { useAiVoiceStartup } from "@/hooks/use-ai-voice";
import { LoginDialog } from "@/components/dependent/account/LoginDialog";
import { FsrsSettingsDialog } from "@/components/dependent/fsrs-settings/FsrsSettingsDialog";
import { SyncOperationsDialog } from "@/components/dependent/sync-operations/SyncOperationsDialog";
import { WriteBlockedDialog } from "@/components/dependent/account/WriteBlockedDialog";
import { RecoveryDialog } from "@/components/dependent/account/RecoveryDialog";
import { LogoutDialog } from "@/components/dependent/account/LogoutDialog";
import { LoggingOutScreen } from "@/components/dependent/account/LoggingOutScreen";

const {
  kanjiPage,
  cumUseGraphPage,
  dashboardPage,
  masteryPage,
  aboutPage,
  termsPage,
  privacyPage,
  speedKatakanaPage,
  fillTheKanjiPage,
  recognitionPracticeV1Page,
  productionPracticeV1Page,
  readingMasteryPage,
  writingMasteryPage,
} = pageItems;

const RecognitionPracticeV1 = recognitionPracticeV1Page.Component;
const ProductionPracticeV1 = productionPracticeV1Page.Component;

const App = () => {
  useAiVoiceStartup();

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
              {/* Fill in the Kanji uses the shared practice shell + header. */}
              <Route
                path={fillTheKanjiPage.href}
                component={fillTheKanjiPage.Component}
              />
              {/* The game's old URL (bookmarks, installed shortcuts). */}
              <Route path="/fill-the-kanji">
                <Redirect
                  to={`${fillTheKanjiPage.href}${window.location.search}`}
                  replace
                />
              </Route>
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
              {/* Mastery games (review pile) share the practice shell. */}
              <Route
                path={readingMasteryPage.href}
                component={readingMasteryPage.Component}
              />
              <Route
                path={writingMasteryPage.href}
                component={writingMasteryPage.Component}
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
            {/* Outside the Switch so it also shows on the game screens. */}
            <BottomBanner />
            {/* Also outside the Switch: any screen can open these. */}
            <LoginDialog />
            <RecoveryDialog />
            <LogoutDialog />
            <LoggingOutScreen />
            <FsrsSettingsDialog />
            <SyncOperationsDialog />
            <WriteBlockedDialog />
          </KanjiFunctionalityProvider>
        </GlobalKeyboardShortcutProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
