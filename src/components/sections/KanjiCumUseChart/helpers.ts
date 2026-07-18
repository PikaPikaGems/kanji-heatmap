import {
  ChartType,
  ChartOptions,
  ChartData as ChartJSData,
  ChartTypeRegistry,
} from "chart.js";
import { KanjiInfoFrequency } from "@/lib/kanji/kanji-worker-types";
import { frequencyRankLabels } from "@/lib/options/options-label-maps";
import { TooltipContext } from "./chart-tooltip";

export type ChartData = Record<string, [number, number][]>;

export const ALL_X_POINTS = new Array(36).fill(null).map((_, i) => {
  return i * 50;
});

export const freqKeyMap: Record<string, keyof KanjiInfoFrequency> = {
  rtk5100: "novels5100",
  aozora: "aozoraChar",
  netflix: "netflix",
  news: "onlineNewsChar",
  subtitles: "dramaSubs",
  twitter: "twitter",
  wikipedia: "wikiChar",
};

export const colorMap: Record<string, string> = {
  rtk5100: "#ff9066",
  aozora: "#7eccb1",
  netflix: "#e50914",
  news: "#8c52ff",
  subtitles: "#edae4c",
  twitter: "#1da1f2",
  wikipedia: "#636363",
};

/**
    const chartConfig = {
      [key1]: { label: string,  color: string },
      [key2]: { label: string,  color: string },
    } satisfies ChartConfig;

  **/
export const buildChartConfig = (data: ChartData) => {
  const dataKeys = Object.keys(data);

  const chartConfig = dataKeys.reduce(
    (acc, key) => {
      acc[key] = {
        label: frequencyRankLabels[freqKeyMap[key]],
        color: colorMap[key],
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>
  );

  return chartConfig;
};

export type ChartSeriesConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

export type DataSet = {
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

export const getDataset = (data: ChartData, config: ChartSeriesConfig) => {
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

export const buildChartJSConfig = (
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
