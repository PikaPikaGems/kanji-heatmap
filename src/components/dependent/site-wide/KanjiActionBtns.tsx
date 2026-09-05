import { CopyButton } from "@/components/common/CopyButton";
import { SpeakButton } from "@/components/common/SpeakButton";
import { ShareStatusIcon } from "@/components/common/ShareStatusIcon";
import { Button } from "@/components/ui/button";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { outLinks } from "@/lib/external-links";
import ChangeFontButton from "./ChangeFontButton";
import { DotIcon } from "../../icons";
import { NextPrevLinks } from "../routing/NextPrevLinks";
import { SITE_SHARE_TEXT, useShareOrCopy } from "@/hooks/use-share-or-copy";

const kanjiPageUrl = (kanji: string) =>
  `${outLinks.site}/?${URL_PARAMS.openKanji}=${kanji}`;

const ShareKanjiButton = ({ kanji }: { kanji: string }) => {
  const { share, copied } = useShareOrCopy();
  const url = kanjiPageUrl(kanji);

  return (
    <Button
      variant={"outline"}
      size="iconXl"
      className="relative"
      aria-label={copied ? "Link copied" : "Share link"}
      onClick={(e) => {
        share({
          title: `Kanji Heatmap · ${kanji}`,
          text: SITE_SHARE_TEXT,
          url,
        });
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <ShareStatusIcon copied={copied} />
    </Button>
  );
};

export const KanjiActions = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <SpeakButton word={kanji} iconType="volume-2" autoFocus />
      <CopyButton textToCopy={kanji} iconType="clipboard" />
      <CopyButton textToCopy={kanjiPageUrl(kanji)} iconType="link" />
      <ShareKanjiButton kanji={kanji} />
    </>
  );
};
export const KanjiActionsBtns = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <div className="flex flex-wrap items-center px-4 py-3 space-x-1">
        <NextPrevLinks currentKanji={kanji} />
        <div className="border-2 rounded-lg">
          <ChangeFontButton />
        </div>
        <DotIcon className="w-3 m-0" />
        <ShareKanjiButton kanji={kanji} />
        <CopyButton textToCopy={kanjiPageUrl(kanji)} iconType="link" />
      </div>
    </>
  );
};
