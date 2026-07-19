import { ReactNode, useLayoutEffect } from "react";
import { useLocation } from "@/components/dependent/routing/router-adapter";

/** Remounts children on route change so `animate-fade-in` plays. */
export const PageFadeIn = ({ children }: { children: ReactNode }) => {
  const [location] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);

    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = 0;
    }
    document.body.scrollTop = 0;
  }, [location]);

  return (
    <div key={location} className="animate-fade-in">
      {children}
    </div>
  );
};
