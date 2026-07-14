import { useState } from "react";
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

const IdleCredit = ({ href, label }: { href: string; label: string }) => (
  <span className="text-sm">
    Recognition Powered by{" "}
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold underline underline-offset-2 hover:opacity-80"
    >
      {label}
    </a>{" "}
    💪
  </span>
);

const VARIANT_CONFIG = {
  google: {
    recognize: recognizeWithGoogle,
    errorText: "Google's handwriting API can't be accessed right now.",
    idleContent: (
      <IdleCredit
        href="https://www.google.com/inputtools/services/features/handwriting.html"
        label="Google Handwriting API"
      />
    ),
  },
  dakanji: {
    recognize: recognizeWithDaKanji,
    errorText: "The DaKanji recognizer couldn't be loaded right now.",
    idleContent: (
      <IdleCredit
        href="https://github.com/dariyooo/DaKanji-Single-Kanji-Recognition"
        label="Dariyooo (DaAppLab)"
      />
    ),
  },
  kanjicanvas: {
    recognize: recognizeWithKanjiCanvas,
    errorText: "The handwriting recognizer couldn't be loaded right now.",
    idleContent: (
      <IdleCredit
        href="https://github.com/asdfjkl/kanjicanvas"
        label="KanjiCanvas (asdfjkl)"
      />
    ),
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
