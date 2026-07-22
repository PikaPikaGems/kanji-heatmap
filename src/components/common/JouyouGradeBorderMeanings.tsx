import { JouyouGradeOptions } from "@/lib/jouyou-grade";
import { SquareListItem } from "@/components/common/SquareListItem";

export const JouyouGradeBordersMeanings = () => {
  return (
    <>
      <ul className="flex flex-wrap my-2 w-54">
        {JouyouGradeOptions.map((item) => {
          return (
            <SquareListItem
              key={item.value}
              cn={`${item.cn} m-1`}
              color={item.color}
              label={item.label}
            />
          );
        })}
      </ul>
    </>
  );
};
