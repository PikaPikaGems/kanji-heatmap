import { useState } from "react";
import { Stroke } from "@/components/dependent/DrawingPad";
import { ErrorBoundary } from "@/components/error";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";
import { HandWritingDrawingPad } from "./HandwritingScreen";
import { HandwritingScreenDialog } from "./HandwritingScreenDialog";
import { recognizeWithGoogle, recognizeWithKanjiCanvas } from "./recognizers";

// "google" recognizes via an online API; "kanjicanvas" recognizes on-device.
export type HandwritingVariant = "google" | "kanjicanvas";

const VARIANT_CONFIG = {
  google: {
    recognize: recognizeWithGoogle,
    errorText: "Google's handwriting API can't be accessed right now.",
  },
  kanjicanvas: {
    recognize: recognizeWithKanjiCanvas,
    errorText: "The handwriting recognizer couldn't be loaded right now.",
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
  const { recognize, errorText } = VARIANT_CONFIG[variant];

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
          onResultClick={onClose}

        />
      </ErrorBoundary>
    </HandwritingScreenDialog>
  );
};
