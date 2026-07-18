export type Stroke = [number, number][];

export type DrawingSubmitPayload = {
  strokes: Stroke[];
  width: number;
  height: number;
};
