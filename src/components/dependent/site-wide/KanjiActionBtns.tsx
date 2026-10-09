import type { ReactNode } from "react";
import { CopyButton } from "@/components/common/CopyButton";
import { SpeakButton } from "@/components/common/SpeakButton";
import { ShareStatusIcon } from "@/components/common/ShareStatusIcon";
import { Button } from "@/components/ui/button";
import { URL_PARAMS } from "@/lib/settings/url-params";
import { outLinks } from "@/lib/external-links";
import ChangeFontButton from "./ChangeFontButton";
import { DotIcon, Flower } from "../../icons";
import { Layers } from "lucide-react";
import { NextPrevLinks } from "../routing/NextPrevLinks";
import { Link } from "../routing/router-adapter";
import { componentSearchHref, radicalSearchHref } from "@/lib/search-hrefs";
import { useRadicals } from "@/kanji-worker/kanji-worker-hooks";
import { isKnownRadical, resolveRadicalForSearch } from "@/lib/radicals";
import { useComponentSearchEntry } from "@/components/sections/KanjiDetails/use-component-search-entry";
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

const SearchLinkButton = ({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) => (
  <Button variant={"outline"} size="iconXl" asChild>
    <Link to={to} title={label} aria-label={label}>
      {icon}
    </Link>
  </Button>
);

/** Only when the kanji is in the radical search drawer. */
const RadicalSearchButton = ({ kanji }: { kanji: string }) => {
  const radicals = useRadicals();
  if (!isKnownRadical(kanji, radicals)) return null;
  const searchText = resolveRadicalForSearch(kanji, radicals);
  return (
    <SearchLinkButton
      to={radicalSearchHref(searchText)}
      label={`Search kanji by radical ${searchText}`}
      icon={<Flower />}
    />
  );
};

/** Only when the kanji is in the component search drawer. */
const ComponentSearchButton = ({ kanji }: { kanji: string }) => {
  const entry = useComponentSearchEntry(kanji);
  if (entry == null) return null;
  return (
    <SearchLinkButton
      to={componentSearchHref(kanji)}
      label={`Search kanji by component ${kanji}`}
      icon={<Layers />}
    />
  );
};

export const KanjiActions = ({ kanji }: { kanji: string }) => {
  return (
    <>
      <SpeakButton word={kanji} iconType="volume-2" />
      <CopyButton textToCopy={kanji} iconType="clipboard" />
      <CopyButton textToCopy={kanjiPageUrl(kanji)} iconType="link" />
      <ShareKanjiButton kanji={kanji} />
      <RadicalSearchButton kanji={kanji} />
      <ComponentSearchButton kanji={kanji} />
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
