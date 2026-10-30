import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NotificationDot } from "@/components/common/NotificationDot";
import {
  NavSectionHeadingText,
  NavSectionLinks,
  type NavLinkListProps,
} from "@/components/common/DashedNavLinkSections";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { NavLinkSection } from "@/lib/pages/nav-links";

/** Headings the user collapsed (true); every section starts open. */
const COLLAPSED_KEY = "header-nav-collapsed-sections";

/**
 * The sidebar's menu: like DashedNavLinkSections, but each headed section
 * folds under its heading, and stays folded across visits. A folded section
 * with reviews due shows the due dot on its heading.
 */
export const CollapsibleNavLinkSections = ({
  sections,
  ...listProps
}: NavLinkListProps & { sections: NavLinkSection[] }) => {
  const [collapsed, setCollapsed] = useLocalStorage<Record<string, boolean>>(
    COLLAPSED_KEY,
    {}
  );
  const headings = sections.flatMap((s) => (s.heading ? [s.heading] : []));
  const open = headings.filter((heading) => !collapsed[heading]);

  return (
    <>
      {sections.map((section) => {
        const { heading } = section;
        if (!heading) {
          return (
            <NavSectionLinks key="top" links={section.links} {...listProps} />
          );
        }
        const hasDue = section.links.some((link) =>
          listProps.dotHrefs?.has(link.href)
        );
        return (
          <Accordion
            key={heading}
            type="multiple"
            value={open.filter((h) => h === heading)}
            onValueChange={(value) =>
              setCollapsed(heading, !value.includes(heading))
            }
          >
            <AccordionItem value={heading} className="border-b-0">
              <AccordionTrigger
                onPointerDown={listProps.onItemPointerDown}
                className="pt-3 pb-1 pl-3 pr-2 mb-2 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50 hover:no-underline hover:text-foreground/80"
              >
                <span className="flex items-center gap-2">
                  <span>
                    <NavSectionHeadingText section={section} />
                  </span>
                  {hasDue && !open.includes(heading) && <NotificationDot />}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-1">
                <NavSectionLinks links={section.links} {...listProps} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}
    </>
  );
};
