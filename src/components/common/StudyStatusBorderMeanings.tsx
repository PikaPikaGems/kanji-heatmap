import { JLPTListItems } from "@/lib/jlpt";
import { JLPTListItem } from "@/components/common/jlpt/JLPTListItem";

const STUDY_STATUS_ITEMS = [
  { cn: JLPTListItems.n5.cn, color: JLPTListItems.n5.color, label: "Known" },
  { cn: "bg-foreground", color: "foreground", label: "Reviewing" },
  { cn: "bg-foreground/20", color: "muted", label: "Unmarked" },
  { cn: "bg-lime-500", color: "lime", label: "Known & Reviewing" },
];

export const StudyStatusBorderMeanings = () => {
  return (
    <>
      <ul className="flex flex-wrap my-2">
        {STUDY_STATUS_ITEMS.map((item) => (
          <JLPTListItem
            key={item.label}
            cn={`${item.cn} m-1`}
            color={item.color}
            label={item.label}
          />
        ))}
      </ul>
    </>
  );
};
