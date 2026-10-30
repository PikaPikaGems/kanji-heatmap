import type { ReactNode } from "react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * One collapsible part of Kanji Mastery, styled like the Fill in the Kanji
 * groups. Goes inside an `Accordion`; `title` is also its value.
 */
export const MasterySubsection = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <AccordionItem
    value={title}
    className="border-b-2 border-dashed last:border-b-0"
  >
    <AccordionTrigger className="py-3 text-left hover:no-underline">
      <span className="text-sm font-semibold">{title}</span>
    </AccordionTrigger>
    <AccordionContent className="pt-1 pl-3 border-l-2 border-dotted">
      {children}
    </AccordionContent>
  </AccordionItem>
);
