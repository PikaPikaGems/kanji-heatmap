import { ExternalTextLink } from "@/components/common/ExternalTextLink";
import { outLinks } from "@/lib/external-links";

/** Reusable disclaimer for the community-maintained WK/RTK/KKLC orderings, linking to the GitHub issue for improvement suggestions. */
export const OrderDisclaimer = () => (
  <>
    ⚠️ WK, RTK, and KKLC orders are community-maintained and may differ from the
    official editions.{" "}
    <ExternalTextLink
      href={outLinks.githubIssue}
      text="Suggest an improvement."
    />
  </>
);
