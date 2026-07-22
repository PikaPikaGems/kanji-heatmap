import { ComponentLink } from "@/components/dependent/routing/global-links";
import { useResolvedComponent } from "./use-resolved-component";

export const PartComponentLink = ({ part }: { part: string }) => {
  const props = useResolvedComponent(part);

  if (!props) {
    return null;
  }

  return <ComponentLink {...props} />;
};
