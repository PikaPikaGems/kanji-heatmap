import { Chart, TooltipModel } from "chart.js";

/**
 * Imperative HTML tooltip for the cumulative-use chart. chart.js's external
 * tooltip API hands us a context per hover; we position a floating div and a
 * vertical guide line inside the chart container ourselves.
 */

export interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<"line">;
}

interface TooltipItem {
  label: string;
  value: number;
  color: string;
  datasetLabel: string;
  xValue: number;
}

export const buildTooltipInnerHtml = (context: TooltipContext) => {
  const { chart, tooltip } = context;

  const tooltipItems: TooltipItem[] = tooltip.dataPoints.map((dataPoint) => {
    const datasetIndex = dataPoint.datasetIndex;
    const dataset = chart.data.datasets[datasetIndex];
    return {
      label: dataset.label || "",
      value: dataPoint.parsed.y ?? 0,
      color: dataset.borderColor as string,
      datasetLabel: dataset.label || "",
      xValue: dataPoint.parsed.x ?? 0,
    };
  });

  const xValue = tooltipItems[0]?.xValue;
  const sortedItems = [...tooltipItems].sort((a, b) => b.value - a.value);

  return `
    <div class="flex flex-col gap-2 p-2 text-xs w-56">
      ${xValue !== undefined ? `<div class="border-b pb-1 mb-1 font-bold">Frequency Rank ${xValue}</div>` : ""}
      ${sortedItems
        .map(
          (item) => `
          <div class="flex items-center justify-between">
          <div class="flex">
            <span class="block w-3 h-3 rounded-sm mr-2" style="background-color: ${item.color}"></span>
            <span>${item.label}</span>
          </div>
            <span>${item.value.toFixed(2)}%</span>
          </div>`
        )
        .join("")}
    </div>
  `;
};

export const renderTooltip = (
  context: TooltipContext,
  tooltipEl: HTMLDivElement,
  verticalLineEl: HTMLDivElement,
  containerEl: HTMLDivElement
) => {
  const { chart, tooltip } = context;

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = "0";
    verticalLineEl.style.opacity = "0";
    return;
  }

  if (tooltip.body) {
    tooltipEl.innerHTML = buildTooltipInnerHtml(context);
  }
  const position = tooltip.caretX;
  const xPosition = position;

  // Get container dimensions
  const containerRect = containerEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const tooltipWidth = tooltipRect.width || 150; // Fallback width if getBoundingClientRect doesn't work immediately

  // Calculate distance from edges
  const distanceFromLeft = xPosition;
  const distanceFromRight = containerRect.width - xPosition;

  // Adjust tooltip position if too close to edges
  let horizontalPosition = `${xPosition}px`;
  let horizontalTransform = "translate(-50%)";

  if (distanceFromLeft < tooltipWidth / 2) {
    // Too close to left edge
    horizontalPosition = "0px";
    horizontalTransform = "translate(10px)";
  } else if (distanceFromRight < tooltipWidth / 2) {
    // Too close to right edge
    horizontalPosition = `${containerRect.width}px`;
    horizontalTransform = "translate(calc(-100% - 10px))";
  }

  tooltipEl.style.opacity = "1";
  tooltipEl.style.left = horizontalPosition;
  tooltipEl.style.top = `250px`;
  tooltipEl.style.transform = horizontalTransform;

  verticalLineEl.style.opacity = "1";
  verticalLineEl.style.left = `${xPosition}px`;
  verticalLineEl.style.top = `${chart.chartArea.top}px`;
  verticalLineEl.style.height = `${chart.chartArea.bottom - chart.chartArea.top}px`;
  verticalLineEl.style.zIndex = "1";
};
