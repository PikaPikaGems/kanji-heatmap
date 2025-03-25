import { ReactNode } from "react";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";
import { ErrorBoundary } from "@/components/error";

import { ControlBar } from "./ControlBar/";
import LoadingKanjis from "./KanjiList/LoadingKanjis";

import { LinksOutItems } from "@/components/common/LinksOutItems";
import { SuspendedKanjiList } from "./KanjiList/LazyKanjiList";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <section className="sticky top-10 w-full z-10 bg-white dark:bg-black">
        <div className="relative py-2 mx-auto max-w-screen-xl flex border-0 space-x-1 px-1 w-full ">
          <ErrorBoundary fallback={<LinksOutItems />}>
            <ControlBar />
          </ErrorBoundary>
        </div>
      </section>

      <div className="pt-4 flex flex-wrap items-center justify-center">
        {children}
      </div>
    </>
  );
};

export const ListScreen = () => {
  const ready = useIsKanjiWorkerReady();

  if (!ready) {
    return (
      <Layout>
        <LoadingKanjis />;
      </Layout>
    );
  }

  return (
    <Layout>
      <SuspendedKanjiList />
    </Layout>
  );
};
