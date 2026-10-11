import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SimpleAccordion from "@/components/common/SimpleAccordion";

/** Collapsible dashboard section, same accordion as the kanji details drawer. */
export const DashboardPanel = ({
  title,
  defaultOpen = false,
  children,
  className,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("bg-background", className)}>
    <SimpleAccordion trigger={title} defaultOpen={defaultOpen}>
      <div className="px-2 pt-2 pb-4 sm:px-4">{children}</div>
    </SimpleAccordion>
  </section>
);
