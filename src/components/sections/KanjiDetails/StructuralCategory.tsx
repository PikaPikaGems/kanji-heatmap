import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import {
  useKanjiStructure,
} from "@/providers/kanji-structure-provider";
import { StructuralType, structuralTypeInfo } from "@/lib/kanji-section-constants";
import { GlobalKanjiLink } from "@/components/dependent/routing";
import { GlobalRadicalLink } from "@/components/dependent/routing/global-links";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";



// Format the structural type name for display
const formatStructuralTypeName = (type: StructuralType): string => {
  const info = structuralTypeInfo[type];
  return `${info.name ?? "unknown"} ${info.japanese ? `(${info.japanese})` : ""}`;
};

// Component link for semantic/phonetic parts that links to radical search
const ComponentLink = ({
  component,
  keyword,
  title,
  type
}: {
  component: string;
  keyword: string;
  title: string;
  type: 'kanji' | 'radical'
}) => {


  return (
    <div className="flex flex-col text-center w-fit">
      {type === 'kanji' ?
        <GlobalKanjiLink kanji={component} keyword={keyword} /> :
        <GlobalRadicalLink radical={component} keyword={keyword} />
      }
      <div className="text-[10px] uppercase opacity-70">{title}</div>
    </div>
  )


};

// Info popover explaining a specific structural type

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

  return {
    type,

    typeName: formatStructuralTypeName(type),
    typeDescription: structuralTypeInfo[type].description ?? 'No Description Provided',
    semantic: semantic,
    semanticKeyword: semanticInfo?.keyword,
    phonetic,
    phoneticKeyword: phoneticInfo?.keyword,
  };
};

const KanjiStructuralTypeBadge = ({ name, desc }: { name: string, desc: string }) => {
  return <Popover>
    <PopoverTrigger asChild>
      <button>
        <Badge variant="outline" className="cursor-pointer">
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

  // TODO: Add logic (put in radical.ts to get radical keyword. It might also be in component_keyword.json
  // IMPORTANT THOUGH: We actually we need a way to unify component_keyword.json and also the mapping in radical.ts, so need to think about an approach to do this  //
  // ADDITIONAL TODO: make a script that
  //  scans kanji-structure.json and gets all the semantic and phonetic components
  // find the semantic and phonetic components that doesn't exist after searching for it in the
  // following playslit
  // as a kanji
  // in moreRadicalKeywords and radicalFalseFreiwns in radical.ts
  // in component_keywords.json
  // output the list of components (these are problematc components we need to investigate)

  return (
    <div className="flex flex-col justify-center">
      <div className="flex items-center gap-4">
        <KanjiStructuralTypeBadge name={structuralData.typeName} desc={structuralData.typeDescription} />
        {structuralData.semantic ?
          <ComponentLink
            component={structuralData.semantic}
            keyword={structuralData.semanticKeyword ?? '...'}
            title="Semantic"
            type={structuralData.semanticKeyword ? "kanji" : "radical"}
          /> : null
        }
        {structuralData.phonetic ?
          <ComponentLink
            component={structuralData.phonetic}
            keyword={structuralData.phoneticKeyword ?? "..."}
            title="phonetic"
            type={structuralData.phoneticKeyword ? "kanji" : "radical"}
          /> : null
        }

      </div>
    </div>
  )
}

export { KanjiStructuralData };
