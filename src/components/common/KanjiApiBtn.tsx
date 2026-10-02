import { Globe } from "lucide-react";
import { SpanBadge } from "@/components/ui/badge";
import { useJsonFetch } from "@/hooks/use-json";
import {
  DictEmpty,
  DictError,
  DictHeader,
  DictionaryPopoverShell,
  DictLoading,
} from "./DictionaryPopover";

type KanjiApiEntry = {
  written: string;
  reading: string;
  common: boolean;
  senses: string[][];
};
type KanjiApiResponse = {
  entries: KanjiApiEntry[];
};

export const KanjiApiContent = ({ word }: { word: string }) => {
  const { data, status } = useJsonFetch<KanjiApiResponse>(
    `/api/kanjiapi?keyword=${encodeURIComponent(word)}`
  );

  if (!data) {
    return status === "error" ? (
      <DictError service="KanjiAPI.dev" />
    ) : (
      <DictLoading />
    );
  }

  if (!data.entries?.length) {
    return <DictEmpty service="KanjiAPI.dev" />;
  }

  return (
    <div className="space-y-3">
      <DictHeader label="KANJIAPI.DEV" />
      {data.entries.slice(0, 5).map((entry, i) => (
        <div key={i} className={i > 0 ? "border-t pt-3" : ""}>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-sm font-bold">{entry.written}</span>
            <span className="text-xs text-muted-foreground">
              {entry.reading}
            </span>
          </div>

          {entry.common && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              <SpanBadge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                common
              </SpanBadge>
            </div>
          )}

          <ol className="text-xs space-y-0.5 text-left list-decimal list-inside text-foreground/80">
            {entry.senses.slice(0, 4).map((glosses, si) => (
              <li key={si} className="text-left">
                {glosses.slice(0, 4).join(", ")}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};

export const KanjiApiBtn = ({ word }: { word: string }) => {
  return (
    <DictionaryPopoverShell
      icon={<Globe />}
      contentClassName="p-4 overflow-y-scroll max-h-48 min-w-36 max-w-64"
    >
      <KanjiApiContent word={word} />
    </DictionaryPopoverShell>
  );
};
