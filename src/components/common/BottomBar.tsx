import { ReactNode } from "react";
import { LinksOutItems } from "@/components/common/LinksOutItems";
import { PikaPikaLinks } from "@/components/common/PikaPikaLinks";
import { DotIcon } from "@/components/icons";
import { DebugInfo } from "@/components/common/DebugInfo";
import { RefreshPageBtn } from "@/components/common/RefreshPageBtn";
import { SettingsModal } from "@/components/dependent/site-wide/SettingsModal";
import { InstallAppModal } from "@/components/common/InstallAppModal";

export const BottomBar = ({
  includeNode,
  justify = "start",
}: {
  includeNode?: ReactNode;
  justify?: "start" | "center";
}) => {
  return (
    <>
      <div className={`my-4 w-fit ${justify === "center" ? "mx-auto" : ""}`}>
        <PikaPikaLinks />
      </div>

      <div
        className={`flex flex-wrap items-center gap-x-1 justify-${justify} w-full mt-4 mb-8`}
      >
        <LinksOutItems />
        <DotIcon className="w-2 m-0" />
        <RefreshPageBtn />
        <DebugInfo />
        <SettingsModal />
        {includeNode}
      </div>

      <div className="flex w-full mb-8 justify-left">
        <InstallAppModal />
      </div>
    </>
  );
};
