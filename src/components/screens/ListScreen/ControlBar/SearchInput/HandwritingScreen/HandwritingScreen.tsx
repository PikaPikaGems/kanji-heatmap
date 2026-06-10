import { ReactNode, useState } from "react";
import {
  DrawingPad,
  DrawingSubmitPayload,
  Stroke,
} from "@/components/dependent/DrawingPad";
import { CircleX } from "@/components/icons";
import { SmallUnexpectedErrorFallback } from "@/components/error/SmallUnexpectedErrorFallback";

type RecognitionStatus = "idle" | "loading" | "success" | "error";

const TitleLayout = ({ children }: { children: ReactNode }) => {
  return (
    <span
      className="
        font-bold px-1 rounded-full text-sm
        dark:bg-black dark:text-white bg-white text-black
      "
    >
      {children}
    </span>
  );
};

const SelectedKanjiTitle = ({ count }: { count: number }) => {
  return <TitleLayout>Kanji Selected {`(${count})`}</TitleLayout>;
};

const CandidatesTitle = ({ count }: { count: number }) => {
  return (
    <TitleLayout> Results Preview {count > 0 ? `(${count})` : ""}</TitleLayout>
  );
};

const HandwritingScreenLayout = ({
  top,
  middle,
  bottom,
  count,
}: {
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
  count: number;
}) => {
  return (
    <div className="mx-auto w-full h-full px-1 relative flex flex-col">
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
        {top}
      </div>

      {count > 0 && (
        <div className="relative w-full">
          <div className="absolute -top-1 w-full m-auto z-50">
            <SelectedKanjiTitle count={count} />
          </div>
          <div className="w-full h-24 mt-1 pt-3 mb-1 pb-0 overflow-x-auto overflow-y-hidden flex rounded-md scrollbar-thin relative transition-all animate-fade-in">
            {middle}
          </div>
        </div>
      )}

      <div className="relative w-full">
        <div className="absolute -top-1 w-full m-auto z-50">
          <CandidatesTitle count={count} />
        </div>
        <div className="border-2 border-dotted dark:border-slate-600 pt-3 mt-2 w-full h-36 my-1 py-1 overflow-x-auto overflow-y-hidden flex rounded-md scrollbar-thin z-40 animate-fade-in">
          {bottom}
        </div>
      </div>
    </div>
  );
};

const CandidateBtn = ({
  kanji,
  isSelected,
  onClick,
}: {
  kanji: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const cn2 = isSelected
    ? "rounded-xl bg-black text-white dark:bg-white dark:text-black"
    : "border border-dotted border-current rounded-sm hover:bg-[#2effff] hover:text-black";

  return (
    <button
      onClick={onClick}
      className={`shrink-0 w-[55px] h-[55px] transition-all duration-300 ml-1 my-auto kanji-font text-3xl ${cn2}`}
    >
      {kanji}
    </button>
  );
};

const SelectedKanjiBtn = ({
  kanji,
  onClick,
}: {
  kanji: string;
  onClick: () => void;
}) => {
  return (
    <div
      className="
        relative shrink-0 w-[70px] h-full ml-1 my-auto py-0
        flex flex-col justify-center items-center
        rounded-xl bg-black text-white dark:bg-white dark:text-black
      "
    >
      <button onClick={onClick}>
        <CircleX className="absolute top-1 right-1 scale-75 hover:text-red-500" />
        <span className="sr-only">Remove {kanji}</span>
      </button>
      <span className="block text-4xl kanji-font">{kanji}</span>
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

const CandidatesPreview = ({
  status,
  candidates,
  selectedSet,
  onSelect,
}: {
  status: RecognitionStatus;
  candidates: string[];
  selectedSet: Set<string>;
  onSelect: (kanji: string) => void;
}) => {
  if (status === "loading") {
    return (
      <div className="w-full text-xs h-full font-bold flex justify-center items-center p-2">
        <div>認識中 {`(Recognizing..)`}</div>
      </div>
    );
  }

  if (status === "error") {
    return <SmallUnexpectedErrorFallback />;
  }

  if (status === "idle") {
    return (
      <div className="w-full text-xs h-full font-medium flex justify-center items-center p-2 text-center text-muted-foreground">
        <div>Draw a kanji above, then tap the search button to see matches.</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="w-full text-xs h-full font-bold flex justify-center items-center p-2 text-center">
        <div>すみません 🙇🏽‍♀️ No match found. Try drawing again.</div>
      </div>
    );
  }

  return (
    <>
      {candidates.map((kanji) => (
        <CandidateBtn
          key={kanji}
          kanji={kanji}
          isSelected={selectedSet.has(kanji)}
          onClick={() => onSelect(kanji)}
        />
      ))}
    </>
  );
};

export const HandWritingDrawingPad = ({
  value,
  onChange,
  strokes,
  setStrokes,
}: {
  value: string;
  onChange: (newValue: string) => void;
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
}) => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [svgSize] = useState(() =>
    Math.min(300, (typeof window !== "undefined" ? window.innerWidth : 360) - 56)
  );

  const selected = [...value];
  const selectedSet = new Set(selected);

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
      setCandidates(parseCandidates(data));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const toggleKanji = (kanji: string) => {
    if (selectedSet.has(kanji)) {
      onChange(selected.filter((k) => k !== kanji).join(""));
      return;
    }
    onChange(value + kanji);
  };

  return (
    <HandwritingScreenLayout
      count={selected.length}
      top={
        <DrawingPad
          svgSize={svgSize}
          strokes={strokes}
          setStrokes={setStrokes}
          showSubmitBtn={true}
          onClickSubmit={onSubmit}
        />
      }
      middle={selected.map((kanji) => (
        <SelectedKanjiBtn
          key={kanji}
          kanji={kanji}
          onClick={() => toggleKanji(kanji)}
        />
      ))}
      bottom={
        <CandidatesPreview
          status={status}
          candidates={candidates}
          selectedSet={selectedSet}
          onSelect={toggleKanji}
        />
      }
    />
  );
};
