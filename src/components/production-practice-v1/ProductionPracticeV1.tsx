import { useEffect, useState } from "react";
import useHtmlDocumentTitle from "@/hooks/use-html-document-title";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSetOpenedParam } from "@/components/dependent/routing/routing-hooks";
import KanjiDrawerGlobal from "@/components/screens/ListScreen/Drawer/KanjiDrawerGlobal";
import { EndSession, PracticeShell } from "@/components/shared-practice";
import { warmupDaKanji } from "@/lib/dakanji-adapter";
import { InitialScreen } from "./InitialScreen";
import { ModelLoadingScreen } from "./ModelLoadingScreen";
import { Game } from "./Game";
import { DEFAULT_SETTINGS, SESSION_SIZE, SETTINGS_KEY } from "./constants";
import {
  Phase,
  PracticeItem,
  ProductionPracticeSettings,
  SessionResult,
} from "./types";

const ProductionPracticeV1 = () => {
  useHtmlDocumentTitle("Kanji Production");

  const [settings] = useLocalStorage<ProductionPracticeSettings>(
    SETTINGS_KEY,
    DEFAULT_SETTINGS
  );
  const [phase, setPhase] = useState<Phase>("initial");
  const [loadStatus, setLoadStatus] = useState<"loading" | "error">("loading");
  const [progress, setProgress] = useState(0);
  const [deck, setDeck] = useState<PracticeItem[]>([]);
  const [randomKanjiPool, setRandomKanjiPool] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [sessionItems, setSessionItems] = useState<PracticeItem[]>([]);
  const [sessionKey, setSessionKey] = useState(0);
  const [results, setResults] = useState<SessionResult[] | null>(null);
  const [runResults, setRunResults] = useState<SessionResult[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const setOpenedKanji = useSetOpenedParam();

  useEffect(() => {
    if (phase !== "ended") {
      setOpenedKanji(null);
    }
  }, [phase, setOpenedKanji]);

  const goToInitial = () => {
    setProgress(0);
    setResults(null);
    setRunResults([]);
    setHasMore(true);
    setDeck([]);
    setRandomKanjiPool([]);
    setCursor(0);
    setSessionItems([]);
    setLoadStatus("loading");
    setPhase("initial");
  };

  const warmAndPlay = async (
    items: PracticeItem[],
    nextCursor: number,
    builtDeck?: PracticeItem[]
  ) => {
    if (builtDeck) {
      setDeck(builtDeck);
      setRandomKanjiPool(builtDeck.map((item) => item.kanji));
    }
    setSessionItems(items);
    setCursor(nextCursor);
    setSessionKey((k) => k + 1);
    setProgress(0);
    setResults(null);

    if (modelReady) {
      setPhase("playing");
      return;
    }

    setLoadStatus("loading");
    setPhase("loading");
    try {
      await warmupDaKanji();
      setModelReady(true);
      setPhase("playing");
    } catch {
      setLoadStatus("error");
    }
  };

  const startGame = (builtDeck: PracticeItem[]) => {
    setRunResults([]);
    setHasMore(true);
    const chunk = builtDeck.slice(0, SESSION_SIZE);
    void warmAndPlay(chunk, chunk.length, builtDeck);
  };

  const retryWarmup = () => {
    const items = sessionItems;
    if (items.length === 0) {
      goToInitial();
      return;
    }
    void warmAndPlay(items, cursor);
  };

  const finishSession = (sessionResults: SessionResult[]) => {
    const forgottens = sessionResults.filter((r) => !r.correct);
    const moreLeft = forgottens.length > 0 || cursor < deck.length;

    setRunResults((prev) => [...prev, ...sessionResults]);
    setResults(sessionResults);
    setHasMore(moreLeft);
    if (!moreLeft) setProgress(100);
    setPhase("ended");
  };

  const startNextSession = () => {
    if (!hasMore) return;

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

    const remaining = deck.slice(cursor);
    const pool = [...forgottens, ...remaining];
    if (pool.length === 0) {
      setHasMore(false);
      setPhase("ended");
      return;
    }

    const chunk = pool.slice(0, SESSION_SIZE);
    const fromRemaining = Math.max(0, chunk.length - forgottens.length);
    void warmAndPlay(chunk, cursor + fromRemaining);
  };

  return (
    <>
      <PracticeShell progress={progress} playing={phase === "playing"}>
        {phase === "initial" && (
          <div key="initial" className="h-full animate-fade-in">
            <InitialScreen onStart={startGame} />
          </div>
        )}

        {phase === "loading" && (
          <div key="loading" className="h-full animate-fade-in">
            <ModelLoadingScreen
              status={loadStatus}
              onRetry={retryWarmup}
              onCancel={goToInitial}
            />
          </div>
        )}

        {phase === "playing" && sessionItems.length > 0 && (
          <div key={`playing-${sessionKey}`} className="h-full animate-fade-in">
            <Game
              sessionItems={sessionItems}
              settings={settings}
              randomKanjiPool={randomKanjiPool}
              onProgress={setProgress}
              onComplete={finishSession}
              onEnd={goToInitial}
            />
          </div>
        )}

        {phase === "ended" && results && (
          <div
            key={hasMore ? "ended" : "complete"}
            className="h-full animate-fade-in"
          >
            <EndSession
              results={hasMore ? results : runResults}
              hasMore={hasMore}
              wordsCleared={deck.length}
              onNext={startNextSession}
              onEnd={goToInitial}
            />
          </div>
        )}
      </PracticeShell>

      {phase === "ended" && <KanjiDrawerGlobal />}
    </>
  );
};

export default ProductionPracticeV1;
