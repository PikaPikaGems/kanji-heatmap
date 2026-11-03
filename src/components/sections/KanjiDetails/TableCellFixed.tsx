import { ReactNode } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** A label cell that keeps the same width on every row of a details table. */
export const TableCellFixed = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <TableCell className={cn("w-24 sm:w-32", className)}>{children}</TableCell>
);
