import { GenericPopover } from "@/components/common/GenericPopover";

import { SpeakButton } from "@/components/common/SpeakButton";
import { CopyButton } from "@/components/common/CopyButton";
import { ReactNode } from "react";
import { InfoIcon } from "../icons";

const IconMeanings = ({ btn, text }: { btn: ReactNode; text: string }) => {
  return (
    <>
      <div className="flex items-center w-full justify-left">
        {btn}
        <span className="ml-2">{text}</span>
      </div>
    </>
  );
};

export const VocabActions = ({
  word,
  kana,
}: {
  word: string;
  kana: string;
}) => {
  return (
    <div className="relative flex flex-wrap items-center justify-center p-2 space-x-1">
      <CopyButton textToCopy={word} iconType={"clipboard"} />
      <SpeakButton word={word} iconType="volume-2" />
      {kana.length > 0 && <SpeakButton word={kana} iconType={"audio-lines"} />
      }
      <GenericPopover
        trigger={
          <InfoIcon className="absolute inline-block top-2 right-2" size={18} />
        }
        content={
          <div className="flex flex-col w-full p-2 space-y-1 text-xs">
            {kana.length ?
              <IconMeanings
                btn={<CopyButton textToCopy={kana} iconType={"copy"} />}
                text={"Copy Kana"}
              /> : ""
            }
            <IconMeanings
              btn={<CopyButton textToCopy={word} iconType={"clipboard"} />}
              text={"Copy Word"}
            />
            <IconMeanings
              btn={<SpeakButton word={kana} iconType={"audio-lines"} />}
              text={"Listen to Kana reading"}
            />
            <IconMeanings
              btn={<SpeakButton word={word} iconType="volume-2" />}
              text={"Listen to default reading"}
            />
          </div>
        }
      />
    </div>
  );
};
