import { ReactNode } from "react";

import {
  useGetKanjiInfoFn,
  useIsKanjiWorkerReady,
} from "@/kanji-worker/kanji-worker-hooks";

import { ErrorBoundary, KanjiNotFound } from "@/components/error";
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
    <>
      <div className="flex flex-col w-full overflow-x-hidden overflow-y-scroll md:flex-row md:space-x-1 ">
        <div className="px-1 md:sticky md:top-[0px] md:left-[0px] md:min-w-96 md:max-w-96 md:w-96">
          <div className="block md:hidden">{actionBar}</div>
          <div className="hidden md:block">
            <ErrorBoundary details="Kanji Card in KanjiDrawer Layout">
              {first}
            </ErrorBoundary>
          </div>
        </div>
        <div className="min-w-0 grow">
          <ErrorBoundary details="Kanji Details in KanjiDrawer Layout">
            <div className="hidden md:block">{actionBar}</div>
            {second}
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
};

export const KanjiInfoContent = ({ kanji }: { kanji: string }) => {
  const ready = useIsKanjiWorkerReady();
  const getFn = useGetKanjiInfoFn();

  if (!ready) {
    return null;
  }

  const info = getFn?.(kanji);

  const card = <KanjiCard key={kanji} kanji={kanji} />
  if (info != null) {
    return (
      <Layout
        actionBar={<KanjiActionsBtns kanji={kanji} />}
        first={card}
        second={<KanjiDetails kanji={kanji} smallScreenNode={card} />}
      />
    );
  }

  return <KanjiNotFound kanji={kanji} />;
};
