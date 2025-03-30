import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { GenericPopover } from "@/components/common/GenericPopover";
import { useSpeak } from "@/hooks/use-jp-speak";
import useKeyboardListener from "@/hooks/use-keyboard-listener";
import { useNextPrevKanji } from "@/hooks/use-next-prev-kanji";
import { useSetOpenedParam } from "@/components/dependent/routing/routing-hooks";

const kbdClass =
  "h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[12px] font-medium opacity-100 sm:flex";

const IconMeanings = ({ kbd, text }: { kbd: string; text: string }) => {
  return (
    <>
      <div className="flex items-center w-full justify-left">
        <kbd className={kbdClass}>{kbd}</kbd>
        <span className="ml-2 text-xs">{text}</span>
      </div>
    </>
  );
};

export const KanjiKeyboardShortcuts = ({ kanji }: { kanji: string }) => {
  const speakKanji = useSpeak(kanji);
  const kanjis = useNextPrevKanji(kanji);
  const setOpen = useSetOpenedParam();

  useKeyboardListener({
    ArrowLeft: () => {
      if (kanjis?.prev) {
        setOpen(kanjis?.prev);
      }
    },
    ArrowRight: () => {
      if (kanjis?.next) {
        setOpen(kanjis?.next);
      }
    },
    "0": () => {
      speakKanji();
    },
  });

  if (kanjis == null) {
    return (
      <Button
        variant={"outline"}
        size="icon"
        className="h-8 w-8 relative rounded-xl"
        disabled={true}
      >
        <Keyboard />
      </Button>
    );
  }

  return (
    <GenericPopover
      trigger={
        <Button
          variant={"outline"}
          size="icon"
          className="h-8 w-8 relative rounded-xl"
        >
          <Keyboard />
        </Button>
      }
      content={
        <div className="p-2 flex flex-col space-y-1">
          <IconMeanings kbd="`" text="Change font" />
          <IconMeanings kbd="0" text="Hear Kanji Default Reading" />
          <IconMeanings kbd="→" text="Next Kanji" />
          <IconMeanings kbd="←" text="Previous Kanji" />
        </div>
      }
    />
  );
};
