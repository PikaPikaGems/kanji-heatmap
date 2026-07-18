import {
  useEffect,
  useRef,
  useState,
  ClipboardEvent,
  lazy,
  Suspense,
} from "react";
import { cn } from "@/lib/utils";
import { SearchType } from "@/lib/settings/settings";
import {
  placeholderMap,
  SEARCH_TYPE_OPTIONS,
  translateMap,
} from "@/lib/search-input-maps";
import { translateValue } from "@/lib/wanakana-adapter";
import {
  DialogType,
  inferSearchTypeFromText,
  isDialogType,
  resolvePaste,
  searchTypeLabel,
  stripToKanji,
} from "@/lib/search-input-logic";
import { CircleX, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import BasicSelect from "@/components/common/BasicSelect";
import { defaultSearchType } from "@/lib/settings/search-settings-adapter";
import { RadicalsLoadingFallback } from "./RadicalScreen/RadicalsLoadingFallback";
import { HandwritingLoadingFallback } from "./HandwritingScreen/HandwritingLoadingFallback";

const RadicalsControl = lazy(() =>
  import("./RadicalScreen/RadicalsControl").then((m) => ({
    default: m.RadicalsControl,
  }))
);
const HandwritingControl = lazy(() =>
  import("./HandwritingScreen/HandwritingControl").then((m) => ({
    default: m.HandwritingControl,
  }))
);

const INPUT_DEBOUNCE_TIME = 400;

export const SearchInput = ({
  initialSearchType = defaultSearchType,
  initialText = "",
  onSettle,
}: {
  initialSearchType: SearchType;
  initialText: string;
  onSettle: (searchText: string, searchType: SearchType) => void;
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  // True while a typed onChange settle is waiting on the debounce timer.
  // Used so blur/Enter only flush when there is actually something pending
  // (avoids re-settling stale text after paste/clear).
  const hasPendingSettleRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchType, setSearchType] = useState(initialSearchType);
  const [parsedValue, setValue] = useState(
    translateValue(initialText, translateMap[searchType])
  );
  // Ephemeral "Switched to Readings" chip after paste/IME auto-picks a type.
  // Same idea as CopyButton's brief feedback — local state, no toast lib.
  // typeHintKey remounts the span so the CSS animation restarts on rapid switches.
  const [typeHint, setTypeHint] = useState<string | null>(null);
  const [typeHintKey, setTypeHintKey] = useState(0);

  // Which drawer (if any) is currently open. The drawn strokes themselves live
  // inside <HandwritingControl/>, not here.
  const [openDialogType, setOpenDialogType] = useState<DialogType | "none">(
    "none"
  );
  // Bumping this remounts <HandwritingControl/>, discarding its strokes. Used to
  // reset the drawing pad when the search text is cleared from the input bar.
  const [handwritingResetKey, setHandwritingResetKey] = useState(0);

  // sync internal state when props change (e.g. navigating via link) example for radical search
  const [prevInitialText, setPrevInitialText] = useState(initialText);
  const [prevInitialSearchType, setPrevInitialSearchType] =
    useState(initialSearchType);

  if (
    prevInitialText !== initialText ||
    prevInitialSearchType !== initialSearchType
  ) {
    setPrevInitialText(initialText);
    setPrevInitialSearchType(initialSearchType);
    setSearchType(initialSearchType);
    setValue(translateValue(initialText, translateMap[initialSearchType]));
  }

  // Autofocus on fine-pointer devices only — avoids opening the soft
  // keyboard on touch screens when landing on "/".
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    inputRef.current?.focus?.();
  }, []);

  const onSyncAll = (text: string, finalSearchType: SearchType) => {
    // Cancel any pending typed settle so a paste/clear can't be overwritten
    // by a debounce that still holds the pre-paste value.
    clearTimeout(timeoutRef.current);
    hasPendingSettleRef.current = false;
    setValue(text);
    onSettle(text, finalSearchType);
    setSearchType(finalSearchType);
  };

  // Same as onSyncAll, but briefly announce when the search type was
  // auto-changed (e.g. kana paste/Enter → Readings).
  const syncAndAnnounceType = (text: string, nextType: SearchType) => {
    if (nextType !== searchType) {
      setTypeHint(searchTypeLabel(nextType));
      setTypeHintKey((key) => key + 1);
    }
    onSyncAll(text, nextType);
  };

  // Immediately apply the current field value if a debounce is still waiting
  // (e.g. user hits Enter or clicks away before the 400ms timer fires).
  const flushPendingSettle = () => {
    if (!hasPendingSettleRef.current) {
      return;
    }
    clearTimeout(timeoutRef.current);
    hasPendingSettleRef.current = false;
    onSettle(parsedValue.trim(), searchType);
  };

  // After a controlled-value paste, React resets the caret to the end — put it
  // back where the inserted text ended.
  const restoreCaret = (caret: number) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) {
        return;
      }
      el.focus();
      const clamped = Math.min(caret, el.value.length);
      el.setSelectionRange(clamped, clamped);
    });
  };

  const clearSearch = () => {
    onSyncAll("", searchType);
    // Also clears the drawing pad (see handwritingResetKey).
    setHandwritingResetKey((key) => key + 1);
    inputRef.current?.focus();
  };

  const isDrawerType = isDialogType(searchType);

  const fontCN =
    parsedValue === "" || searchType === "meanings" || searchType === "keyword"
      ? ""
      : "kanji-font";

  return (
    <section className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        // Drawer types are click-to-open; block typing so junk doesn't land in the field.
        readOnly={isDrawerType}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search kanji"
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-7 pr-[105px] h-9",
          fontCN,
          isDrawerType && "cursor-pointer"
        )}
        value={parsedValue}
        onClick={() => {
          if (isDrawerType) {
            setOpenDialogType(searchType);
          }
        }}
        onChange={(e) => {
          // During IME composition (e.g. かんじ before converting to 漢字),
          // keep the raw value. Running translateValue here fights the IME
          // and can swallow or mangle in-progress input.
          const nativeEvent = e.nativeEvent as InputEvent;
          if (nativeEvent.isComposing) {
            setValue(e.target.value);
            return;
          }

          // Translate first (e.g. romaji → hiragana) so the field and the
          // settled search query stay in sync. Settling the raw keystrokes
          // would search a different string than what the user sees.
          const updatedValue = translateValue(
            e.target.value,
            translateMap[searchType]
          );

          setValue(updatedValue);
          // NOTE: this is based on https://react.dev/learn/referencing-values-with-refs
          // TODO: Read https://www.developerway.com/posts/debouncing-in-react
          clearTimeout(timeoutRef.current);
          hasPendingSettleRef.current = true;
          timeoutRef.current = setTimeout(() => {
            hasPendingSettleRef.current = false;
            onSettle(updatedValue.trim(), searchType);
          }, INPUT_DEBOUNCE_TIME);
        }}
        onCompositionEnd={(e) => {
          // Composition just finished (IME confirm — often via Enter).
          // Infer from the raw committed text before translateValue: if the
          // current type maps to romaji, toRomaji would turn かんじ → kanji
          // and we'd miss the readings switch.
          const raw = e.currentTarget.value;
          const text = raw.trim();
          const inferred = inferSearchTypeFromText(text, searchType);
          if (inferred != null && inferred !== searchType) {
            syncAndAnnounceType(text, inferred);
            return;
          }

          const updatedValue = translateValue(raw, translateMap[searchType]);
          setValue(updatedValue);
          clearTimeout(timeoutRef.current);
          hasPendingSettleRef.current = true;
          timeoutRef.current = setTimeout(() => {
            hasPendingSettleRef.current = false;
            onSettle(updatedValue.trim(), searchType);
          }, INPUT_DEBOUNCE_TIME);
        }}
        onKeyDown={(e) => {
          // IME is still composing (first Enter confirms a candidate) — don't
          // treat it as a search submit; compositionend handles the switch.
          if (e.nativeEvent.isComposing) {
            return;
          }

          // Escape clears the field when no drawer is open (drawers handle Escape themselves).
          if (
            e.key === "Escape" &&
            openDialogType === "none" &&
            parsedValue.length > 0
          ) {
            e.preventDefault();
            clearSearch();
            return;
          }

          // Fallback when composition already ended (e.g. second Enter, or
          // text entered without IME). Same script → type rules as paste.
          if (e.key === "Enter") {
            const text = (inputRef.current?.value ?? parsedValue).trim();
            const inferred = inferSearchTypeFromText(text, searchType);
            if (inferred != null && inferred !== searchType) {
              syncAndAnnounceType(text, inferred);
              return;
            }
            flushPendingSettle();
          }
        }}
        onBlur={flushPendingSettle}
        onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
          event.preventDefault();
          const clipboardData = event.clipboardData;

          if (!clipboardData) {
            return;
          }

          // Insert at the caret (or replace the current selection) for every paste path.
          const start = inputRef.current?.selectionStart ?? parsedValue.length;
          const end = inputRef.current?.selectionEnd ?? start;

          const resolution = resolvePaste({
            pasted: clipboardData.getData("text/plain"),
            currentValue: parsedValue,
            selectionStart: start,
            selectionEnd: end,
            searchType,
          });

          if (resolution == null) {
            return;
          }

          if (resolution.announce) {
            syncAndAnnounceType(resolution.value, resolution.nextType);
          } else {
            onSyncAll(resolution.value, resolution.nextType);
          }
          restoreCaret(resolution.caret);
        }}
        placeholder={placeholderMap[searchType]}
      />

      <Search
        className={
          "pointer-events-none absolute left-2 top-2 size-4 translate-y-0.5 select-none opacity-50"
        }
      />
      <div className="absolute flex items-center gap-1 right-1 top-1">
        {parsedValue.length > 0 && (
          <Button
            className="h-6 p-1 m-0 rounded-full"
            variant={"secondary"}
            // Keep focus on the input (avoids blur flush racing the clear).
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearSearch}
          >
            <CircleX />
            <span className="sr-only"> Clear search text</span>
          </Button>
        )}
        <BasicSelect
          value={searchType}
          onChange={(val) => {
            const newType = val as SearchType;

            if (isDialogType(newType)) {
              onSyncAll("", newType);
              setOpenDialogType(newType);
              return;
            }

            setSearchType(newType);
            // Drop any pending typed settle before switching type.
            clearTimeout(timeoutRef.current);
            hasPendingSettleRef.current = false;
            const baseText = searchType === "radicals" ? "" : parsedValue;
            // Similar only wants kanji in the field — strip leftovers from prior types.
            const newParsedValue =
              newType === "similar"
                ? stripToKanji(baseText)
                : translateValue(baseText, translateMap[newType]);
            setValue(newParsedValue);
            onSettle(newParsedValue.trim(), newType);
          }}
          triggerCN="h-7 bg-foreground text-background text-xs font-bold"
          options={SEARCH_TYPE_OPTIONS}
          label="Search Type"
          isLabelSrOnly={true}
        />
      </div>

      {/* Bottom-left so it sits over the item-count badge area; motion makes the switch hard to miss. */}
      {typeHint != null && (
        <span
          key={typeHintKey}
          className="pointer-events-none absolute left-0 z-20 px-2 py-0.5 text-xs font-semibold border rounded-md shadow-sm -bottom-7 border-cyan-500 bg-background dark:text-cyan-300 text-cyan-600 animate-search-type-hint"
          role="status"
          aria-live="polite"
          onAnimationEnd={() => setTypeHint(null)}
        >
          Switched to {typeHint}
        </span>
      )}

      {(openDialogType === "radicals" || searchType === "radicals") && (
        <Suspense
          fallback={
            <RadicalsLoadingFallback
              isOpen={openDialogType === "radicals"}
              onClose={() => setOpenDialogType("none")}
            />
          }
        >
          <RadicalsControl
            isOpen={openDialogType === "radicals"}
            onClose={() => setOpenDialogType("none")}
            value={parsedValue}
            onChange={(newStr) => onSyncAll(newStr, "radicals")}
          />
        </Suspense>
      )}

      {(searchType === "handwriting" ||
        searchType === "handwriting-alt" ||
        searchType === "handwriting-alt-2") && (
        // Keyed by search type + reset counter so switching variants or clearing
        // the input starts the drawing pad fresh. Mounted regardless of the
        // drawer's open state so the drawing survives closing/reopening it.
        <Suspense
          fallback={
            <HandwritingLoadingFallback
              isOpen={openDialogType === searchType}
              onClose={() => setOpenDialogType("none")}
            />
          }
        >
          <HandwritingControl
            key={`${searchType}-${handwritingResetKey}`}
            variant={
              searchType === "handwriting"
                ? "google"
                : searchType === "handwriting-alt"
                  ? "kanjicanvas"
                  : "dakanji"
            }
            isOpen={openDialogType === searchType}
            onClose={() => setOpenDialogType("none")}
            value={parsedValue}
            onChange={(newStr) => onSyncAll(newStr, searchType)}
          />
        </Suspense>
      )}
    </section>
  );
};
