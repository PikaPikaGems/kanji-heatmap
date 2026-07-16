import { ReactNode } from "react";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { DotIcon } from "@/components/icons";
import { DebugInfo } from "@/components/common/DebugInfo";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { ModeToggle } from "@/components/dependent/site-wide/ModeToggle";

export const BottomBar = ({ includeNode }: { includeNode?: ReactNode }) => {
  return (
    <>
      <div className="my-4 w-fit">
        <PikaPikaLinks />
      </div>

      <div className="flex items-center justify-start w-full mt-4 mb-8 space-x-1">
        <LinksOutItems />
        <DotIcon className="w-2 m-0" />
        <DebugInfo />
        <RefreshPageBtn />
        <ModeToggle />
        {includeNode}
      </div>
    </>
  );
};
