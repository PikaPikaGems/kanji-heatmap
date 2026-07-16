import { BookOpen } from "lucide-react";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";
import {
  DictEmpty,
  DictError,
  DictHeader,
  DictionaryPopoverShell,
  DictLoading,
} from "./DictionaryPopover";

type JishoJapanese = { word?: string; reading: string };
type JishoSense = {
    english_definitions: string[];
    parts_of_speech: string[];
    restrictions: string[];
};
type JishoEntry = {
    slug: string;
    is_common: boolean;
    jlpt: string[];
    japanese: JishoJapanese[];
    senses: JishoSense[];
};
type JishoApiResponse = {
    meta: { status: number };
    data: JishoEntry[];
};

const JLPT_COLORS: Record<string, string> = {
    "jlpt-n1": "border-red-500 text-red-500",
    "jlpt-n2": "border-pink-500 text-pink-500",
    "jlpt-n3": "border-blue-500 text-blue-500",
    "jlpt-n4": "border-yellow-500 text-yellow-500",
    "jlpt-n5": "border-green-500 text-green-500",
};

export const JishoContent = ({ word }: { word: string }) => {
    const { data, status } = useJsonFetch<JishoApiResponse>(
        `/api/jisho?keyword=${encodeURIComponent(word)}`
    );

    if (!data) {
        return status === "error" ? <DictError service="Jisho.org" /> : <DictLoading />;
    }

    if (data.data.length === 0) {
        return <DictEmpty service="Jisho.org" />;
    }

    return (
        <div className="space-y-3">
            <DictHeader label="JISHO.ORG" />
            {data.data.map((entry, i) => (
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
        <DictionaryPopoverShell
            icon={<BookOpen />}
            contentClassName="p-4 overflow-y-scroll max-h-48 min-w-36 max-w-64"
        >
            <JishoContent word={word} />
        </DictionaryPopoverShell>
    );
};
