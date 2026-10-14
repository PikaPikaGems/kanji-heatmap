import { Fragment, type ReactNode } from "react";
import { DashedNavLink } from "@/components/common/DashedNavLink";
import type { NavLinkItem } from "@/lib/pages/nav-links";
import { cn } from "@/lib/utils";

type DashedNavLinkListProps = {
  items: NavLinkItem[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  onItemClick?: () => void;
  onItemPointerDown?: (e: React.PointerEvent) => void;
  /** Hrefs that show the due dot. */
  dotHrefs?: ReadonlySet<string>;
  wrapItem?: (link: ReactNode, item: NavLinkItem) => ReactNode;
};

export const DashedNavLinkList = ({
  items,
  className,
  itemClassName,
  iconClassName,
  onItemClick,
  onItemPointerDown,
  dotHrefs,
  wrapItem,
}: DashedNavLinkListProps) => {
  return (
    <div className={cn(className)}>
      {items.map((item) => {
        const link = (
          <DashedNavLink
            href={item.href}
            title={item.title}
            description={item.description}
            Icon={item.Icon}
            onClick={onItemClick}
            onPointerDown={onItemPointerDown}
            className={itemClassName}
            iconClassName={iconClassName}
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
};
