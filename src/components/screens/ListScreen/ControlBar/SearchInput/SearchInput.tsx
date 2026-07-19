import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchType } from "@/lib/settings/settings";
import { placeholderMap, SEARCH_TYPE_OPTIONS } from "@/lib/search-input-maps";
import { CircleX, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import BasicSelect from "@/components/common/BasicSelect";
import { defaultSearchType } from "@/lib/settings/search-settings-adapter";
import { useSearchInputController } from "./use-search-input-controller";
import { SearchTypeHint } from "./SearchTypeHint";
import { SearchDrawers } from "./SearchDrawers";

export const SearchInput = ({
  initialSearchType = defaultSearchType,
  initialText = "",
  onSettle,
}: {
  initialSearchType: SearchType;
  initialText: string;
  onSettle: (searchText: string, searchType: SearchType) => void;
}) => {
  const controller = useSearchInputController({
    initialSearchType,
    initialText,
    onSettle,
  });
  const { parsedValue, searchType, isDrawerType } = controller;
  const [isDrawerChunkLoading, setIsDrawerChunkLoading] = useState(false);
  const showDrawerLoading =
    isDrawerChunkLoading && controller.openDialogType !== "none";

  const fontCN =
    parsedValue === "" || searchType === "meanings" || searchType === "keyword"
      ? ""
      : "kanji-font";

  return (
    <section className="relative flex-1 min-w-0">
      <input
        ref={controller.inputRef}
        // Drawer types are click-to-open; block typing so junk doesn't land in the field.
        readOnly={isDrawerType}
        autoComplete="off"
        spellCheck={false}
        aria-label="Search kanji"
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-7 h-9",
          showDrawerLoading ? "pr-[130px]" : "pr-[105px]",
          fontCN,
          isDrawerType && "cursor-pointer"
        )}
        value={parsedValue}
        placeholder={placeholderMap[searchType]}
        {...controller.inputHandlers}
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
            onClick={controller.clearSearch}
          >
            <CircleX />
            <span className="sr-only"> Clear search text</span>
          </Button>
        )}
        {showDrawerLoading && (
          <Loader2
            className="size-4 shrink-0 animate-spin text-muted-foreground"
            aria-label="Loading search drawer"
          />
        )}
        <BasicSelect
          value={searchType}
          onChange={controller.onSelectType}
          triggerCN="h-7 bg-foreground text-background text-xs font-bold"
          options={SEARCH_TYPE_OPTIONS}
          label="Search Type"
          isLabelSrOnly={true}
        />
      </div>

      <SearchTypeHint
        hint={controller.typeHint}
        hintKey={controller.typeHintKey}
        onDone={controller.clearTypeHint}
      />

      <SearchDrawers
        searchType={searchType}
        openDialogType={controller.openDialogType}
        onClose={() => controller.setOpenDialogType("none")}
        value={parsedValue}
        onChange={controller.onSyncAll}
        handwritingResetKey={controller.handwritingResetKey}
        onChunkLoadingChange={setIsDrawerChunkLoading}
      />
    </section>
  );
};
