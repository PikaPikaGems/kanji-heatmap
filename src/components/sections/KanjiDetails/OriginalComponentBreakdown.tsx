import { SingleKanjiPart } from "@/components/dependent/site-wide/SingleKanjiPart";
import { useIsKanjiWorkerReady, useKanjiInfo } from "@/kanji-worker/kanji-worker-hooks";
import { HoverItemReturnData } from "@/lib/kanji/kanji-info-types";

export const OriginalKanjiComponentBreakdown = ({ kanji, showNotAvailable = true }: { kanji: string, showNotAvailable?: boolean }) => {
    const data = useKanjiInfo(kanji, "hover-card");
    const ready = useIsKanjiWorkerReady();

    if (!ready || data.status === "loading") {
        return <span className="text-[10px] uppercase">...</span>;
    }

    if (data.data == null) {
        return <span className="text-[10px] uppercase">Not available</span>;
    }

    if (data.error || data.data == null) {

        if (!showNotAvailable) {
            return <></>
        }

        return <span className="text-[10px] uppercase">Not available</span>;
    }

    const info = data.data as HoverItemReturnData;

    const parts = info.parts
        .filter((item) => item.part !== kanji)
        .filter((item) => item.part !== info.phonetic?.phonetic);

    const hasParts = parts.length > 0 || info.phonetic;

    if (!hasParts) {
        if (!showNotAvailable) {
            return <></>
        }

        return <span className="text-[10px] uppercase">Not available</span>;
    }

    return <>
        {hasParts && (
            <div className="flex flex-wrap gap-2 text-left">
                {parts.map((item) => (
                    <SingleKanjiPart
                        key={item.part}
                        kanji={item.part}
                        keyword={item.keyword}
                        isKanji={item.isKanji}
                    />
                ))}
                {info.phonetic && (
                    <SingleKanjiPart
                        kanji={info.phonetic.phonetic}
                        keyword={info.phonetic.keyword}
                        phonetics={info.phonetic.sound}
                        isKanji={info.phonetic.isKanji}
                    />
                )}
            </div>
        )}</>
}