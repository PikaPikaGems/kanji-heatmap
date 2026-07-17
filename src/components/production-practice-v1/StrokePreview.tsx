import { useId } from "react";
import type { Stroke } from "@/components/dependent/DrawingPad";
import { useGetStrokeFn } from "@/hooks/use-get-stroke-fn";

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

/**
 * Read-only replay of a DrawingPad stroke snapshot.
 * `sourceSize` must match the pad the strokes were drawn on (viewBox);
 * `displaySize` is the on-screen square size.
 */
export const StrokePreview = ({
  strokes,
  sourceSize,
  displaySize,
}: {
  strokes: Stroke[];
  sourceSize: number;
  displaySize: number;
}) => {
  const patternId = useId();
  const getStrokeFn = useGetStrokeFn();

  const renderPath = (points: Stroke) => {
    if (!getStrokeFn || !points.length) return null;
    const outline = getStrokeFn(points, {
      size: 16,
      thinning: 0.7,
      smoothing: 0.7,
      streamline: 0.5,
      easing: (t: number) => t,
      simulatePressure: true,
      last: true,
      start: { cap: true, taper: 0, easing: (t: number) => t },
      end: { cap: true, taper: 0, easing: (t: number) => t },
    });
    return getSvgPathFromStroke(outline);
  };

  return (
    <svg
      width={displaySize}
      height={displaySize}
      viewBox={`0 0 ${sourceSize} ${sourceSize}`}
      className="border-2 border-dotted select-none border-foreground rounded-3xl"
      style={{ background: "hsl(var(--background))" }}
    >
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
      <rect
        width={sourceSize}
        height={sourceSize}
        fill={`url(#${patternId})`}
      />
      <line
        x1={0}
        y1={sourceSize / 2}
        x2={sourceSize}
        y2={sourceSize / 2}
        stroke="hsl(var(--foreground))"
        strokeDasharray="10 4"
      />
      <line
        x1={sourceSize / 2}
        y1={0}
        x2={sourceSize / 2}
        y2={sourceSize}
        stroke="hsl(var(--foreground))"
        strokeDasharray="10 4"
      />
      {strokes.map((pts, i) => {
        const d = renderPath(pts);
        return d ? (
          <path
            key={i}
            d={d}
            style={{ fill: "rgba(var(--theme-color-selected), 1)" }}
          />
        ) : null;
      })}
    </svg>
  );
};
