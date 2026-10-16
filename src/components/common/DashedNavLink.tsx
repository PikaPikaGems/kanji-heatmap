import { ComponentType, SVGProps, forwardRef } from "react";
import { Link } from "@/components/dependent/routing";
import { NotificationDot } from "@/components/common/NotificationDot";
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
  /** Appends a ⭐️ after the title. */
  starred?: boolean;
  /** Shows the due dot right after the title. */
  showDot?: boolean;
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
      starred,
      showDot,
      ...rest
    },
    ref
  ) => {
    const lastWordStart = title.lastIndexOf(" ") + 1;

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
          {Icon && <Icon className="mt-0.5 mr-2 size-4 shrink-0" />}
          {/* Star and dot stay glued to the title's last word when it wraps. */}
          <span>
            {title.slice(0, lastWordStart)}
            <span className="whitespace-nowrap">
              {title.slice(lastWordStart)}
              {starred && <span aria-hidden> ⭐️</span>}
              {showDot && (
                <NotificationDot className="inline-block ml-2 align-middle" />
              )}
            </span>
          </span>
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
