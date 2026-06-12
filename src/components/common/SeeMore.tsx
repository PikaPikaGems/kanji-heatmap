import { useState } from "react";

export const SeeMore = ({
  definition,
  maxLen = 200,
}: {
  definition: string;
  maxLen?: number;
}) => {
  const [showMore, setShowMore] = useState(false);
  const canSeeAll = definition.length <= maxLen;

  return (
    <div className="px-3 py-2 text-xs text-center">
      {canSeeAll || showMore ? (
        <>{definition}</>
      ) : (
        <>{definition.slice(0, maxLen)}... </>
      )}
      <br />
      {!canSeeAll && (
        <button
          className="mx-2 my-1 font-bold underline"
          onClick={() => {
            setShowMore((prev) => !prev);
          }}
        >
          {showMore ? <>See less</> : <>See more</>}
        </button>
      )}
    </div>
  );
};
