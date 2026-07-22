/** Jouyou school-grade bands used in kanji_extended.json. */

export const JOUYOU_GRADE_ARR = [1, 2, 3, 4, 5, 6, 9, -1] as const;
export type JouyouGrade = (typeof JOUYOU_GRADE_ARR)[number];

export const JouyouGradeListItems: Record<
  JouyouGrade,
  { cn: string; color: string; label: string; cnBorder: string }
> = {
  1: {
    cn: "bg-green-500",
    cnBorder: "border-green-500",
    color: "green",
    label: "1",
  },
  2: {
    cn: "bg-lime-500",
    cnBorder: "border-lime-500",
    color: "lime",
    label: "2",
  },
  3: {
    cn: "bg-yellow-400",
    cnBorder: "border-yellow-400",
    color: "yellow",
    label: "3",
  },
  4: {
    cn: "bg-cyan-400",
    cnBorder: "border-cyan-400",
    color: "cyan",
    label: "4",
  },
  5: {
    cn: "bg-blue-400",
    cnBorder: "border-blue-400",
    color: "blue",
    label: "5",
  },
  6: {
    cn: "bg-pink-400",
    cnBorder: "border-pink-400",
    color: "pink",
    label: "6",
  },
  9: {
    cn: "bg-orange-400",
    cnBorder: "border-orange-400",
    color: "orange",
    label: "9",
  },
  [-1]: {
    cn: "bg-gray-400",
    cnBorder: "border-gray-400",
    color: "gray",
    label: "Not in Jouyou",
  },
};

export const toJouyouGrade = (raw: number | null | undefined): JouyouGrade => {
  if (
    raw === 1 ||
    raw === 2 ||
    raw === 3 ||
    raw === 4 ||
    raw === 5 ||
    raw === 6 ||
    raw === 9
  ) {
    return raw;
  }
  return -1;
};

/** String filter values used in URL params / multi-selects. */
export const JOUYOU_GRADE_TYPE_ARR = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "9",
  "none",
] as const;

export type JouyouGradeType = (typeof JOUYOU_GRADE_TYPE_ARR)[number];

export const jouyouGradeTypeToGrade = (grade: JouyouGradeType): JouyouGrade =>
  grade === "none" ? -1 : (Number(grade) as JouyouGrade);

export const JouyouGradeOptions = JOUYOU_GRADE_TYPE_ARR.map((grade) => {
  const item = JouyouGradeListItems[jouyouGradeTypeToGrade(grade)];
  return {
    ...item,
    label: grade === "none" ? item.label : `Grade ${grade}`,
    value: grade,
  };
});

export const JouyouGradeOptionsCount = JOUYOU_GRADE_TYPE_ARR.length;

export const toJouyouGradeType = (rawGrade: number): JouyouGradeType | null => {
  const grade = rawGrade === -1 ? "none" : rawGrade.toString();
  return JOUYOU_GRADE_TYPE_ARR.includes(grade as JouyouGradeType)
    ? (grade as JouyouGradeType)
    : null;
};
