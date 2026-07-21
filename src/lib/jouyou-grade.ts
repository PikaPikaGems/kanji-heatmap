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

export const JouyouGradeOptions: {
  label: string;
  value: JouyouGradeType;
}[] = [
  ...JOUYOU_GRADE_TYPE_ARR.filter((grade) => grade !== "none").map((grade) => ({
    label: `Grade ${grade}`,
    value: grade,
  })),
  { label: "Not in Jōyō", value: "none" },
];

export const JouyouGradeOptionsCount = JOUYOU_GRADE_TYPE_ARR.length;

export const toJouyouGradeType = (rawGrade: number): JouyouGradeType | null => {
  const grade = rawGrade === -1 ? "none" : rawGrade.toString();
  return JOUYOU_GRADE_TYPE_ARR.includes(grade as JouyouGradeType)
    ? (grade as JouyouGradeType)
    : null;
};
