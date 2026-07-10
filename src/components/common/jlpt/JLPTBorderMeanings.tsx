import { JLPTOptions } from "@/lib/jlpt";
import { SquareListItem } from "../SquareListItem";

export const JLPTBordersMeanings = () => {
  return (
    <>
      <ul className="flex flex-wrap my-2 w-54">
        {JLPTOptions.map((item) => {
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
