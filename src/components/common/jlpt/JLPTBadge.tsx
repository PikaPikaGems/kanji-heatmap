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
            <button className="m-0 p-0">
              <Badge className="text-nowrap py-1 px-3" variant={"outline"}>
                <span
                  className={`h-3 w-3 block ${JLPTListItems[jlpt].cn} !rounded-full mr-1`}
                />
                {jlpt.toUpperCase()}
              </Badge>
            </button>
          }
          content={
            <div className="px-4 py-3 w-64 text-xs">
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
