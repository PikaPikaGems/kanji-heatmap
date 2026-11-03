import { lazy } from "react";
import { useIsKanjiWorkerReady } from "@/kanji-worker/kanji-worker-hooks";

import { ControlBar } from "./ControlBar/";
import LoadingKanjis from "./KanjiList/LoadingKanjis";

import { SuspendedKanjiList } from "./KanjiList/LazyKanjiList";
import { ItemCountBadge } from "./ControlBar/ItemCountBadge";
import { ListScreenLayout } from "./ListScreenLayout";

const ItemPresentationSettingsPopover = lazy(
  () => import("./ControlBar/ItemPresentation/ItemPresentationPopover")
);

export const ListScreen = () => {
  const ready = useIsKanjiWorkerReady();

  return (
    <ListScreenLayout
      controlBar={<ControlBar Popover={ItemPresentationSettingsPopover} />}
      badge={<ItemCountBadge />}
    >
      {ready ? <SuspendedKanjiList /> : <LoadingKanjis />}
    </ListScreenLayout>
  );
};
