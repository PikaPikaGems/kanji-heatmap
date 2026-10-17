import { Fragment, type ReactNode } from "react";
import { DashedNavLink } from "@/components/common/DashedNavLink";
import type { NavLinkItem, NavLinkSection } from "@/lib/pages/nav-links";
import { cn } from "@/lib/utils";

type DashedNavLinkSectionsProps = {
  sections: NavLinkSection[];
  /** Layout of the links inside each section. */
  listClassName?: string;
  onItemClick?: () => void;
  onItemPointerDown?: (e: React.PointerEvent) => void;
  /** Hrefs that show the due dot. */
  dotHrefs?: ReadonlySet<string>;
  wrapItem?: (link: ReactNode, item: NavLinkItem) => ReactNode;
};

/**
 * Menu links grouped into sections, each under a small heading styled like
 * the sub-headings of the kanji drawer's Character Structure.
 */
export const DashedNavLinkSections = ({
  sections,
  listClassName,
  onItemClick,
  onItemPointerDown,
  dotHrefs,
  wrapItem,
}: DashedNavLinkSectionsProps) => {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading ?? "top"}>
          {section.heading && (
            <h3 className="pt-3 pb-1 pl-3 mb-2 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">
              {section.heading}
              {section.starred && <span aria-hidden> ⭐️</span>}
            </h3>
          )}
          <div className={cn(listClassName)}>
            {section.links.map((item) => {
              const link = (
                <DashedNavLink
                  href={item.href}
                  title={item.title}
                  description={item.description}
                  Icon={item.Icon}
                  onClick={onItemClick}
                  onPointerDown={onItemPointerDown}
                  showDot={dotHrefs?.has(item.href)}
                />
              );

              return (
                <Fragment key={item.href}>
                  {wrapItem ? wrapItem(link, item) : link}
                </Fragment>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
};
