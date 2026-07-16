import { CONTAINER_CN, SVG_SIZE } from "./stroke-animation-constants";

/** Shared Suspense fallback for lazy-loaded StrokeAnimation. */
export const StrokeAnimationLoadingScreen = () => {
  return (
    <div className="p-4">
      <div className="flex px-4 pt-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 rounded-full w-9 bg-muted animate-pulse" />
          <div className="w-24 h-3 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
      <div className={CONTAINER_CN} style={{ height: SVG_SIZE }}>
        <div
          className="relative overflow-hidden rounded-3xl bg-muted animate-pulse"
          style={{ width: SVG_SIZE, height: SVG_SIZE }}
        >
          <svg
            width={SVG_SIZE}
            height={SVG_SIZE}
            className="absolute inset-0 text-foreground opacity-10"
            aria-hidden
          >
            <line
              x1={SVG_SIZE / 2}
              y1={0}
              x2={SVG_SIZE / 2}
              y2={SVG_SIZE}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
            <line
              x1={0}
              y1={SVG_SIZE / 2}
              x2={SVG_SIZE}
              y2={SVG_SIZE / 2}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
          </svg>
        </div>
      </div>
      <div className="flex justify-center space-x-2">
        <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
        <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
      </div>
    </div>
  );
};
