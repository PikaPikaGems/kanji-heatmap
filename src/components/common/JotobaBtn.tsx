import { Library } from "lucide-react";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";
import {
  DictEmpty,
  DictError,
  DictHeader,
  DictionaryPopoverShell,
  DictLoading,
} from "./DictionaryPopover";

type JotobaReading = { kana: string; kanji?: string; furigana?: string };
type JotobaSense = {
    glosses?: string[];
    pos?: (string | Record<string, unknown>)[];
    language?: string;
    information?: string;
};
type JotobaPitch = { part: string; high: boolean };
type JotobaWordEntry = {
    reading: JotobaReading;
    common: boolean;
    senses: JotobaSense[];
    audio?: string;
    pitch?: JotobaPitch[];
};
type JotobaApiResponse = {
    words: JotobaWordEntry[];
};


export const JotobaContent = ({ word }: { word: string }) => {
    const { data, status } = useJsonFetch<JotobaApiResponse>(
        `/api/jotoba?keyword=${encodeURIComponent(word)}`
    );

    if (!data) {
        return status === "error" ? <DictError service="Jotoba.de" /> : <DictLoading />;
    }

    if (data.words.length === 0) {
        return <DictEmpty service="Jotoba.de" />;
    }

    return (
        <div className="w-48 space-y-3">
            <DictHeader label="Jotoba.de" />
            {data.words.slice(0, 5).map((entry, i) => (
                <div key={i} className={i > 0 ? "border-t pt-3" : ""}>
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {entry.reading.kanji && (
                            <span className="text-sm font-bold">{entry.reading.kanji}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{entry.reading.kana}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {entry.common && (
                            <SpanBadge variant="secondary" className="text-[10px] px-1.5 py-0">
                                common
                            </SpanBadge>
                        )}
                    </div>

                    <ol className="text-xs space-y-0.5 text-left list-decimal list-inside text-foreground/80">
                        {entry.senses.slice(0, 4).map((sense, si) => {
                            const firstPos = sense.pos?.[0];
                            const posText = typeof firstPos === "string"
                                ? firstPos
                                : firstPos ? Object.keys(firstPos)[0]?.replace(/([A-Z])/g, " $1").trim() : null;
                            return (
                                <li key={si} className="text-left">
                                    {sense.glosses?.slice(0, 4).join(", ")}
                                    {posText && (
                                        <span className="ml-1 text-muted-foreground">
                                            [{posText}]
                                        </span>
                                    )}
                                    {sense.information && (
                                        <span className="ml-1 italic text-muted-foreground">
                                            — {sense.information}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            ))}
        </div>
    );
};

export const JotobaBtn = ({ word }: { word: string }) => {
    return (
        <DictionaryPopoverShell
            icon={<Library />}
            contentClassName="px-4 py-2 overflow-y-scroll max-w-64 min-w-36 max-h-48"
        >
            <JotobaContent word={word} />
        </DictionaryPopoverShell>
    );
};
