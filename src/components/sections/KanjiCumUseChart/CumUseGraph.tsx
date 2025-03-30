import { useRef, useEffect } from "react";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  TooltipModel,
  ChartType,
  ChartOptions,
  ChartData as ChartJSData,
  ChartTypeRegistry,
} from "chart.js";
import { useTheme } from "@/providers/theme-hooks";
import { buildChartConfig, ChartData } from "./helpers";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
);

type MultiLineChartData = Record<string, [number, number][]>;

type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;
interface MultiLineChartProps {
  data: MultiLineChartData;
  config: ChartConfig;
  isDarkMode?: boolean;
}

interface TooltipItem {
  label: string;
  value: number;
  color: string;
  datasetLabel: string;
  xValue: number;
}

type DataSet = {
  label: string;
  data: {
    x: number;
    y: number;
  }[];
  borderColor: string;
  backgroundColor: string;
  tension: number;
  pointRadius: number;
  pointHoverRadius: number;
  borderWidth: number;
  spanGaps: boolean;
};

const getDataset = (data: MultiLineChartData, config: ChartConfig) => {
  const datasets: DataSet[] = Object.entries(data).map(([key, points]) => {
    const configItem = config[key];
    return {
      label: configItem?.label || key,
      data: points.map(([x, y]) => ({ x, y })),
      borderColor: configItem?.color,
      backgroundColor: configItem?.color,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
      spanGaps: true, // Connect null datapoints
    };
  });

  return datasets;
};

const renderTooltip = (
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

const buildTooltipInnerHtml = (context: TooltipContext) => {
  const { chart, tooltip } = context;

  const tooltipItems: TooltipItem[] = tooltip.dataPoints.map((dataPoint) => {
    const datasetIndex = dataPoint.datasetIndex;
    const dataset = chart.data.datasets[datasetIndex];
    return {
      label: dataset.label || "",
      value: dataPoint.parsed.y,
      color: dataset.borderColor as string,
      datasetLabel: dataset.label || "",
      xValue: dataPoint.parsed.x,
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

interface TooltipContext {
  chart: Chart;
  tooltip: TooltipModel<"line">;
}

const buildChartJSConfig = (
  datasets: DataSet[],
  isDarkMode: boolean,
  externalTooltipHandler: (context: TooltipContext) => void
): {
  type: ChartType;
  data: ChartJSData<keyof ChartTypeRegistry>;
  options: ChartOptions<keyof ChartTypeRegistry>;
} => {
  return {
    type: "line",
    data: {
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index", // Show all points at the same x value
        intersect: false, // Don't require hovering directly over a point
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          type: "linear",
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(0, 0, 0, 0.7)",
          },
          title: {
            display: true,
            text: "Frequency Rank ",
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)",
          },
          ticks: {
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(0, 0, 0, 0.7)",
            callback: (value: string | number) => `${value}%`,
          },
          title: {
            display: true,
            text: "Cumulative Usage (%)",
            color: isDarkMode
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(0, 0, 0, 0.8)",
          },
        },
      },
    },
  };
};

function MultiLineChart({
  data,
  config,
  isDarkMode = false,
}: MultiLineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const verticalLineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || Object.keys(data).length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const tooltipEl = tooltipRef.current;
    const verticalLineEl = verticalLineRef.current;
    const containerEl = containerRef.current;

    if (!tooltipEl || !verticalLineEl || !containerEl) return;

    const datasets = getDataset(data, config);

    chartRef.current = new Chart(
      ctx,
      buildChartJSConfig(datasets, isDarkMode, (context: TooltipContext) => {
        renderTooltip(context, tooltipEl, verticalLineEl, containerEl);
      })
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, config, isDarkMode]);

  return (
    <div className={"relative min-h-[300px]  w-full"} ref={containerRef}>
      <div
        ref={verticalLineRef}
        className="absolute opacity-0 pointer-events-none w-px bg-gray-500 "
      />
      <canvas ref={canvasRef} />
      <div
        ref={tooltipRef}
        className={
          "absolute z-10 rounded-lg shadow-md min-w-[150px] opacity-0 pointer-events-none bg-background border border-gray-200 dark:border-gray-800"
        }
      />
    </div>
  );
}

export const CumUseGraph = ({ data }: { data: ChartData }) => {
  const chartConfig = buildChartConfig(data);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  return (
    <MultiLineChart config={chartConfig} data={data} isDarkMode={isDarkMode} />
  );
};
