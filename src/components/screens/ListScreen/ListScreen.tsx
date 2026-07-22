import { ReactNode } from "react";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";
import { ErrorBoundary } from "@/components/error";

import { ControlBar } from "./ControlBar/";
import LoadingKanjis from "./KanjiList/LoadingKanjis";

import { SuspendedKanjiList } from "./KanjiList/LazyKanjiList";
import { ControlBarErrorFallback } from "./ControlBar/ControlBarErrorFallback";
import { ItemCountBadge } from "./ControlBar/ItemCountBadge";

const Layout = ({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: ReactNode;
}) => {
  return (
    <>
      <div className="fixed-viewport-layer fix-scroll-layout-shift-right fixed w-full pt-12 pb-2 z-40 bg-background">
        <section className="mx-auto max-w-screen-xl flex border-0 space-x-1 sticky pt-1 pl-2 pr-1 w-full ">
          <ErrorBoundary fallback={<ControlBarErrorFallback />}>
            <ControlBar />
            {badge}
          </ErrorBoundary>
        </section>
      </div>
      <div className="relative pt-24 -z-0 flex flex-wrap items-center justify-center overflow-x-hidden">
        {children}
      </div>
    </>
  );
};

export const ListScreen = () => {
  const ready = useIsKanjiWorkerReady();

  return (
    <Layout badge={<ItemCountBadge />}>
      {ready ? <SuspendedKanjiList /> : <LoadingKanjis />}
    </Layout>
  );
};
