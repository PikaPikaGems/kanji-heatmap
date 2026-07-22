import { useMultiKanjiStructure } from "@/providers/multiple-kanji-structure-hooks";
import {
  StructuralType,
  structuralTypeInfo,
  structuralTypeInfoB,
} from "@/lib/kanji-section-constants";

import { ComponentLink } from "@/components/dependent/routing/global-links";
import { ReactNode } from "react";
import { BadgeWithPopover } from "@/components/common/BadgeWithPopover";
import {
  Pointer,
  ImageIcon,
  Layers,
  AudioWaveform,
  CircleHelp,
  GitBranch,
  Mic,
  Sparkles,
  Minimize2,
  Lightbulb,
} from "lucide-react";
import { PartComponentLink } from "./PartComponentLink";
import { useResolvedComponent } from "./use-resolved-component";

const ICON_SIZE = 15;

const structuralTypeIcons: Record<StructuralType, ReactNode> = {
  shiji: <Pointer size={ICON_SIZE} />,
  shoukei: <ImageIcon size={ICON_SIZE} />,
  kaii: <Layers size={ICON_SIZE} />,
  keisei: <AudioWaveform size={ICON_SIZE} />,
  unknown: <CircleHelp size={ICON_SIZE} />,
  derivative: <GitBranch size={ICON_SIZE} />,
  rebus: <Mic size={ICON_SIZE} />,
  kokuji: <Sparkles size={ICON_SIZE} />,
  shinjitai: <Minimize2 size={ICON_SIZE} />,
};

const structuralTypeIconsB: Record<
  keyof typeof structuralTypeInfoB,
  ReactNode
> = {
  "Compound ideograph": <Layers size={ICON_SIZE} />,
  "Phono-semantic compound": <AudioWaveform size={ICON_SIZE} />,
  Pictograph: <ImageIcon size={ICON_SIZE} />,
  Ideograph: <Lightbulb size={ICON_SIZE} />,
};

const formatStructuralTypeName = (type: StructuralType): string => {
  const info = structuralTypeInfo[type];
  return `${info.name ?? "unknown"}`;
};

const NoInfo = () => {
  return <span className="text-[10px] uppercase">Not available</span>;
};

// Shared status handling for the four structural-data sources: ellipsis while
// the provider loads, NoInfo when the source has nothing for this kanji, and
// the horizontal scroller layout otherwise.
const StructuralSection = ({
  status,
  hasData,
  children,
}: {
  status: string;
  hasData: boolean;
  children: ReactNode;
}) => {
  if (status === "pending" || status === "idle") return "...";
  if (!hasData) return <NoInfo />;

  return (
    <div className="flex items-center gap-4 overflow-x-auto justify-left w-fit">
      {children}
    </div>
  );
};

// --- TASK 2A: Lorenzi (same pattern as KanjiStructuralData, uses multi provider) ---
const KanjiStructuralDataLorenzi = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const hlorenzi = kanjiStructureData?.hlorenzi;
  const semanticResolved = useResolvedComponent(hlorenzi?.semantic);
  const phoneticResolved = useResolvedComponent(hlorenzi?.phonetic);

  return (
    <StructuralSection
      status={status}
      hasData={hlorenzi?.phonetic != null || hlorenzi?.semantic != null}
    >
      {semanticResolved && (
        <ComponentLink {...semanticResolved} title="Semantic" />
      )}
      {phoneticResolved && (
        <ComponentLink {...phoneticResolved} title="Phonetic" />
      )}
      {hlorenzi?.type && (
        <BadgeWithPopover
          name={formatStructuralTypeName(hlorenzi.type) ?? hlorenzi.type}
          desc={structuralTypeInfo[hlorenzi.type]?.description}
          icon={structuralTypeIcons[hlorenzi.type]}
        />
      )}
    </StructuralSection>
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

  const typeInfo = structureType
    ? structuralTypeInfoB[structureType as keyof typeof structuralTypeInfoB]
    : null;

  return (
    <StructuralSection status={status} hasData={kanjium != null}>
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
        <ComponentLink
          component={idsStructure}
          title="Structure"
          keyword="..."
          type="unknown"
        />
      )}
      {structureType && (
        <BadgeWithPopover
          name={typeInfo?.name ?? structureType}
          desc={typeInfo?.description}
          icon={
            structuralTypeIconsB[
              structureType as keyof typeof structuralTypeInfoB
            ]
          }
        />
      )}
    </StructuralSection>
  );
};

const KanjiStructuralDataYagays = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const yagays = kanjiStructureData?.yagays;

  return (
    <StructuralSection status={status} hasData={!!yagays && yagays.length > 0}>
      {[...new Set(yagays ?? [])].map((part) => {
        return <PartComponentLink part={part} key={part} />;
      })}
    </StructuralSection>
  );
};

const KanjiStructuralDataScott = ({ kanji }: { kanji: string }) => {
  const { kanjiStructureData, status } = useMultiKanjiStructure(kanji);
  const scott = kanjiStructureData?.scott;

  return (
    <StructuralSection status={status} hasData={!!scott && scott.length > 0}>
      {[...new Set(scott ?? [])].map((part) => {
        return <PartComponentLink part={part} key={part} />;
      })}
    </StructuralSection>
  );
};

export {
  KanjiStructuralDataLorenzi,
  KanjiStructuralDataKanjium,
  KanjiStructuralDataYagays,
  KanjiStructuralDataScott,
};
