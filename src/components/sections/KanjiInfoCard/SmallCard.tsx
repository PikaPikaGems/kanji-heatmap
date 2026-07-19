import { HoverItemReturnData } from "@/lib/kanji/kanji-info-types";
import {
  useIsKanjiWorkerReady,
  useKanjiInfo,
} from "@/kanji-worker/kanji-worker-hooks";

import { DefaultErrorFallback } from "@/components/error";

import { Badge } from "@/components/ui/badge";
import { JLPTBadge } from "@/components/common/jlpt/JLPTBadge";
import { ReactNode } from "react";

const Wrapper = ({ kanji, badges }: { kanji: string; badges: ReactNode }) => {
  return (
    <div className="p-2 m-1 border border-dashed rounded-xl">
      <div className="flex flex-wrap items-center justify-center mx-1">
        {badges}
      </div>
      <div className="mb-2 kanji-font text-8xl">{kanji}</div>
    </div>
  );
};
export const SmallKanjiCard = ({ kanji }: { kanji: string }) => {
  const data = useKanjiInfo(kanji, "hover-card");
  const ready = useIsKanjiWorkerReady();

  if (data.error) {
    return <DefaultErrorFallback message="Failed to load data." />;
  }

  if (data.status === "loading" || !ready || data.data == null) {
    return (
      <Wrapper
        kanji={kanji}
        badges={
          <>
            <Badge className="m-1 animate-pulse">......</Badge>
            <Badge className="m-1 animate-pulse" variant={"outline"}>
              ......
            </Badge>
          </>
        }
      />
    );
  }

  const info = data.data as HoverItemReturnData;

  return (
    <Wrapper
      kanji={kanji}
      badges={
        <>
          <Badge className="m-1 text-nowrap">
            {info.keyword.toUpperCase()}
          </Badge>
          <JLPTBadge jlpt={info.jlpt} />
        </>
      }
    />
  );
};
