import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { GenericPopover } from "./GenericPopover";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";
import { useJishoCache, type JishoApiResponse } from "@/providers/jisho-cache-provider";

const JLPT_COLORS: Record<string, string> = {
    "jlpt-n1": "border-red-500 text-red-500",
    "jlpt-n2": "border-pink-500 text-pink-500",
    "jlpt-n3": "border-blue-500 text-blue-500",
    "jlpt-n4": "border-yellow-500 text-yellow-500",
    "jlpt-n5": "border-green-500 text-green-500",
};

export const JishoContent = ({ word }: { word: string }) => {
    const cacheRef = useJishoCache();
    const cached = cacheRef.current.get(word);

    const { data, status } = useJsonFetch<JishoApiResponse>(
        `/api/jisho?keyword=${encodeURIComponent(word)}`,
        !cached
    );

    if (data && !cached) cacheRef.current.set(word, data);


    const result = cached ?? data;

    if (!result) {
        if (status === "error") {
            return (
                <div className="py-2 text-xs">
                    Jisho.org cannot be accessed right now. Try again later.
                </div>
            );
        }
        return <div className="py-2 text-xs text-muted-foreground">Loading…</div>;
    }

    if (result.data.length === 0) {
        return (
            <div className="py-2 text-xs text-muted-foreground">Jisho.org does not contain information about this word.</div>
        );
    }

    console.log({ data })
    return (
        <div className="space-y-3">
            {result.data.slice(0, 3).map((entry, i) => (
                <div key={entry.slug} className={i > 0 ? "border-t pt-3" : ""}>
                    <div className="flex items-baseline gap-1.5 mb-1">
                        {entry.japanese[0]?.word && (
                            <span className="text-sm font-bold">{entry.japanese[0].word}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                            {entry.japanese[0]?.reading}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {entry.is_common && (
                            <SpanBadge variant="secondary" className="text-[10px] px-1.5 py-0">
                                common
                            </SpanBadge>
                        )}
                        {entry.jlpt.map((tag) => (
                            <SpanBadge
                                key={tag}
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${JLPT_COLORS[tag] ?? ""}`}
                            >
                                {tag.replace("jlpt-", "").toUpperCase()}
                            </SpanBadge>
                        ))}
                    </div>

                    <ol className="text-xs space-y-0.5 text-left list-decimal list-inside text-foreground/80">
                        {entry.senses.slice(0, 4).map((sense, si) => (
                            <li key={si} className="text-left">
                                {sense.restrictions.length > 0 && (
                                    <span className="text-muted-foreground">
                                        ({sense.restrictions.join(", ")}){" "}
                                    </span>
                                )}
                                {sense.english_definitions.slice(0, 4).join(", ")}
                                {sense.parts_of_speech[0] && (
                                    <span className="ml-1 text-muted-foreground">
                                        [{sense.parts_of_speech[0]}]
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

export const JishoBtn = ({ word }: { word: string }) => {
    return (
        <GenericPopover
            trigger={
                <Button variant={"outline"} size="icon" className="relative w-8 h-8 rounded-xl">
                    <BookOpen />
                </Button>
            }
            content={
                <div className="w-56 p-4">
                    <JishoContent word={word} />
                </div>
            }
        />
    );
};
