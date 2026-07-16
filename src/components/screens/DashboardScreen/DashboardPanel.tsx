import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Dashed panel matching site chrome (Duolingo-adjacent chunky frames). */
export const DashboardPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("bg-background px-4 py-6 sm:px-6", className)}>
    {children}
  </section>
);
