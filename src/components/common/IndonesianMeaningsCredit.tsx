import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { otherOutLinks } from "@/lib/external-links";

/** Credit for the user-submitted Indonesian meanings. */
export const IndonesianMeaningsCredit = () => (
  <>
    Contributed by{" "}
    <ExternalTextLink
      href={otherOutLinks.indonesianMeaningsContributor}
      text="ditog37"
    />
  </>
);
