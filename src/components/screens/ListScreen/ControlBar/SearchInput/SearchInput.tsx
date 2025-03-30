import { useEffect, useRef, useState, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";
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

const INPUT_DEBOUNCE_TIME = 300;

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
  const [searchType, setSearchType] = useState(initialSearchType);
  const [parsedValue, setValue] = useState(
    translateValue(initialText, translateMap[searchType])
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  // force focus input ref on mount
  useEffect(() => {
    inputRef.current?.focus?.();
  }, []);

  const onSyncAll = (text: string, finalSearchType: SearchType) => {
    setValue(text);
    onSettle(text, finalSearchType);
    setSearchType(finalSearchType);
  };

  const fontCN =
    parsedValue === "" || searchType === "meanings" || searchType === "keyword"
      ? ""
      : "kanji-font";

  return (
    <section className="w-full relative">
      <input
        ref={inputRef}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-7 pr-[105px] h-9",
          fontCN
        )}
        value={parsedValue}
        onChange={(e) => {
          const updatedValue = translateValue(
            e.target.value,
            translateMap[searchType]
          );

          setValue(updatedValue);
          // NOTE: this is based on https://react.dev/learn/referencing-values-with-refs
          // TODO: Read https://www.developerway.com/posts/debouncing-in-react
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            onSettle(e.target.value.trim() ?? "", searchType);
          }, INPUT_DEBOUNCE_TIME);
        }}
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
            onSyncAll(processedText, "multi-kanji");
            return;
          }

          if (
            wanakana.isKana(processedText) &&
            !["kunyomi", "onyomi", "readings"].includes(searchType)
          ) {
            onSyncAll(processedText, "readings");
            return;
          }

          if (
            wanakana.isRomaji(processedText) &&
            !["keyword", "meanings"].includes(searchType)
          ) {
            onSyncAll(processedText, "keyword");
            return;
          }

          // default behavior
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
      {parsedValue.length > 0 && (
        <Button
          className="absolute right-[120px] top-[6px] m-0 p-1  h-6 rounded-full"
          variant={"secondary"}
          onClick={() => {
            onSyncAll("", searchType);
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
          setSearchType(newType);
          const newParsedValue = translateValue(
            parsedValue,
            translateMap[newType]
          );
          setValue(newParsedValue);
          onSettle(newParsedValue.trim(), newType);
        }}
        triggerCN={
          "absolute right-1 top-1 w-[115px] h-7 bg-gray-100 dark:bg-gray-900"
        }
        options={SEARCH_TYPE_OPTIONS}
        label="Search Type"
        isLabelSrOnly={true}
      />
    </section>
  );
};
