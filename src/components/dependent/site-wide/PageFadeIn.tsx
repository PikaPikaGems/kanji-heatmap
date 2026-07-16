import { ReactNode } from "react";
import { useLocation } from "@/components/dependent/routing/router-adapter";

/** Remounts children on route change so `animate-fade-in` plays. */
export const PageFadeIn = ({ children }: { children: ReactNode }) => {
  const [location] = useLocation();

  return (
    <div key={location} className="animate-fade-in">
      {children}
    </div>
  );
};
