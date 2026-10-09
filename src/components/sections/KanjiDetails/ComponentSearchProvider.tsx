import { ReactNode } from "react";
import { useSphmnDrawer } from "@/kanji-worker/kanji-worker-hooks";
import { ComponentSearchContext } from "./ComponentSearchContext";

export const ComponentSearchProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { data } = useSphmnDrawer();
  return (
    <ComponentSearchContext.Provider value={data}>
      {children}
    </ComponentSearchContext.Provider>
  );
};
