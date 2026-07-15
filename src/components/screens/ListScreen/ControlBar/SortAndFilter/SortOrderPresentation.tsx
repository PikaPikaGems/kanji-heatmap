import { ReactNode } from "react";
import { SortKey } from "@/lib/options/options-types";

import { ArrowDownWideNarrow } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

import { UppercaseHeading } from "@/components/common/UpperCaseHeading";
import { SORT_OPTION_LABELS } from "@/lib/options/options-label-maps";

export const SortAdditionalInfo = ({
  val1,
  val2,
}: {
  val1?: SortKey;
  val2?: SortKey;
}) => {
  const v1 = val1 && val1 !== "none" ? SORT_OPTION_LABELS[val1] : null;
  const v2 = val2 && v1 && val2 !== "none" ? SORT_OPTION_LABELS[val2] : null;

  if (!v1 || !v2) {
    return null;
  }

  return (
    <div className="flex animate-fade-in">
      <div className="m-2">Order By</div> <Badge>{v1}</Badge>
      <div className="m-2">Then By</div>
      <Badge>{v2} </Badge>
    </div>
  );
};

export const SortOrderSectionLayout = ({
  primaryField,
  secondaryField,
  additionalInfo,
}: {
  primaryField: ReactNode;
  secondaryField?: ReactNode;
  additionalInfo: ReactNode;
}) => {
  return (
    <section className="flex flex-col">
      <UppercaseHeading
        title="Sort Order"
        icon={<ArrowDownWideNarrow size={15} />}
      />
      <section className="flex flex-col w-full space-x-0 space-y-2 text-left md:space-y-0 md:flex-row md:space-x-2">
        <div className="md:w-1/2">{primaryField}</div>
        {secondaryField && <div className="md:w-1/2">{secondaryField}</div>}
      </section>
      <div className="flex flex-wrap items-center justify-start mt-3 text-xs">
        {additionalInfo}
      </div>
    </section>
  );
};
