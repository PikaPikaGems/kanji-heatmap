import { JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import { Badge } from "@/components/ui/badge";
import { GenericPopover } from "../GenericPopover";
import { ExternalTextLink } from "../ExternalTextLink";

export const JLPTBadge = ({ jlpt }: { jlpt: JLTPTtypes }) => {
  return (
    <>
      {jlpt !== "none" && (
        <GenericPopover
          trigger={
            <button className="p-0 m-0 hover:bg-[#2effff] rounded-full group">
              <Badge className="px-3 py-1 text-nowrap group-hover:text-black" variant={"outline"}>
                <span
                  className={`h-3 w-3 block ${JLPTListItems[jlpt].cn} !rounded-full group-hover:text-black mr-1`}
                />
                {jlpt.toUpperCase()}
              </Badge>
            </button>
          }
          content={
            <div className="w-64 px-4 py-3 text-xs">
              The <strong>Japanese‑Language Proficiency Test</strong>
              <ExternalTextLink href="https://jlpt.jp" text="(jlpt.jp)" />{" "}
              certifies non‑native speakers’ Japanese skills across five levels.{" "}
              <em>(N5 easiest → N1 hardest)</em>
            </div>
          }
        />
      )}
    </>
  );
};
