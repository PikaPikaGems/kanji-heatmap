import { Fragment, type ReactNode } from "react";
import { DashedNavLink } from "@/components/common/DashedNavLink";
import { useHomeHref } from "@/components/dependent/routing";
import type { NavLinkItem } from "@/components/items/nav-links";
import { cn } from "@/lib/utils";

type DashedNavLinkListProps = {
  items: NavLinkItem[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  onItemClick?: () => void;
  onItemPointerDown?: (e: React.PointerEvent) => void;
  wrapItem?: (link: ReactNode, item: NavLinkItem) => ReactNode;
};

export const DashedNavLinkList = ({
  items,
  className,
  itemClassName,
  iconClassName,
  onItemClick,
  onItemPointerDown,
  wrapItem,
}: DashedNavLinkListProps) => {
  const homeHref = useHomeHref();

  return (
    <div className={cn(className)}>
      {items.map((item) => {
        const href = item.href === "/" ? homeHref : item.href;
        const link = (
          <DashedNavLink
            href={href}
            title={item.title}
            description={item.description}
            Icon={item.Icon}
            onClick={onItemClick}
            onPointerDown={onItemPointerDown}
            className={itemClassName}
            iconClassName={iconClassName}
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
