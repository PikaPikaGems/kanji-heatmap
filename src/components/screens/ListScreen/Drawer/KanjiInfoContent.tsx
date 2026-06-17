import { ReactNode } from "react";

import {
  useIsKanjiWorkerReady,
} from "@/kanji-worker/kanji-worker-hooks";

import { ErrorBoundary } from "@/components/error";
import { KanjiCard } from "@/components/sections/KanjiInfoCard/KanjiCard";
import { KanjiDetails } from "@/components/sections/KanjiDetails/Details";
import { KanjiActionsBtns } from "@/components/dependent/site-wide/KanjiActionBtns";

const Layout = ({
  first,
  second,
  actionBar,
}: {
  first: ReactNode;
  second: ReactNode;
  actionBar: ReactNode;
}) => {
  return (
    <div className="flex flex-col w-full h-full">
      {/* sm: sits above scroll area in normal flow — no z-index needed */}
      <div className="flex justify-center md:hidden">
        {actionBar}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-clip md:overflow-hidden md:flex md:flex-row md:space-x-1">
        {/* md+: left column scrolls independently */}
        <div className="hidden md:block md:px-1 md:overflow-y-auto md:min-w-96 md:max-w-96 md:w-96">
          <ErrorBoundary details="Kanji Card in KanjiDrawer Layout">
            {first}
          </ErrorBoundary>
        </div>
        {/* md+: right column — actionBar pinned at top, details scroll below */}
        <div className="min-w-0 grow md:flex md:flex-col md:overflow-hidden">
          <div className="hidden md:block md:shrink-0">{actionBar}</div>
          <div className="md:flex-1 md:overflow-y-auto">
            <ErrorBoundary details="Kanji Details in KanjiDrawer Layout">
              {second}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export const KanjiInfoContent = ({ kanji }: { kanji: string }) => {
  const ready = useIsKanjiWorkerReady();

  if (!ready) {
    return null;
  }


  const card = <KanjiCard key={kanji} kanji={kanji} />
  return (
    <Layout
      actionBar={<KanjiActionsBtns kanji={kanji} />}
      first={card}
      second={<KanjiDetails kanji={kanji} smallScreenNode={card} />}
    />
  );
};
