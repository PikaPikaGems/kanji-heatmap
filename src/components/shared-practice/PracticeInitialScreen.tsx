import { ReactNode } from "react";
import { PracticeButton } from "@/components/ui/practice-button";
import { JLPTSelector } from "@/components/common/jlpt/JLPTSelector";
import { JLTPTtypes } from "@/lib/jlpt";
import { ToggleRow } from "./ToggleRow";
import { DeckFilterSettings } from "./types";

/**
 * Shared scaffold for the practice-mode start screens: heading, the
 * "Kanji to include" filters, the two shared session toggles (with
 * mode-specific options injected below them), and the sticky start footer.
 */
export const PracticeInitialScreen = ({
  heading,
  description,
  filters,
  onFilterChange,
  sessionOptions,
  deckSize,
  loading,
  canStart,
  onStart,
}: {
  heading: string;
  description: string;
  filters: DeckFilterSettings;
  onFilterChange: (
    key: keyof DeckFilterSettings,
    value: DeckFilterSettings[keyof DeckFilterSettings]
  ) => void;
  /** Mode-specific controls rendered below the shared session toggles. */
  sessionOptions?: ReactNode;
  deckSize: number;
  loading: boolean;
  canStart: boolean;
  onStart: () => void;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex-1 min-h-0 overflow-auto">
      <div className="flex flex-col max-w-md gap-6 px-4 py-6 mx-auto">
        <div className="text-left">
          <h1 className="pt-4 text-xl font-bold text-center">{heading}</h1>
          <p className="mt-1 text-sm text-center text-muted-foreground">
            {description}
          </p>
        </div>

        <section className="flex flex-col text-left">
          <h2 className="text-xs font-bold tracking-wide uppercase text-muted-foreground">
            Kanji to include
          </h2>
          <div className="pt-2 pb-6">
            <JLPTSelector
              selectedJLPT={filters.jlpt}
              setSelectedJLPT={(v: JLTPTtypes[]) => onFilterChange("jlpt", v)}
            />
          </div>
          <ToggleRow
            id="bookmarked-only"
            label="Bookmarked only"
            checked={filters.bookmarkedOnly}
            onChange={(v) => onFilterChange("bookmarkedOnly", v)}
          />
        </section>

        <hr className="border-dashed" />

        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold tracking-wide text-left uppercase text-muted-foreground">
            Session options
          </h2>
          <ToggleRow
            id="randomize-order"
            label="Randomize order"
            checked={filters.randomizeOrder}
            onChange={(v) => onFilterChange("randomizeOrder", v)}
          />
          <ToggleRow
            id="randomize-font"
            label="Randomize font"
            checked={filters.randomizeFont}
            onChange={(v) => onFilterChange("randomizeFont", v)}
          />
          {sessionOptions}
        </section>
      </div>
    </div>

    <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t-4 border-dotted rounded-3xl bg-background">
      <div className="flex flex-col w-full max-w-md gap-2 mx-auto">
        <p className="text-sm text-left text-muted-foreground">
          {loading ? (
            "Loading…"
          ) : (
            <>
              <span className="font-bold text-foreground">{deckSize}</span>{" "}
              kanji match your filters
            </>
          )}
        </p>
        <PracticeButton size="lg" disabled={!canStart} onClick={onStart}>
          Start Practicing
        </PracticeButton>
      </div>
    </div>
  </div>
);
