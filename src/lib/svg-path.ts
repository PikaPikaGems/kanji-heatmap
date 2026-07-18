/**
 * Convert a perfect-freehand stroke outline (list of [x, y] points) into a
 * closed SVG path, smoothing between points with quadratic curves.
 */
export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return "";
  const d: (string | number)[] = ["M", ...stroke[0], "Q"];
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i];
    const [x1, y1] = stroke[(i + 1) % stroke.length];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push("Z");
  return d.join(" ");
}
