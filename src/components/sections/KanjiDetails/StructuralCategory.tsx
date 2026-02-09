import { GenericPopover } from "@/components/common/GenericPopover";
import { InfoIcon } from "@/components/icons";
import { useGetKanjiInfoFn } from "@/kanji-worker/kanji-worker-hooks";
import {
  useKanjiStructure,
  StructuralType,
} from "@/providers/kanji-structure-provider";
import { Link } from "@/components/dependent/routing/router-adapter";

// Structural type information
export const structuralTypeInfo: Record<
  StructuralType,
  { name: string; japanese: string; description: string }
> = {
  shiji: {
    name: "Indicative",
    japanese: "指事",
    description:
      "A simple ideograph that represents an abstract concept through a symbolic or diagrammatic form.",
  },
  shoukei: {
    name: "Pictographic",
    japanese: "象形",
    description:
      "A character that is a stylized depiction of a physical object or natural phenomenon.",
  },
  kaii: {
    name: "Compound Ideographic",
    japanese: "会意",
    description:
      "A compound character formed by combining two or more elements to suggest a meaning.",
  },
  keisei: {
    name: "Phono-semantic",
    japanese: "形声",
    description:
      "A compound character combining a semantic component (meaning) and a phonetic component (sound).",
  },
  unknown: {
    name: "Unknown",
    japanese: "不明",
    description: "The etymological origin of this character is uncertain.",
  },
  derivative: {
    name: "Derivative",
    japanese: "転注",
    description:
      "A character whose meaning has been extended or transferred from its original meaning.",
  },
  rebus: {
    name: "Rebus",
    japanese: "仮借",
    description:
      "A character borrowed for its phonetic value to represent a word with a similar sound.",
  },
  kokuji: {
    name: "Japanese-made",
    japanese: "国字",
    description:
      "A character created in Japan, not found in classical Chinese.",
  },
  shinjitai: {
    name: "Simplified",
    japanese: "新字体",
    description:
      "A simplified form of a traditional character introduced in post-war Japan.",
  },
};

// Format the structural type name for display
const formatStructuralTypeName = (type: StructuralType): string => {
  const info = structuralTypeInfo[type];
  return `${info.name} (${info.japanese})`;
};

// Component link for semantic/phonetic parts that links to radical search
const ComponentLink = ({
  component,
  keyword,
}: {
  component: string;
  keyword?: string;
}) => {
  const searchUrl = `/?search-type=radicals&search-text=${encodeURIComponent(component)}`;
  return (
    <Link
      to={searchUrl}
      className="inline-flex flex-col items-center gap-1 text-center hover:text-[#2effff]"
    >
      {keyword && (
        <span className="inline-flex items-center px-2.5 h-7 rounded-full border border-white/40 bg-white text-black text-base">
          {keyword}
        </span>
      )}
      <span className="kanji-font inline-flex items-center justify-center min-w-7 h-7 border-white/40 text-xl">
        {component}
      </span>
    </Link>
  );
};

// Info popover explaining a specific structural type
export const StructuralTypeInfoPopover = ({
  type,
}: {
  type: StructuralType;
}) => {
  const info = structuralTypeInfo[type];
  return (
    <GenericPopover
      trigger={
        <button className="ml-1 inline-flex items-center">
          <InfoIcon className="inline-block" size={14} />
        </button>
      }
      content={
        <div className="text-xs p-3 max-w-xs">
          <span className="font-semibold">
            {info.name} ({info.japanese})
          </span>
          <p className="text-muted-foreground mt-0.5">{info.description}</p>
        </div>
      }
    />
  );
};

// Info popover explaining keisei (phono-semantic) - kept for backward compatibility
export const StructuralCategoryInfoPopover = () => {
  return <StructuralTypeInfoPopover type="keisei" />;
};

export const useHasStructuralData = (kanji: string) => {
  const { status, kanjiStructureData } = useKanjiStructure(kanji);

  if (status === "pending" || status === "idle" || !kanjiStructureData) {
    return false;
  }

  return !!kanjiStructureData.type;
};

export const useStructuralData = (kanji: string) => {
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
    semantic,
    semanticKeyword: semanticInfo?.keyword,
    phonetic,
    phoneticKeyword: phoneticInfo?.keyword,
    isKeisei: type === "keisei",
  };
};

export { ComponentLink };
