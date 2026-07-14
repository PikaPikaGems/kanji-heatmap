import { ReactNode, useState } from "react";
import { Stroke } from "@/components/dependent/DrawingPad";
import { ErrorBoundary } from "@/components/error";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";
import { HandWritingDrawingPad } from "./HandwritingScreen";
import { HandwritingScreenDialog } from "./HandwritingScreenDialog";
import {
  recognizeWithDaKanji,
  recognizeWithGoogle,
  recognizeWithKanjiCanvas,
} from "./recognizers";

// "google" = online API; "kanjicanvas" / "dakanji" = on-device.
export type HandwritingVariant = "google" | "kanjicanvas" | "dakanji";

const DAKANJI_IDLE_CONTENT = (
  <span>
    Character recognition powered by machine learning from{" "}
    <a
      href="https://github.com/dariyooo/DaKanji-Single-Kanji-Recognition"
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      Dariyooo (DaAppLab)
    </a>
  </span>
);

const VARIANT_CONFIG = {
  google: {
    recognize: recognizeWithGoogle,
    errorText: "Google's handwriting API can't be accessed right now.",
    idleContent: undefined as ReactNode | undefined,
  },
  kanjicanvas: {
    recognize: recognizeWithKanjiCanvas,
    errorText: "The handwriting recognizer couldn't be loaded right now.",
    idleContent: undefined as ReactNode | undefined,
  },
  dakanji: {
    recognize: recognizeWithDaKanji,
    errorText: "The DaKanji recognizer couldn't be loaded right now.",
    idleContent: DAKANJI_IDLE_CONTENT,
  },
} as const;

// Owns the drawn strokes for one handwriting session. The parent keeps this
// mounted independently of the drawer's open state, so the drawing survives
// closing and reopening the drawer; the parent resets the strokes by remounting
// this component (changing its `key`).
export const HandwritingControl = ({
  variant,
  isOpen,
  onClose,
  value,
  onChange,
}: {
  variant: HandwritingVariant;
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (newValue: string) => void;
}) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const { recognize, errorText, idleContent } = VARIANT_CONFIG[variant];

  return (
    <HandwritingScreenDialog isOpen={isOpen} onClose={onClose}>
      <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
        <HandWritingDrawingPad
          value={value}
          onChange={onChange}
          strokes={strokes}
          setStrokes={setStrokes}
          recognize={recognize}
          errorText={errorText}
          idleContent={idleContent}
          onResultClick={onClose}
        />
      </ErrorBoundary>
    </HandwritingScreenDialog>
  );
};
