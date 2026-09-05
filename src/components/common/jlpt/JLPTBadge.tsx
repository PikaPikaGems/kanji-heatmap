import { JLPTListItems, JLTPTtypes } from "@/lib/jlpt";
import { GenericPopover } from "../GenericPopover";
import { ExternalTextLink } from "../ExternalTextLink";
import { DottedSeparator } from "@/components/ui/dotted-separator";
import { otherOutLinks } from "@/lib/external-links";

export const JLPTBadge = ({ jlpt }: { jlpt: JLTPTtypes }) => {
  return (
    <>
      {jlpt !== "none" && (
        <GenericPopover
          trigger={
            <button className="inline-flex h-6 items-center justify-center rounded-full border px-2.5 text-xs font-semibold text-nowrap m-1 bg-foreground text-background hover:bg-neon-accent hover:text-black">
              <span
                className={`h-2 w-2 block ${JLPTListItems[jlpt].cn} !rounded-full mr-1`}
              />
              {jlpt.toUpperCase()}
            </button>
          }
          content={
            <div className="w-64 px-4 py-3 text-xs">
              <p>
                The <strong>Japanese‑Language Proficiency Test</strong>
                <ExternalTextLink
                  href={otherOutLinks.jlpt}
                  text="(jlpt.jp)"
                />{" "}
                certifies non‑native speakers’ Japanese skills across five
                levels. <em>(N5 easiest → N1 hardest)</em>
              </p>
              <DottedSeparator className="my-2" />
              <p className="text-muted-foreground">
                Level labels from{" "}
                <ExternalTextLink
                  href={otherOutLinks.wallerJlpt}
                  text="Jonathan Waller’s JLPT resources"
                  className="whitespace-normal"
                />
                .
              </p>
            </div>
          }
        />
      )}
    </>
  );
};
