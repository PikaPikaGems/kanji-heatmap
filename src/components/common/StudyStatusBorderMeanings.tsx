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
      <h3 className="mt-4 mb-1 text-xs font-extrabold"> Study Status </h3>
      <ul className="flex flex-wrap mb-2">
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
