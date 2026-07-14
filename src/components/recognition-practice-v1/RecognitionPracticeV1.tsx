import { useEffect, useRef, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { useSetOpenedParam } from "@/components/dependent/routing/routing-hooks";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { PracticeHeader } from "@/components/site-layout/PracticeHeader";
import { shuffle } from "@/lib/utils";
import { InitialScreen } from "./InitialScreen";
import { Game } from "./Game";
import { EndSession } from "./EndSession";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import { withFreshFonts } from "./build-deck";
import {
  Phase,
  PracticeItem,
  RecognitionPracticeSettings,
  SessionResult,
} from "./types";

const RecognitionPracticeV1 = () => {
  useHtmlDocumentTitle("Recognition Practice (beta)");

  const [settings] = useLocalStorage<RecognitionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [phase, setPhase] = useState<Phase>("initial");
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState<PracticeItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [sessionItems, setSessionItems] = useState<PracticeItem[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [results, setResults] = useState<SessionResult[] | null>(null);
  const setOpenedKanji = useSetOpenedParam();

  const viewport = useVisualViewport();
  const primerRef = useRef<HTMLInputElement | null>(null);

  // Kanji details drawer only on end screen; clear open param when leaving ended
  useEffect(() => {
    if (phase !== "ended") {
      setOpenedKanji(null);
    }
  }, [phase, setOpenedKanji]);

  const beginPlaying = (items: PracticeItem[], nextCursor: number) => {
    setSessionItems(items);
    setCursor(nextCursor);
    setSessionKey((k) => k + 1);
    setProgress(0);
    setResults(null);
    setPhase("playing");
  };

  const goToInitial = () => {
    setProgress(0);
    setResults(null);
    setDeck([]);
    setCursor(0);
    setSessionItems([]);
    setPhase("initial");
  };

  const startGame = (builtDeck: PracticeItem[]) => {
    primerRef.current?.focus();
    setDeck(builtDeck);
    const chunk = builtDeck.slice(0, SESSION_SIZE);
    beginPlaying(chunk, chunk.length);
  };

  const finishSession = (sessionResults: SessionResult[]) => {
    setResults(sessionResults);
    setPhase("ended");
  };

  const startNextSession = () => {
    primerRef.current?.focus();

    const forgottens = (results ?? [])
      .filter((r) => !r.correct)
      .map(
        ({ kanji, word, reading, englishGloss, keyword, fontIndex }) =>
          ({
            kanji,
            word,
            reading,
            englishGloss,
            keyword,
            fontIndex,
          }) satisfies PracticeItem
      );

    let workingDeck = deck;
    let workingCursor = cursor;

    if (workingCursor >= workingDeck.length && forgottens.length === 0) {
      workingDeck = withFreshFonts(shuffle([...deck]), settings.randomizeFont);
      workingCursor = 0;
      setDeck(workingDeck);
    }

    const remaining = workingDeck.slice(workingCursor);
    let pool = [...forgottens, ...remaining];

    if (pool.length === 0) {
      workingDeck = withFreshFonts(shuffle([...deck]), settings.randomizeFont);
      setDeck(workingDeck);
      pool = workingDeck;
      workingCursor = 0;
    }

    const chunk = pool.slice(0, SESSION_SIZE);
    const fromRemaining = Math.max(0, chunk.length - forgottens.length);
    beginPlaying(chunk, workingCursor + fromRemaining);
  };

  return (
    <>
      <input
        ref={primerRef}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
      />
      <div
        className="fixed inset-x-0 flex flex-col overflow-hidden bg-background"
        style={{ top: viewport.offsetTop, height: viewport.height }}
      >
        <PracticeHeader progress={progress} />
        <main className="flex-1 min-h-0 py-2 overflow-hidden">
          {phase === "initial" && (
            <div key="initial" className="h-full animate-fade-in">
              <InitialScreen onStart={startGame} />
            </div>
          )}

          {phase === "playing" && sessionItems.length > 0 && (
            <div key={`playing-${sessionKey}`} className="h-full animate-fade-in">
              <Game
                sessionItems={sessionItems}
                blurEnglishGloss={settings.blurEnglishGloss}
                sound={
                  settings.sound ?? { enabled: true, type: "correct" }
                }
                onProgress={setProgress}
                onComplete={finishSession}
              />
            </div>
          )}

          {phase === "ended" && results && (
            <div key="ended" className="h-full animate-fade-in">
              <EndSession
                results={results}
                onNext={startNextSession}
                onEnd={goToInitial}
              />
            </div>
          )}
        </main>
      </div>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default RecognitionPracticeV1;
