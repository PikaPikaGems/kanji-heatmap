import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";

import { useMultiKanjiStructure } from "@/providers/multiple-kanji-structure-provider";
import { StructuralType, structuralTypeInfo, structuralTypeInfoB } from "@/lib/kanji-section-constants";
import { GlobalKanjiLink } from "@/components/dependent/routing";
import { FakeComponentLink, GlobalRadicalLink } from "@/components/dependent/routing/global-links";
import { moreRadicalKeywords, nonRadicalVariantKeywords, radicalFalseFriends } from "@/lib/radicals";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ReactNode } from "react";



const formatStructuralTypeName = (type: StructuralType): string => {
  const info = structuralTypeInfo[type];
  return `${info.name ?? "unknown"}`;
};

const ComponentLink = ({
  component,
  keyword,
  title,
  type
}: {
  component: string;
  keyword: string;
  title?: string;
  type: 'kanji' | 'radical' | 'unknown'
}) => {

  return (
    <div className="flex flex-col text-center w-fit">
      {type === 'kanji' ?
        <GlobalKanjiLink kanji={component} keyword={keyword} /> : type === "radical" ?
          <GlobalRadicalLink radical={component} keyword={keyword} /> : <FakeComponentLink radical={component} keyword={keyword} />
      }
      {title && <div className="text-[10px] uppercase opacity-70">{title}</div>}
    </div>
  )


};

const Wrapper = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-wrap items-center gap-4 justify-left w-fit">{children}</div>
}

const NoInfo = () => { return <span className="text-[10px] uppercase">Not available</span>; }

const getRadicalKeyword = (component: string): string | undefined => {
  if (moreRadicalKeywords[component]) return moreRadicalKeywords[component];
  const canonical = radicalFalseFriends[component]?.trim();
  if (canonical && moreRadicalKeywords[canonical]) return moreRadicalKeywords[canonical];
  return undefined;
};


const KanjiStructuralTypeBadge = ({ name, desc }: { name: string, desc?: string }) => {
  if (desc == null) {
    return (
      <Badge variant="outline" className="cursor-not-allowed">
        {name}
      </Badge>
    )
  }
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


// --- Helper to resolve component type and keyword ---


const useResolvedComponent = (component: string | null | undefined) => {
  const getKanjiInfo = useGetKanjiInfoFn();
  if (!component) return null;
  const info = getKanjiInfo?.(component ?? radicalFalseFriends[component]) ?? null;
  const isKanji = !!info && "on" in info;
  const keyword = info?.keyword ?? getRadicalKeyword(component);
  const nonRadicalKeyword = nonRadicalVariantKeywords[component] ?? "..."
  return {
    component,
    keyword: keyword ?? nonRadicalKeyword ?? "...",
    type: (isKanji ? "kanji" : keyword ? "radical" : "unknown") as "kanji" | "radical" | "unknown",
  };
};

const PartComponentLink = ({ part }: { part: string }) => {
  const props = useResolvedComponent(part)

  if (!props) {
    return null
  }

  return (
    <ComponentLink {...props} />
  );
}


// --- TASK 2A: Lorenzi (same pattern as KanjiStructuralData, uses multi provider) ---
const KanjiStructuralDataLorenzi = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const hlorenzi = kanjiStructureData?.hlorenzi;
  const semanticResolved = useResolvedComponent(hlorenzi?.semantic);
  const phoneticResolved = useResolvedComponent(hlorenzi?.phonetic);

  if (status === "pending" || status === "idle") return "...";

  return (
    <Wrapper>
      {semanticResolved && (
        <ComponentLink {...semanticResolved} title="Semantic" />
      )}
      {phoneticResolved && (
        <ComponentLink {...phoneticResolved} title="Phonetic" />
      )}
      {hlorenzi?.type &&
        <KanjiStructuralTypeBadge
          name={formatStructuralTypeName(hlorenzi.type) ?? hlorenzi.type}
          desc={structuralTypeInfo[hlorenzi.type]?.description}
        />
      }
    </Wrapper>
  );
};

const KanjiStructuralDataKanjium = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const kanjium = kanjiStructureData?.kanjium;

  // kanjium tuple: [semantic, radicalVariant, phonetic, idsStructure, structureType]
  const semantic = kanjium?.[0] ?? null;
  const radicalVariant = kanjium?.[1] ?? null;
  const phonetic = kanjium?.[2] ?? null;
  const idsStructure = kanjium?.[3] ?? null;
  const structureType = kanjium?.[4] ?? null;

  const semanticResolved = useResolvedComponent(semantic);
  const variantResolved = useResolvedComponent(radicalVariant);
  const phoneticResolved = useResolvedComponent(phonetic);

  if (status === "pending" || status === "idle") return "...";
  if (!kanjium) return <NoInfo />;

  const typeInfo = structureType
    ? structuralTypeInfoB[structureType as keyof typeof structuralTypeInfoB]
    : null;

  return (
    <Wrapper>
      {semanticResolved && (
        <ComponentLink {...semanticResolved} title="Radical" />
      )}
      {variantResolved && (
        <ComponentLink {...variantResolved} title="Radical Variant" />
      )}
      {phoneticResolved && (
        <ComponentLink {...phoneticResolved} title="Phonetic" />
      )}
      {idsStructure && (
        <ComponentLink component={idsStructure} title="Structure" keyword="..." type="unknown" />
      )}
      {structureType &&
        (<KanjiStructuralTypeBadge name={typeInfo?.name ?? structureType} desc={typeInfo?.description} />
        )}

    </Wrapper>
  );
};



const KanjiStructuralDataYagays = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const yagays = kanjiStructureData?.yagays;

  if (status === "pending" || status === "idle") return "...";
  if (!yagays || yagays.length === 0) return <NoInfo />;

  return (
    <Wrapper>
      {[...new Set(yagays)].map((part) => {
        return <PartComponentLink part={part} key={part} />
      })}
    </Wrapper>
  );
};

const KanjiStructuralDataScott = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const scott = kanjiStructureData?.scott;


  if (status === "pending" || status === "idle") return "...";
  if (!scott || scott.length === 0) return <NoInfo />;

  return (
    <Wrapper>
      {[...new Set(scott)].map((part) => {
        return <PartComponentLink part={part} key={part} />
      })}
    </Wrapper>
  );
};

export {
  KanjiStructuralDataLorenzi,
  KanjiStructuralDataKanjium,
  KanjiStructuralDataYagays,
  KanjiStructuralDataScott,
};
