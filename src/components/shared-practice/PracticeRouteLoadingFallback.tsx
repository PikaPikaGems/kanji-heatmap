import { Loader2 } from "lucide-react";
import assetsPaths from "@/lib/assets-paths";

export const PracticeRouteLoadingFallback = ({ label }: { label: string }) => {
  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden bg-background animate-fade-in"
      role="status"
      aria-label={`Loading ${label}`}
    >
      <header className="flex items-center w-full gap-3 px-2 border-b-4 border-dashed shrink-0">
        <img
          src={assetsPaths.ICON_SVG}
          alt=""
          className="h-7 w-7 my-1.5 opacity-70"
        />
        <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
          <div className="w-1/3 h-full rounded-full bg-theme animate-pulse" />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="w-10 h-10 border rounded-xl bg-muted/40 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          />
        ))}
      </header>

      <main className="flex flex-col items-center justify-center flex-1 min-h-0 gap-5 px-4">
        <div className="relative flex items-center justify-center w-full max-w-xl border-2 border-dashed aspect-[4/3] max-h-[55dvh] rounded-3xl bg-muted/20">
          <div className="absolute w-2/3 h-8 -translate-x-1/2 rounded-lg left-1/2 top-6 bg-muted/60 animate-pulse" />
          <div className="w-28 h-28 rounded-3xl bg-muted/60 animate-pulse" />
          <div className="absolute flex gap-3 -translate-x-1/2 bottom-6 left-1/2">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="w-16 h-10 rounded-xl bg-muted/60 animate-pulse"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading {label}...
        </div>
      </main>
    </div>
  );
};
