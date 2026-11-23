import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { otherOutLinks } from "@/lib/external-links";

/** Credit for the user-submitted Indonesian kanji meanings and word glosses. */
export const IndonesianMeaningsCredit = () => (
  <>
    Contributed by{" "}
    <ExternalTextLink
      href={otherOutLinks.indonesianMeaningsContributor}
      text="ditog37"
    />
  </>
);
