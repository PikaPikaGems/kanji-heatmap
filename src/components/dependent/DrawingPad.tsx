/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useId,
  useRef,
  useState,
} from "react";
import { useGetStrokeFn } from "@/hooks/use-get-stroke-fn";
import { PracticeButton } from "@/components/ui/practice-button";
import { Undo2, Trash2, Search } from "@/components/icons";
import { SquareX } from "lucide-react";

export type Stroke = [number, number][];

export type DrawingSubmitPayload = {
  strokes: Stroke[];
  width: number;
  height: number;
};

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";
  const d: (string | number)[] = ["M", ...stroke[0], "Q"];
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push("Z");
  return d.join(" ");
}

export const DrawingPad = ({
  svgSize,
  strokes: controlledStrokes,
  setStrokes: setControlledStrokes,
  showSubmitBtn = false,
  submitIcon,
  submitLabel = "Search",
  submitDisabled = false,
  onClickSubmit,
  onClickClear,
  showForgotBtn = false,
  onClickForgot,
  forgotDisabled = false,
}: {
  svgSize: number;
  // Optional controlled strokes. When provided, the parent owns the strokes
  // so they survive this component unmounting (e.g. closing a drawer).
  strokes?: Stroke[];
  setStrokes?: Dispatch<SetStateAction<Stroke[]>>;
  showSubmitBtn?: boolean;
  /** Defaults to Search icon when omitted. */
  submitIcon?: ReactNode;
  submitLabel?: string;
  /** Extra disable (e.g. while grading). Empty strokes still disable submit. */
  submitDisabled?: boolean;
  onClickSubmit?: (payload: DrawingSubmitPayload) => void;
  onClickClear?: () => void;
  showForgotBtn?: boolean;
  onClickForgot?: () => void;
  forgotDisabled?: boolean;
}) => {
  const [internalStrokes, setInternalStrokes] = useState<Stroke[]>([]);
  const strokes = controlledStrokes ?? internalStrokes;
  const setStrokes = setControlledStrokes ?? setInternalStrokes;
  const [currentPoints, setCurrentPoints] = useState<[number, number][] | null>(
    null
  );
  const getStrokeFn = useGetStrokeFn();
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  // Mirror of the in-progress stroke so endStroke can commit it without
  // nesting setStrokes inside the setCurrentPoints updater (that would update
  // a parent component during render and trigger a React warning).
  const currentPointsRef = useRef<[number, number][] | null>(null);
  const patternId = useId();

  const toSvgPoint = (
    e: React.PointerEvent<HTMLDivElement>
  ): [number, number] => {
    const rect = wrapperRef.current!.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * svgSize,
      ((e.clientY - rect.top) / rect.height) * svgSize,
    ];
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const point = toSvgPoint(e);
    currentPointsRef.current = [point];
    setCurrentPoints([point]);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isDrawing.current) return;
    const next = [...(currentPointsRef.current ?? []), toSvgPoint(e)];
    currentPointsRef.current = next;
    setCurrentPoints(next);
  };

  const endStroke = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const points = currentPointsRef.current;
    if (points && points.length > 0) {
      setStrokes((s) => [...s, points]);
    }
    currentPointsRef.current = null;
    setCurrentPoints(null);
  };

  const renderStrokePath = (points: [number, number][]) => {
    if (!getStrokeFn || !points.length) return null;
    const outline = getStrokeFn(points, {
      size: 16, // base stroke width in pixels
      thinning: 0.7, // how much stroke thins at ends (0 = uniform, 1 = max taper)
      smoothing: 0.7, // smoothing applied to the stroke outline
      streamline: 0.5, // how much to reduce jitter / iron out wiggles
      easing: (t: number) => t, // easing for simulated pressure curve
      simulatePressure: true, // simulate pen pressure from pointer velocity
      last: true, // cleanly close the final point
      start: {
        cap: true, // draw a round cap at stroke start
        taper: 0, // distance over which start tapers (0 = no taper)
        easing: (t: number) => t,
      },
      end: {
        cap: true, // draw a round cap at stroke end
        taper: 0, // distance over which end tapers (0 = no taper)
        easing: (t: number) => t,
      },
    });
    return getSvgPathFromStroke(outline);
  };

  return (
    <div className="flex flex-col items-center gap-2 mx-auto my-2 sm:m-4">
      <div
        ref={wrapperRef}
        style={{ touchAction: "none", lineHeight: 0 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
      >
        <svg
          ref={svgRef}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="border-2 border-dotted select-none border-foreground rounded-3xl cursor-crosshair"
          style={{ background: "hsl(var(--background))", touchAction: "none" }}
        >
          {/* Decorative layer: grid dots + dashed center axes */}
          <defs>
            <pattern
              id={patternId}
              x="14"
              y="14"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="0"
                cy="0"
                r="1"
                fill="hsl(var(--foreground))"
                opacity="0.25"
              />
            </pattern>
          </defs>
          <rect width={svgSize} height={svgSize} fill={`url(#${patternId})`} />
          <line
            x1={0}
            y1={svgSize / 2}
            x2={svgSize}
            y2={svgSize / 2}
            stroke="hsl(var(--foreground))"
            strokeDasharray="10 4"
            opacity={1}
          />
          <line
            x1={svgSize / 2}
            y1={0}
            x2={svgSize / 2}
            y2={svgSize}
            stroke="hsl(var(--foreground))"
            strokeDasharray="10 4"
            opacity={1}
          />

          {/* User strokes */}
          {strokes.map((pts, i) => {
            const d = renderStrokePath(pts);
            return d ? (
              <path
                key={i}
                d={d}
                style={{ fill: "rgba(var(--theme-color-selected), 1)" }}
              />
            ) : null;
          })}
          {currentPoints &&
            (() => {
              const d = renderStrokePath(currentPoints);
              return d ? (
                <path d={d} style={{ fill: "hsl(var(--primary))" }} />
              ) : null;
            })()}
        </svg>
      </div>
      <div className="flex justify-center mt-2 space-x-2">
        {showForgotBtn && (
          <PracticeButton
            size="icon"
            variant="danger"
            onClick={() => onClickForgot?.()}
            disabled={forgotDisabled}
          >
            <SquareX />
            <span className="sr-only">Forgot</span>
          </PracticeButton>
        )}
        <PracticeButton
          size="icon"
          variant="secondary"
          onClick={() => setStrokes((s) => s.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          <Undo2 />
          <span className="sr-only">Undo</span>
        </PracticeButton>
        <PracticeButton
          size="icon"
          variant="secondary"
          onClick={() => {
            setStrokes([]);
            setCurrentPoints(null);
            onClickClear?.();
          }}
          disabled={strokes.length === 0 && !currentPoints}
        >
          <Trash2 />
          <span className="sr-only">Clear</span>
        </PracticeButton>
        {showSubmitBtn && (
          <PracticeButton
            size="icon"
            onClick={() =>
              onClickSubmit?.({
                strokes,
                width: svgSize,
                height: svgSize,
              })
            }
            disabled={strokes.length === 0 || submitDisabled}
          >
            {submitIcon ?? <Search />}
            <span className="sr-only">{submitLabel}</span>
          </PracticeButton>
        )}
      </div>
    </div>
  );
};
