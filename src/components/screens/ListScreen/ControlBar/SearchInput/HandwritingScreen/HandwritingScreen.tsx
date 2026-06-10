import { ReactNode, useState } from "react";
import {
  DrawingPad,
  DrawingSubmitPayload,
  Stroke,
} from "@/components/dependent/DrawingPad";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import { KanjiItemSimpleButton } from "@/components/sections/KanjiHoverItem/KanjiItemButton";
import { SmallUnexpectedErrorFallback, SmallUnexpectedErrorFallbackTxt } from "@/components/error/SmallUnexpectedErrorFallback";
import { ErrorBoundary } from "@/components/error";

type RecognitionStatus = "idle" | "loading" | "success" | "error";

const TitleLayout = ({ children }: { children: ReactNode }) => {
  return (
    <span className="px-1 text-sm font-bold text-black bg-white rounded-full dark:bg-black dark:text-white">
      {children}
    </span>
  );
};

const HandwritingScreenLayout = ({
  top,
  bottom,
  candidatesCount,
}: {
  top: ReactNode;
  bottom: ReactNode;
  candidatesCount: number;
}) => {
  return (
    <div className="relative w-full px-1 mx-auto">
      {/* Draw a Kanji */}
      <div className="absolute z-50 w-full m-auto -top-1">
        <TitleLayout>Draw a Kanji</TitleLayout>
      </div>
      <div
        className="relative flex flex-wrap items-start justify-center w-full py-1 mt-2 overflow-x-hidden overflow-y-auto border-2 border-dotted rounded-md dark:border-slate-600"
        style={{ maxHeight: "calc(100dvh - 185px)" }}
      >
        {top}
      </div>

      {/* Results Preview */}
      <div className="z-50 flex w-full py-1 pt-3 mt-3 mb-3 overflow-x-auto overflow-y-hidden border-2 border-dotted rounded-md dark:border-slate-600 h-36 scrollbar-thin animate-fade-in">
        {bottom}
      </div>
      <div className="absolute bottom-[142px] w-full m-auto z-50">
        <TitleLayout>
          Results Preview {candidatesCount > 0 ? `(${candidatesCount})` : ""}
        </TitleLayout>
      </div>
    </div>
  );
};

const buildInkPayload = ({ strokes, width, height }: DrawingSubmitPayload) => {
  const ink = strokes.map((stroke) => {
    const xs: number[] = [];
    const ys: number[] = [];
    stroke.forEach(([x, y]) => {
      xs.push(Math.round(x));
      ys.push(Math.round(y));
    });
    return [xs, ys];
  });

  return {
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: {
          writing_area_width: width,
          writing_area_height: height,
        },
        ink,
        language: "ja",
      },
    ],
  };
};

const parseCandidates = (data: unknown): string[] => {
  // Expected shape: ["SUCCESS", [["<hash>", ["時","持",...], [], {...}]]]
  if (
    Array.isArray(data) &&
    data[0] === "SUCCESS" &&
    Array.isArray(data[1]) &&
    Array.isArray(data[1][0]) &&
    Array.isArray(data[1][0][1])
  ) {
    return data[1][0][1] as string[];
  }
  return [];
};

const messageBoxCN =
  "w-full text-xs h-full font-bold flex justify-center items-center p-2 text-center";

const HandwritingResultsPreview = ({
  status,
  candidates,
  onClick,
}: {
  status: RecognitionStatus;
  candidates: string[];
  onClick: () => void;
}) => {

  if (status === "loading") {
    return (
      <div className={messageBoxCN}>
        <div>認識中 {`(Recognizing..)`}</div>
      </div>
    );
  }

  if (status === "error") {
    return <SmallUnexpectedErrorFallbackTxt txt={"Google's handwriting API can't be accessed right now."} />;
  }

  if (candidates.length === 0) {
    // Recognition ran but matched nothing in our dataset.
    if (status === "success") {
      return (
        <div className={messageBoxCN}>
          <div>すみません 🙇🏽‍♀️ No match found. Try drawing again.</div>
        </div>
      );
    }

    // Nothing drawn / searched yet.
    return (
      <div className={`${messageBoxCN} font-medium text-muted-foreground px-4`}>
        <div>Draw a kanji above, then tap the search button to see matches.</div>
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary fallback={<SmallUnexpectedErrorFallback />}>
        {candidates.map((kanji) => {
          return (
            <KanjiItemSimpleButton key={kanji} kanji={kanji} onClick={onClick} />
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
}: {
  value: string;
  onChange: (newValue: string) => void;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  onResultClick: () => void;
}) => {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [svgSize] = useState(() =>
    Math.min(300, (typeof window !== "undefined" ? window.innerWidth : 360) - 56)
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
      const response = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInkPayload(payload)),
      });

      if (!response.ok) {
        throw new Error(`Handwriting API error: ${response.status}`);
      }

      const data = await response.json();
      // Keep only the candidates that exist in our kanji dataset.
      const available = parseCandidates(data).filter(
        (kanji) => {
          return getBasicInfo == null || getBasicInfo(kanji)?.on != null || getBasicInfo(kanji)?.kun != null
        }
      );

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
          onClick={onResultClick}
        />
      }
    />
  );
};
