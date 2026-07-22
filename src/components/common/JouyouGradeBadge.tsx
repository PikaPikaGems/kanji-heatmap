import { JouyouGradeListItems, toJouyouGrade } from "@/lib/jouyou-grade";
import { GenericPopover } from "./GenericPopover";

export const JouyouGradeBadge = ({ jouyouGrade }: { jouyouGrade: number }) => {
  const grade = toJouyouGrade(jouyouGrade);
  const meta = JouyouGradeListItems[grade];

  return (
    <GenericPopover
      trigger={
        <button className="inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-semibold text-nowrap m-1 bg-foreground text-background hover:bg-[#2effff] hover:text-black">
          <span className={`h-2 w-2 block ${meta.cn} !rounded-full mr-1`} />
          Grade {meta.label}
        </button>
      }
      content={
        <div className="w-64 px-4 py-3 text-xs">
          The Japanese school grade level where this kanji is officially
          introduced in the Jouyou curriculum.
        </div>
      }
    />
  );
};
