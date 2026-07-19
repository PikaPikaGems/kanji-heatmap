import { ReactNode, useState } from "react";
import { DrawingPad } from "@/components/dependent/DrawingPad";
import type { DrawingSubmitPayload, Stroke } from "@/lib/stroke-types";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { KanjiItemSimpleButton } from "@/components/sections/KanjiHoverItem/KanjiItemButton";
import {
  SmallUnexpectedErrorFallback,
  SmallUnexpectedErrorFallbackTxt,
} from "@/components/error/SmallUnexpectedErrorFallback";
import { ErrorBoundary } from "@/components/error";
import { RecognizingStatus } from "@/components/common/RecognizingStatus";
import { Recognizer } from "./recognizers";

type RecognitionStatus = "idle" | "loading" | "success" | "error";

const TitleLayout = ({ children }: { children: ReactNode }) => {
  return (
    <span className="px-2 text-sm font-bold rounded-full text-foreground bg-background ">
      {children}
    </span>
  );
};

const HandwritingScreenLayout = ({
  top,
  bottom,
  candidatesCount,
  title = "Draw a Kanji",
}: {
  top: ReactNode;
  bottom: ReactNode;
  candidatesCount: number;
  title?: string;
}) => {
  return (
    <div className="relative w-full px-1 mx-auto">
      <div className="absolute z-50 w-full m-auto -top-1">
        <TitleLayout>{title}</TitleLayout>
      </div>
      <div
        className="relative flex flex-wrap items-start justify-center w-full py-1 mt-2 overflow-x-hidden overflow-y-auto border-2 border-dotted rounded-md border-foreground/30"
        style={{ maxHeight: "calc(100dvh - 185px)" }}
      >
        {top}
      </div>

      {/* Results Preview */}
      <div className="z-50 flex w-full pt-4 pb-2 mt-2 mb-2 overflow-x-auto overflow-y-hidden border-2 border-dotted rounded-md h-44 border-foreground/30 scrollbar-thin animate-fade-in">
        {bottom}
      </div>
      <div className="absolute bottom-[170px] w-full m-auto z-50">
        <TitleLayout>
          Results Preview {candidatesCount > 0 ? `(${candidatesCount})` : ""}
        </TitleLayout>
      </div>
    </div>
  );
};

const messageBoxCN =
  "w-full text-xs h-full font-bold flex justify-center items-center p-2 text-center";

const HandwritingResultsPreview = ({
  status,
  candidates,
  errorText,
  idleContent,
  onClick,
}: {
  status: RecognitionStatus;
  candidates: string[];
  errorText: string;
  idleContent?: ReactNode;
  onClick: () => void;
}) => {
  if (status === "loading") {
    return (
      <div className={messageBoxCN}>
        <RecognizingStatus label="認識中 · Recognizing…" />
      </div>
    );
  }

  if (status === "error") {
    return <SmallUnexpectedErrorFallbackTxt txt={errorText} />;
  }

  if (candidates.length === 0) {
    // Recognition ran but matched nothing in our dataset.
    if (status === "success") {
      return (
        <div className={messageBoxCN}>
          <div>すみません 🙇‍♀️ No match found. Try drawing again.</div>
        </div>
      );
    }

    // Nothing drawn / searched yet.
    return (
      <div className={`${messageBoxCN} font-medium px-4`}>
        {idleContent ??
          "Draw a kanji above, then tap the search 🔍 button to see matches."}
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
        {candidates.map((kanji) => {
          return (
            <KanjiItemSimpleButton
              key={kanji}
              kanji={kanji}
              onClick={onClick}
            />
          );
        })}
      </ErrorBoundary>
    </>
  );
};

export const HandWritingDrawingPad = ({
  value,
  onChange,
  strokes,
  setStrokes,
  onResultClick,
  recognize,
  errorText,
  idleContent,
}: {
  value: string;
  onChange: (newValue: string) => void;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  onResultClick: () => void;
  // How drawn strokes are turned into candidate kanji (online API vs on-device).
  recognize: Recognizer;
  // Shown in the results preview when recognition fails.
  errorText: string;
  // Optional idle-state message (e.g. model credit). Falls back to the default tip.
  idleContent?: ReactNode;
}) => {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [svgSize] = useState(() =>
    Math.min(
      300,
      (typeof window !== "undefined" ? window.innerWidth : 360) - 56
    )
  );
  const getBasicInfo = useGetKanjiInfoFn();

  // The results preview is derived from the search text so it stays in sync
  // with the input field and survives the drawer closing/reopening.
  const candidates = [...value];

  const onSubmit = async (payload: DrawingSubmitPayload) => {
    if (payload.strokes.length === 0) {
      return;
    }

    setStatus("loading");
    try {
      const recognized = await recognize(payload);
      // Keep only the candidates that exist in our kanji dataset.
      const available = recognized.filter((kanji) => {
        return (
          getBasicInfo == null ||
          getBasicInfo(kanji)?.on != null ||
          getBasicInfo(kanji)?.kun != null
        );
      });

      // Drop the recognized kanji into the search text (multi-kanji style)
      // so the main list reflects them and the input keeps them on close.
      onChange(available.join(""));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <HandwritingScreenLayout
      candidatesCount={candidates.length}
      top={
        <DrawingPad
          svgSize={svgSize}
          strokes={strokes}
          setStrokes={setStrokes}
          showSubmitBtn={true}
          onClickSubmit={onSubmit}
          onClickClear={() => {
            setStatus("idle");
            // Clearing the drawing also clears the search text / input field.
            onChange("");
          }}
        />
      }
      bottom={
        <HandwritingResultsPreview
          status={status}
          candidates={candidates}
          errorText={errorText}
          idleContent={idleContent}
          onClick={onResultClick}
        />
      }
    />
  );
};
