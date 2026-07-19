import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { SearchType } from "@/lib/settings/settings";
import { translateMap } from "@/lib/search-input-maps";
import { translateValue } from "@/lib/wanakana-adapter";
import {
  DialogType,
  inferSearchTypeFromText,
  isDialogType,
  resolvePaste,
  searchTypeLabel,
  stripToKanji,
} from "@/lib/search-input-logic";

const INPUT_DEBOUNCE_TIME = 400;

/**
 * All of SearchInput's state and event logic: the debounce-settle machine,
 * IME composition handling, paste resolution, type switching, and drawer
 * open state. The component that consumes this stays purely presentational.
 */
export const useSearchInputController = ({
  initialSearchType,
  initialText,
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

  const settleAfterDebounce = (updatedValue: string) => {
    clearTimeout(timeoutRef.current);
    hasPendingSettleRef.current = true;
    timeoutRef.current = setTimeout(() => {
      hasPendingSettleRef.current = false;
      onSettle(updatedValue.trim(), searchType);
    }, INPUT_DEBOUNCE_TIME);
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

  const clearTypeHint = () => setTypeHint(null);

  const isDrawerType = isDialogType(searchType);

  const onInputClick = () => {
    if (isDrawerType) {
      setOpenDialogType(searchType);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    settleAfterDebounce(updatedValue);
  };

  const onCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
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
    settleAfterDebounce(updatedValue);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
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
  };

  const onSelectType = (val: string) => {
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
  };

  return {
    inputRef,
    parsedValue,
    searchType,
    isDrawerType,
    typeHint,
    typeHintKey,
    clearTypeHint,
    openDialogType,
    setOpenDialogType,
    handwritingResetKey,
    clearSearch,
    onSyncAll,
    onSelectType,
    inputHandlers: {
      onClick: onInputClick,
      onChange,
      onCompositionEnd,
      onKeyDown,
      onBlur: flushPendingSettle,
      onPaste,
    },
  };
};
