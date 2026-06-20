import { JLPTOptions } from "@/lib/jlpt";
import { JLPTListItem } from "./JLPTListItem";

export const JLPTBordersMeanings = () => {
  return (
    <>
      <ul className="flex flex-wrap my-2 w-54">
        {JLPTOptions.map((item) => {
          return (
            <JLPTListItem
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
