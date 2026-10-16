import type { ReactNode } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type SegmentedTabOption<T extends string> = {
  value: T;
  label: ReactNode;
};

/**
 * Pill-shaped tab switcher with a highlight that slides to the active tab
 * (the study notes' Edit Mode / View Mode switch). Put it inside a Radix
 * `Tabs` whose value is `value`.
 */
export const SegmentedTabsList = <T extends string>({
  value,
  options,
  label,
  className,
}: {
  value: T;
  options: SegmentedTabOption<T>[];
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}) => {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  return (
    <TabsList
      aria-label={label}
      className={cn(
        // Equal-width columns (as wide as the longest label), so the sliding
        // highlight, 1/n of the width, always lines up with the active tab.
        "relative inline-grid grid-flow-col auto-cols-fr h-10 p-0.5 rounded-full border border-border bg-muted/70",
        className
      )}
    >
      <div className="absolute inset-0.5 pointer-events-none" aria-hidden>
        <div
          className="h-full transition-transform duration-300 ease-out rounded-full shadow-sm bg-background"
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${index * 100}%)`,
          }}
        />
      </div>
      {options.map((option) => (
        <TabsTrigger
          key={option.value}
          value={option.value}
          className="relative z-10 px-4 rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
