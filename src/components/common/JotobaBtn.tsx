import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import { GenericPopover } from "./GenericPopover";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";

type JotobaReading = { kana: string; kanji?: string };
type JotobaSense = {
    glosses: string[];
    pos: Record<string, unknown>[];
    language: string;
};
type JotobaWordEntry = {
    reading: JotobaReading;
    common: boolean;
    senses: JotobaSense[];
};
type JotobaApiResponse = {
    words: JotobaWordEntry[];
};

const posLabel = (pos: Record<string, unknown>): string => {
    const key = Object.keys(pos)[0] ?? "";
    return key.replace(/([A-Z])/g, " $1").trim();
};

export const JotobaContent = ({ word }: { word: string }) => {
    const { data, status } = useJsonFetch<JotobaApiResponse>(
        `/api/jotoba?keyword=${encodeURIComponent(word)}`
    );

    if (!data) {
        if (status === "error") {
            return (
                <div className="py-2 text-xs">
                    Jotoba.de cannot be accessed right now. Try again later.
                </div>
            );
        }
        return <div className="py-2 text-xs text-muted-foreground">Loading…</div>;
    }

    if (data.words.length === 0) {
        return (
            <div className="py-2 text-xs text-muted-foreground">
                Jotoba.de does not contain information about this word.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.words.slice(0, 5).map((entry, i) => (
                <div key={i} className={i > 0 ? "border-t pt-3" : ""}>
                    <div className="flex items-baseline gap-1.5 mb-1">
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
                        {entry.senses.slice(0, 4).map((sense, si) => (
                            <li key={si} className="text-left">
                                {sense.glosses.slice(0, 4).join(", ")}
                                {sense.pos[0] && (
                                    <span className="ml-1 text-muted-foreground">
                                        [{posLabel(sense.pos[0])}]
                                    </span>
                                )}
                            </li>
                        ))}
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
                <div className="p-4 overflow-y-auto max-h-48 min-w-36 max-w-96" onWheel={(e) => e.stopPropagation()}>
                    <JotobaContent word={word} />
                </div>
            }
        />
    );
};
