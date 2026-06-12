import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import { GenericPopover } from "./GenericPopover";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";

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
        if (status === "error") {
            return (
                <div className="py-2 text-xs">
                    すみません. Jotoba.de cannot be accessed right now. Try again later.
                </div>
            );
        }
        return <div className="py-2 text-xs text-muted-foreground">読み込み中 · Loading…</div>;
    }

    if (data.words.length === 0) {
        return (
            <div className="py-2 text-xs text-muted-foreground">
                すみません. Jotoba.de does not contain information about this word.
            </div>
        );
    }

    return (
        <div className="w-48 space-y-3">
            <div className="pb-1 mb-2 border-b text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Powered by Jotoba.de 💪
            </div>
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
        <GenericPopover
            trigger={
                <Button variant={"outline"} size="icon" className="relative w-8 h-8 rounded-xl">
                    <Library />
                </Button>
            }
            content={
                <div className="px-4 py-2 overflow-y-auto max-w-64 min-w-36 max-h-48" onWheel={(e) => e.stopPropagation()}>
                    <JotobaContent word={word} />
                </div>
            }
        />
    );
};
