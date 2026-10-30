import { forwardRef, useSyncExternalStore } from "react";
import { Link as WouterLink, LinkProps } from "wouter";
import {
  getRememberedHref,
  SEARCH_SHARING_PAGES,
  subscribeToRememberedSearches,
} from "@/lib/home-search-memory";

// forwardRef required: DashedNavLink passes an explicit ref, and this link is
// rendered as the direct child of `asChild` elements (DrawerClose in
// HeaderDrawer, NavigationMenuLink in Nav, Button in SpeedKatakanaHeatmapGrid)
// whose Slot injects a ref into it for focus/positioning.
export const RememberedHomeLink = forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => {
    const target =
      "to" in props && props.to !== undefined ? props.to : props.href;
    const getHref = () =>
      target !== undefined && SEARCH_SHARING_PAGES.includes(target)
        ? getRememberedHref(target)
        : target;
    const href = useSyncExternalStore(
      subscribeToRememberedSearches,
      getHref,
      getHref
    );

    const resolvedProps =
      "to" in props && props.to !== undefined
        ? { ...props, to: href }
        : { ...props, href };

    if (resolvedProps.asChild) {
      return <WouterLink {...resolvedProps} />;
    }

    return <WouterLink {...resolvedProps} ref={ref} />;
  }
);
RememberedHomeLink.displayName = "RememberedHomeLink";
