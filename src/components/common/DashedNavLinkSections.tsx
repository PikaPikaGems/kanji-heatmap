import { Fragment, type ReactNode } from "react";
import { DashedNavLink } from "@/components/common/DashedNavLink";
import type { NavLinkItem, NavLinkSection } from "@/lib/pages/nav-links";
import { cn } from "@/lib/utils";

export type NavLinkListProps = {
  /** Layout of the links inside each section. */
  listClassName?: string;
  onItemClick?: () => void;
  onItemPointerDown?: (e: React.PointerEvent) => void;
  /** Hrefs that show the due dot. */
  dotHrefs?: ReadonlySet<string>;
  wrapItem?: (link: ReactNode, item: NavLinkItem) => ReactNode;
  /** Titles only, no subtitles (the sidebar menu still has them). */
  hideDescriptions?: boolean;
};

/** A section heading's text, with its ⭐️ when starred. */
export const NavSectionHeadingText = ({
  section,
}: {
  section: NavLinkSection;
}) => (
  <>
    {section.heading}
    {/* Full opacity: the heading's faded color would dim the emoji. */}
    {section.starred && (
      <span aria-hidden className="text-foreground">
        {" "}
        ⭐️
      </span>
    )}
  </>
);

/** One section's links. */
export const NavSectionLinks = ({
  links,
  listClassName,
  onItemClick,
  onItemPointerDown,
  dotHrefs,
  wrapItem,
  hideDescriptions,
}: NavLinkListProps & { links: NavLinkItem[] }) => (
  <div className={cn(listClassName)}>
    {links.map((item) => {
      const link = (
        <DashedNavLink
          href={item.href}
          title={item.title}
          aria-label={item.ariaLabel}
          description={hideDescriptions ? undefined : item.description}
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
);

/**
 * Menu links grouped into sections, each under a small heading styled like
 * the sub-headings of the kanji drawer's Character Structure.
 */
export const DashedNavLinkSections = ({
  sections,
  ...listProps
}: NavLinkListProps & { sections: NavLinkSection[] }) => (
  <>
    {sections.map((section) => (
      <section key={section.heading ?? "top"}>
        {section.heading && (
          <h3 className="pt-3 pb-1 pl-3 mb-2 text-sm font-bold text-left uppercase border-b border-dashed text-foreground/50">
            <NavSectionHeadingText section={section} />
          </h3>
        )}
        <NavSectionLinks links={section.links} {...listProps} />
      </section>
    ))}
  </>
);
