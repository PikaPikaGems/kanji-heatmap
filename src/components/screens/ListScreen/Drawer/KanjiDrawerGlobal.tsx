import { useCallback } from "react";
import { useKanjiUrlState } from "@/hooks/routing-hooks";
import { KanjiDrawer } from "../Drawer";

const KanjiDrawerGlobal = () => {
  const [openedKanji, setOpenedKanji] = useKanjiUrlState();

  const onDrawerClose = useCallback(() => {
    setOpenedKanji(null);
  }, [setOpenedKanji]);
  return (
    <>
      <KanjiDrawer
        isOpen={openedKanji !== null}
        onClose={onDrawerClose}
        kanji={openedKanji ?? ""}
      />
    </>
  );
};

export default KanjiDrawerGlobal;
