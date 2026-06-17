import { JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import { GenericPopover } from "../GenericPopover";
import { ExternalTextLink } from "../ExternalTextLink";

export const JLPTBadge = ({ jlpt }: { jlpt: JLTPTtypes }) => {
  return (
    <>
      {jlpt !== "none" && (
        <GenericPopover
          trigger={
            <button className="inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-semibold text-nowrap m-1 bg-foreground text-background hover:bg-[#2effff] hover:text-black">
              <span
                className={`h-2 w-2 block ${JLPTListItems[jlpt].cn} !rounded-full mr-1`}
              />
              {jlpt.toUpperCase()}
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
