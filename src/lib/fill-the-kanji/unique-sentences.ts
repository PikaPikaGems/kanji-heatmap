import duplicateGroups from "./duplicate-sentences.json";
import { roundCount, roundRowRange, ROUND_SIZE } from "./rounds";
import { FillTheKanjiSetId } from "./sets";
import { SetRoundStats } from "./storage";

/** Sentences that appear in more than one place, as "<setId>:<row>" copies. */
const DUPLICATE_GROUPS = duplicateGroups as string[][];

/**
 * Sentences read across the given sets, counting a sentence once even when it
 * is in several of them (or twice in one). A round counts once it has stats.
 */
export const uniqueSentencesRead = (
  setIds: FillTheKanjiSetId[],
  statsById: Map<FillTheKanjiSetId, SetRoundStats>
): number => {
  const included = new Set<string>(setIds);
  let read = 0;
  for (const id of setIds) {
    for (const round of Object.keys(statsById.get(id) ?? {})) {
      const [start, end] = roundRowRange(id, Number(round));
      read += end - start;
    }
  }

  const wasRead = (copy: string) => {
    const [setId, row] = copy.split(":");
    if (!included.has(setId)) return false;
    const id = setId as FillTheKanjiSetId;
    const round = Math.min(
      roundCount(id),
      Math.floor(Number(row) / ROUND_SIZE) + 1
    );
    return statsById.get(id)?.[String(round)] !== undefined;
  };

  for (const group of DUPLICATE_GROUPS) {
    const copiesRead = group.filter(wasRead).length;
    if (copiesRead > 1) read -= copiesRead - 1;
  }
  return read;
};
