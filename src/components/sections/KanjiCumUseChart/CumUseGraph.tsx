import { useRef, useEffect } from "react";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
} from "chart.js";
import { useTheme } from "@/providers/theme-hooks";
import {
  buildChartConfig,
  buildChartJSConfig,
  ChartData,
  ChartSeriesConfig,
  getDataset,
} from "./helpers";
import { renderTooltip, TooltipContext } from "./chart-tooltip";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip
);

interface MultiLineChartProps {
  data: ChartData;
  config: ChartSeriesConfig;
  isDarkMode?: boolean;
}

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

  // Effect needed: chart.js instance lifecycle (create on the canvas,
  // destroy the previous instance and on unmount).
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
