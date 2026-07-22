import { ComponentType, SVGProps, forwardRef } from "react";
import { Link } from "@/components/dependent/routing";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string }
>;

type DashedNavLinkProps = {
  href: string;
  title: string;
  description?: string;
  Icon?: IconComponent;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  className?: string;
  iconClassName?: string;
};

// forwardRef required: HeaderDrawer wraps this in `<DrawerClose asChild>` via
// DashedNavLinkList's `wrapItem`, which injects a ref (vaul needs the anchor
// node to close the drawer / restore focus).
export const DashedNavLink = forwardRef<HTMLAnchorElement, DashedNavLinkProps>(
  (
    {
      href,
      title,
      description,
      Icon,
      onClick,
      onPointerDown,
      className,
      iconClassName,
      ...rest
    },
    ref
  ) => {
    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        onPointerDown={onPointerDown}
        className={cn(
          "block p-3 transition-colors border border-dashed rounded-lg hover:bg-accent",
          className
        )}
        {...rest}
      >
        <div className="flex text-sm font-semibold text-left">
          {Icon && (
            <Icon
              className={cn("mr-2 mt-0.5 size-4 shrink-0", iconClassName)}
            />
          )}
          {title}
        </div>
        {description && (
          <p className="mt-1 text-xs text-left text-muted-foreground">
            {description}
          </p>
        )}
      </Link>
    );
  }
);
DashedNavLink.displayName = "DashedNavLink";
