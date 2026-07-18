import { describe, expect, it } from "vitest";
import { buildChartJSConfig, getDataset } from "./helpers";
import { buildTooltipInnerHtml, TooltipContext } from "./chart-tooltip";

describe("getDataset", () => {
  it("maps series points and applies config label/color", () => {
    const [dataset] = getDataset(
      { netflix: [[0, 10], [50, 42]] },
      { netflix: { label: "Netflix", color: "#e50914" } }
    );

    expect(dataset.label).toBe("Netflix");
    expect(dataset.borderColor).toBe("#e50914");
    expect(dataset.data).toEqual([
      { x: 0, y: 10 },
      { x: 50, y: 42 },
    ]);
    expect(dataset.spanGaps).toBe(true);
  });

  it("falls back to the series key when config is missing", () => {
    const [dataset] = getDataset({ mystery: [[1, 2]] }, {});
    expect(dataset.label).toBe("mystery");
  });
});

describe("buildChartJSConfig", () => {
  it("builds a line chart with the external tooltip wired in", () => {
    const handler = () => {};
    const config = buildChartJSConfig([], false, handler);

    expect(config.type).toBe("line");
    expect(config.options.plugins?.tooltip?.enabled).toBe(false);
    expect(config.options.plugins?.tooltip?.external).toBe(handler);
  });
});

describe("buildTooltipInnerHtml", () => {
  it("renders rows sorted by value with the shared x label", () => {
    const context = {
      chart: {
        data: {
          datasets: [
            { label: "Netflix", borderColor: "#e50914" },
            { label: "News", borderColor: "#8c52ff" },
          ],
        },
      },
      tooltip: {
        dataPoints: [
          { datasetIndex: 0, parsed: { x: 500, y: 12.5 } },
          { datasetIndex: 1, parsed: { x: 500, y: 60 } },
        ],
      },
    } as unknown as TooltipContext;

    const html = buildTooltipInnerHtml(context);

    expect(html).toContain("Frequency Rank 500");
    expect(html.indexOf("News")).toBeLessThan(html.indexOf("Netflix"));
    expect(html).toContain("60.00%");
    expect(html).toContain("12.50%");
  });
});
