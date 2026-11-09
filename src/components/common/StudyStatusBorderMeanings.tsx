import { JLPTListItems } from "@/lib/jlpt";
import { SquareListItem } from "@/components/common/SquareListItem";
import { UserNotice } from "@/components/common/UserNotice";
import { UPDATE_BROWSER_COPY } from "@/lib/engine/engine-copy";
import { useAccountStatus } from "@/lib/engine/use-account-status";

const STUDY_STATUS_ITEMS = [
  {
    cn: JLPTListItems.n5.cn,
    color: JLPTListItems.n5.color,
    label: "Bookmarked",
  },
  { cn: "bg-foreground", color: "foreground", label: "Reviewing" },
  { cn: "bg-lime-500", color: "lime", label: "Bookmarked & Reviewing" },
  { cn: "bg-foreground/20", color: "muted", label: "No Status" },
];

export const StudyStatusBorderMeanings = () => {
  const status = useAccountStatus();

  return (
    <>
      <ul className="flex flex-wrap my-2">
        {STUDY_STATUS_ITEMS.map((item) => (
          <SquareListItem
            key={item.label}
            cn={`${item.cn} m-1 pr-2`}
            color={item.color}
            label={item.label}
          />
        ))}
      </ul>
      {status.kind === "unavailable" && (
        <UserNotice>{UPDATE_BROWSER_COPY}</UserNotice>
      )}
    </>
  );
};
