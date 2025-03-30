import { CopyButton } from "@/components/common/CopyButton";
import { SpeakButton } from "@/components/common/SpeakButton";
import { URL_PARAMS } from "@/lib/settings/url-params";
import ChangeFontButton from "./ChangeFontButton";
import { DotIcon } from "../../icons";
import { NextPrevLinks } from "../routing/NextPrevLinks";

export const KanjiActionsBtns = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <div className="flex space-x-1 items-center py-2">
        <CopyButton
          textToCopy={`https://kanjiheatmap.com/?${URL_PARAMS.openKanji}=${kanji}`}
          iconType="link"
        />
        <CopyButton textToCopy={kanji} iconType="clipboard" />
        <SpeakButton word={kanji} iconType="volume-2" />
        <div className="border-2 rounded-lg">
          <ChangeFontButton />
        </div>
        <DotIcon className="w-3 m-0" />
        <NextPrevLinks currentKanji={kanji} />
      </div>
    </>
  );
};
