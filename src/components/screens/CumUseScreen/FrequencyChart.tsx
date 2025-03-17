"use client";

import { useEffect, useRef } from "react";
import chartXkcd from "chart.xkcd";

// Define the type for the input data
type ChartData = Record<string, [number, number][]>;

interface CharacterFrequencyChartProps {
  data: ChartData;
}

const ALL_X_POINTS = new Array(50).fill(null).map((_, i) => {
  return i * 50;
});

export default function CharacterFrequencyChart({
  data,
}: CharacterFrequencyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || Object.keys(data).length === 0) return;

    // Extract all unique x values from all datasets
    const allXValues = new Set<number>([0]);
    Object.values(data).forEach((points) => {
      points.forEach(([x]) => allXValues.add(x));
    });

    // Sort x values to create labels
    // const sortedXValues = Array.from(allXValues).sort((a, b) => a - b);

    // Create datasets with the correct format
    const datasets = Object.entries(data).map(([key, points]) => {
      // Create a map of x to y for quick lookup
      const pointMap = new Map(points.map(([x, y]) => [x, y]));

      return {
        label: key,
        data: ALL_X_POINTS.map((x) => pointMap.get(x) ?? 0), // Use 0 if no y value exists for this x
      };
    });

    // Generate random colors for each dataset
    const dataColors = datasets.map(
      () => `hsl(${Math.random() * 360}, 70%, 50%)`
    );

    // Create the chart
    new chartXkcd.Line(svgRef.current, {
      title: "Character Frequency Distribution",
      xLabel: "Frequency Rank",
      yLabel: "Cumulative Usage (%)",
      data: {
        labels: ALL_X_POINTS.map((x) => {
          return x.toString();
        }),
        datasets,
      },
      options: {
        dataColors,
        dotSize: 5,
        unxkcdify: true,
        fontFamily: "Avenir",
      },
    });
  }, [data]);

  return (
    <div className="w-[1000px]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
