import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import {
  useKanjiStructure,
} from "@/providers/kanji-structure-provider";
import { StructuralType, structuralTypeInfo } from "@/lib/kanji-section-constants";
import { GlobalKanjiLink } from "@/components/dependent/routing";
import { FakeComponentLink, GlobalRadicalLink } from "@/components/dependent/routing/global-links";
import { moreRadicalKeywords, radicalFalseFriends } from "@/lib/radicals";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";



const formatStructuralTypeName = (type: StructuralType): string => {
  const info = structuralTypeInfo[type];
  return `${info.name ?? "unknown"} ${info.japanese ? `(${info.japanese})` : ""}`;
};

const ComponentLink = ({
  component,
  keyword,
  title,
  type
}: {
  component: string;
  keyword: string;
  title: string;
  type: 'kanji' | 'radical' | 'unknown'
}) => {


  return (
    <div className="flex flex-col text-center w-fit">
      {type === 'kanji' ?
        <GlobalKanjiLink kanji={component} keyword={keyword} /> : type === "radical" ?
          <GlobalRadicalLink radical={component} keyword={keyword} /> : <FakeComponentLink radical={component} />
      }
      <div className="text-[10px] uppercase opacity-70">{title}</div>
    </div>
  )


};

// Info popover explaining a specific structural type

const getRadicalKeyword = (component: string): string | undefined => {
  if (moreRadicalKeywords[component]) return moreRadicalKeywords[component];
  const canonical = radicalFalseFriends[component]?.trim();
  if (canonical && moreRadicalKeywords[canonical]) return moreRadicalKeywords[canonical];
  return undefined;
};

const useStructuralData = (kanji: string) => {
  const { status, kanjiStructureData } = useKanjiStructure(kanji);
  const getKanjiInfo = useGetKanjiInfoFn();

  if (status === "pending" || status === "idle") {
    return null;
  }

  if (!kanjiStructureData || !kanjiStructureData.type) {
    return null;
  }

  const { type, semantic, phonetic } = kanjiStructureData;
  const semanticInfo = semantic ? getKanjiInfo?.(semantic) : null;
  const phoneticInfo = phonetic ? getKanjiInfo?.(phonetic) : null;
  const isFullKanji = (info: typeof semanticInfo) => !!info && "on" in info;

  return {
    type,
    typeName: formatStructuralTypeName(type),
    typeDescription: structuralTypeInfo[type].description ?? 'No Description Provided',
    semantic,
    semanticKeyword: semanticInfo?.keyword ?? (semantic ? getRadicalKeyword(semantic) : undefined),
    semanticIsKanji: isFullKanji(semanticInfo),
    phonetic,
    phoneticKeyword: phoneticInfo?.keyword ?? (phonetic ? getRadicalKeyword(phonetic) : undefined),
    phoneticIsKanji: isFullKanji(phoneticInfo),
  };
};

const KanjiStructuralTypeBadge = ({ name, desc }: { name: string, desc: string }) => {
  return <Popover>
    <PopoverTrigger asChild>
      <button>
        <Badge variant="outline" className="cursor-pointer hover:bg-[#2effff] hover:text-black">
          {name}
        </Badge>
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-64 text-xs">
      {desc}
    </PopoverContent>
  </Popover>
}

const KanjiStructuralData = ({ kanji }: { kanji: string }) => {
  const structuralData = useStructuralData(kanji);


  if (structuralData == null) {
    return "..."
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 w-fit">
      {structuralData.semantic ?
        <ComponentLink
          component={structuralData.semantic}
          keyword={structuralData.semanticKeyword ?? '...'}
          title="Semantic"
          type={structuralData.semanticIsKanji ? "kanji" : structuralData.semanticKeyword ? "radical" : "unknown"}
        /> : null
      }
      {structuralData.phonetic ?
        <ComponentLink
          component={structuralData.phonetic}
          keyword={structuralData.phoneticKeyword ?? "..."}
          title="phonetic"
          type={structuralData.phoneticIsKanji ? "kanji" : structuralData.phoneticKeyword ? "radical" : "unknown"}
        /> : null
      }
      <KanjiStructuralTypeBadge name={structuralData.typeName} desc={structuralData.typeDescription} />
    </div>
  )
}

export { KanjiStructuralData };
