import { Link } from "@/components/dependent/routing";
import { useLocation } from "@/components/dependent/routing/router-adapter";
import { floatingIslandNavLinks } from "@/lib/pages/nav-links";
import { useScrollLockSettleRef } from "@/hooks/use-scroll-lock-fade-tick";
import { cn } from "@/lib/utils";

const islandHrefs = new Set(floatingIslandNavLinks.map((link) => link.href));

export const FloatingIsland = () => {
  const [location] = useLocation();
  const settleRef = useScrollLockSettleRef<HTMLElement>();

  if (!islandHrefs.has(location)) {
    return null;
  }

  const activeIndex = floatingIslandNavLinks.findIndex(
    (link) => link.href === location
  );

  return (
    <nav
      ref={settleRef}
      aria-label="Primary"
      className="fixed-viewport-layer fixed z-40 left-[calc(0.75rem+env(safe-area-inset-left))] bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div
        className={cn(
          "relative flex items-center gap-0.5 p-1 rounded-full",
          "bg-background",
          "border-2 border-b-[5px] border-foreground/20",
          "shadow-md"
        )}
      >
        <div className="absolute inset-1 pointer-events-none">
          <div
            aria-hidden="true"
            className={cn(
              "h-full w-1/3 rounded-full",
              "background-theme-color-with-opacity-100",
              "border-2 border-b-[4px] border-theme-color-darker",
              "transition-transform duration-300 ease-out"
            )}
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
        {floatingIslandNavLinks.map((link) => {
          const isActive = link.href === location;
          const Icon = link.Icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.title}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative z-10 flex items-center justify-center",
                "size-9 rounded-full select-none",
                "outline-none [-webkit-tap-highlight-color:transparent]",
                "transition-[transform,colors,filter] duration-75 ease-out",
                "active:translate-y-[2px]",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground hover:brightness-105"
              )}
            >
              <Icon
                className="size-3.5"
                strokeWidth={2.25}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
