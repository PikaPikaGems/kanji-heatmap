import { ReactNode, useId } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SimpleAccordion = ({
  trigger,
  children,
  defaultOpen,
}: {
  trigger: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) => {
  const accordionId = useId();
  const id = `accordion-${accordionId}`;
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? id : undefined}
    >
      <AccordionItem value={id}>
        <AccordionTrigger className="p-2 flex justify-start space-x-2 focus:outline-none text-xl">
          {trigger}
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SimpleAccordion;
