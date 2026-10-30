import { ReactNode } from "react";

export const CHART_TITLE =
  "Cumulative Use vs Standard Competition Ranking (Frequency)";

export const CumUseChartWrapper = ({
  legends,
  showTitle,
  children,
}: {
  legends: ReactNode;
  /** False in the modal, whose header already carries the title. */
  showTitle: boolean;
  children: ReactNode;
}) => {
  return (
    <article className="flex justify-center flex-col items-center">
      <div className="w-full max-w-5xl">
        {showTitle && (
          <h1 className="font-bold text-lg md:text-xl my-3">{CHART_TITLE}</h1>
        )}

        <div>{children}</div>
        <div className="flex flex-wrap justify-center">{legends}</div>
        <div className="mx-2 text-left">
          <p className="text-base my-2">
            This graph shows the cumulative usage percentage of different
            character sets across various sources (e.g., novels, Netflix
            subtitles, online news, Twitter, Wikipedia, etc.) as a function of
            frequency rank (Standard competition ranking). The graph highlights
            how quickly the most frequent items build up to account for the bulk
            of the overall usage.
          </p>
          <p className="text-base my-2">
            This shows that higher ranked characters are more frequently
            used.The cumulative usage percentage rises steeply at first, meaning
            a relatively small number of high-frequency characters contribute
            significantly to the overall text coverage. As the frequency rank
            increases, the growth rate slows down.
          </p>

          <p className="my-2 text-xs">
            {`**Standard competition ranking (also called "1224" ranking) is a
            ranking system where equal scores receive the same rank, and the
            next rank is determined by skipping the number of tied positions
            (e.g., if two players are tied at rank 2, the next rank is 4, not
            3).`}
          </p>
        </div>
      </div>
    </article>
  );
};

export default CumUseChartWrapper;
