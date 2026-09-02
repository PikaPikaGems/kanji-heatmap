import {
  CONTAINER_CN,
  HINT_SVG_SIZE,
  SVG_SIZE,
} from "./stroke-animation-constants";

const PadGridSkeleton = () => (
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
);

const SwitchRowSkeleton = () => (
  <div className="flex items-center gap-2">
    <div className="h-5 rounded-full w-9 bg-muted animate-pulse" />
    <div className="w-24 h-3 rounded-lg bg-muted animate-pulse" />
  </div>
);

/** Suspense fallback for stroke-order replay (kanji details accordion). */
export const StrokeAnimationLoadingScreen = () => {
  return (
    <div className="p-4">
      <div className="flex px-4 pt-6 pb-3">
        <SwitchRowSkeleton />
      </div>
      <div className={CONTAINER_CN} style={{ height: SVG_SIZE }}>
        <PadGridSkeleton />
      </div>
      <div className="flex justify-center space-x-2">
        <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
        <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
      </div>
    </div>
  );
};

/** Suspense fallback when the writing-practice pad is the first paint. */
export const WritingPracticeLoadingScreen = () => (
  <div>
    <div className="flex px-4 pt-6 pb-3">
      <div className="relative flex items-center w-full gap-2 mb-4">
        <SwitchRowSkeleton />
        <div className="absolute right-0 z-10 px-2 m-4 border border-dashed sm:-right-8 rounded-2xl -top-10 border-foreground bg-background/80">
          <div
            className="rounded-xl bg-muted animate-pulse"
            style={{
              width: HINT_SVG_SIZE,
              height: HINT_SVG_SIZE,
            }}
          />
        </div>
      </div>
    </div>
    <div className="min-h-[min(530px,calc(90dvh-11rem))]">
      <div className="flex flex-col items-center gap-3 px-2 pt-4 pb-6 sm:px-4">
        <div className="flex flex-col items-center gap-2 mx-auto my-2 sm:m-4">
          <div className="relative">
            <PadGridSkeleton />
            <div className="absolute inset-x-0 top-0 z-10 hidden px-2 pt-2 [@media(max-height:40rem)]:block">
              <div className="h-8 rounded-2xl bg-muted/80 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-center mt-2 space-x-2">
            <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
            <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
            <div className="rounded-lg w-9 h-9 bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-center w-full max-w-[310px] min-h-10 px-2 [@media(max-height:40rem)]:hidden">
          <div className="w-48 h-4 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="w-40 h-3 rounded-lg bg-muted animate-pulse opacity-70" />
      </div>
    </div>
  </div>
);
