declare module "chart.xkcd" {
  export interface ChartOptions {
    title?: string;
    xLabel?: string;
    yLabel?: string;
    options?: {
      strokeColor?: string;
      backgroundColor?: string;
      dataColors?: string[];
      fontFamily?: string;
      fontSize?: number;
      padding?: number;
      legendPosition?: PositionType;
      showLegend?: boolean;
      dotSize?: number;
      showLine?: boolean;
      timeFormat?: string;
      showXTicks?: boolean;
      showYTicks?: boolean;
      xTickCount?: number;
      yTickCount?: number;
      xRange?: [number, number];
      yRange?: [number, number];
      unxkcdify?: boolean;
    };
  }

  export interface LineChartOptions extends ChartOptions {
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
  }

  export interface XYChartOptions extends ChartOptions {
    data: {
      datasets: Array<{
        label: string;
        data: Array<{ x: number; y: number }>;
      }>;
    };
  }

  export interface PositionType {
    upLeft: 1;
    upRight: 2;
    downLeft: 3;
    downRight: 4;
  }

  export interface Config {
    positionType: PositionType;
  }

  export class Line {
    constructor(svg: SVGElement, options: LineChartOptions);
    update(options: LineChartOptions): void;
  }
}
