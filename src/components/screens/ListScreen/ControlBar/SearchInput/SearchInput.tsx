import { useEffect, useRef, useState, ClipboardEvent } from "react";
import { cn, isKanji } from "@/lib/utils";
import { SearchType } from "@/lib/settings/settings";
import {
  placeholderMap,
  SEARCH_TYPE_OPTIONS,
  translateMap,
} from "@/lib/search-input-maps";
import wanakana, { translateValue, hasKanji } from "@/lib/wanakana-adapter";
import { CircleX, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import BasicSelect from "@/components/common/BasicSelect";
import { defaultSearchType } from "@/lib/settings/search-settings-adapter";

import { RadicalsControl } from "./RadicalScreen/RadicalsControl";
import { HandwritingControl } from "./HandwritingScreen/HandwritingControl";

const INPUT_DEBOUNCE_TIME = 400;

// Search types that open a drawer instead of accepting typed input.
type DialogType = "radicals" | "handwriting" | "handwriting-alt";
const DIALOG_TYPES: DialogType[] = ["radicals", "handwriting", "handwriting-alt"];
const isDialogType = (type: SearchType): type is DialogType =>
  (DIALOG_TYPES as SearchType[]).includes(type);

const stripToKanji = (text: string) =>
  text
    .split("")
    .filter(isKanji)
    .join("");

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

  // force focus input ref on mount
  useEffect(() => {
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

  const fontCN =
    parsedValue === "" || searchType === "meanings" || searchType === "keyword"
      ? ""
      : "kanji-font";

  return (
    <section className="relative w-full">
      <input
        ref={inputRef}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-7 pr-[105px] h-9",
          fontCN
        )}
        value={parsedValue}
        onClick={() => {
          if (isDialogType(searchType)) {
            setOpenDialogType(searchType);
          }
        }}
        onChange={(e) => {
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
        onKeyDown={(e) => {
          if (e.key === "Enter") {
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

          const processedText = clipboardData.getData("text/plain").trim();

          if (processedText.length === 0) {
            // it's as if you didn't paste anything at all
            return;
          }

          if (hasKanji(processedText)) {
            // Insert at the caret (or replace the current selection). Previously
            // a collapsed caret always appended, so pasting mid-field felt broken.
            const start = inputRef.current?.selectionStart ?? parsedValue.length;
            const end = inputRef.current?.selectionEnd ?? start;
            const newValue = `${parsedValue.slice(0, start)}${processedText}${parsedValue.slice(end)}`;

            if (searchType === "similar") {
              onSyncAll(stripToKanji(newValue), "similar");
              return;
            }

            onSyncAll(newValue, "multi-kanji");
            return;
          }

          // No kanji: auto-pick a search type from the pasted script.
          if (wanakana.isKana(processedText)) {
            onSyncAll(processedText, "readings");
            return;
          }

          if (wanakana.isRomaji(processedText)) {
            const nextType: SearchType =
              searchType === "keyword" ? "keyword" : "meanings";
            const updatedValue = translateValue(
              processedText,
              translateMap[nextType]
            );
            onSyncAll(updatedValue, nextType);
            return;
          }

          // Mixed / ambiguous: keep current search type.
          const updatedValue = translateValue(
            processedText,
            translateMap[searchType]
          );
          onSyncAll(updatedValue, searchType);
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
            onClick={() => {
              onSyncAll("", searchType);
              // Also clears the drawing pad (see handwritingResetKey).
              setHandwritingResetKey((key) => key + 1);
            }}
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
            const newParsedValue = translateValue(
              searchType === "radicals" ? "" : parsedValue,
              translateMap[newType]
            );
            setValue(newParsedValue);
            onSettle(newParsedValue.trim(), newType);
          }}
          triggerCN="h-7 bg-foreground text-background text-xs font-bold"
          options={SEARCH_TYPE_OPTIONS}
          label="Search Type"
          isLabelSrOnly={true}
        />
      </div>

      <RadicalsControl
        isOpen={openDialogType === "radicals"}
        onClose={() => setOpenDialogType("none")}
        value={parsedValue}
        onChange={(newStr) => onSyncAll(newStr, "radicals")}
      />

      {(searchType === "handwriting" || searchType === "handwriting-alt") && (
        // Keyed by search type + reset counter so switching variants or clearing
        // the input starts the drawing pad fresh. Mounted regardless of the
        // drawer's open state so the drawing survives closing/reopening it.
        <HandwritingControl
          key={`${searchType}-${handwritingResetKey}`}
          variant={searchType === "handwriting" ? "google" : "kanjicanvas"}
          isOpen={openDialogType === searchType}
          onClose={() => setOpenDialogType("none")}
          value={parsedValue}
          onChange={(newStr) => onSyncAll(newStr, searchType)}
        />
      )}
    </section>
  );
};
