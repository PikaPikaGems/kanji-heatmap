import { ExternalKanjiLinks } from "@/components/common/ExternalKanjiLinks";
import { Wrapper } from "./common";
import { Sumimasen } from "./Sumimasen";

export const KanjiNotFound = ({ kanji }: { kanji: string }) => {
  return (
    <Wrapper>
      <div className="px-4">
        <Sumimasen />
        <div className="my-2 font-bold">{`"${kanji}" Not Found`}</div>
        <div className="text-xs max-w-96 py-2  my-2 text-left">
          <span>You can try looking for it in the following places:</span>
          <div className="flex flex-col items-center justify-center my-2">
            <ExternalKanjiLinks kanji={kanji} />
          </div>
        </div>
      </div>
    </Wrapper>
  );
};
