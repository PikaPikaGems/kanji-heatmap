import { cnRandomDurationDelay } from "@/lib/cn-fns";

const BadgeLoading = ({ text }: { text: string }) => {
  return (
    <div className="inline-flex items-center rounded-full border px-2.5 text-nowrap py-1 m-1 text-xs border-dashed ">
      <span className="block h-3 w-3 bg-gray-300 dark:bg-gray-500 animate-pulse rounded-sm  border-opacity-50 border-gray-500 dark:border-gray-600 dark:border-opacity-50 bg-opacity-80 mr-1"></span>
      <span className="font-normal mr-1 !text-xs opacity-0">{text}</span>
    </div>
  );
};

const KanjiPart = () => {
  return (
    <div
      className={`flex flex-col m-1 kanji-font text-2xl border-2 rounded-2xl p-1 h border-dotted w-8 h-9 ${cnRandomDurationDelay()}`}
    />
  );
};

const WordPart = () => {
  return (
    <div className="px-2 w-full">
      <div className="flex justify-center sm:justify-start">
        <div className="items-center justify-center whitespace-nowrap rounded-md font-medium space-x-2 h-9 py-2 flex px-1 z-0 text-md lg:text-2xl kanji-font">
          <span
            className={`w-10  h-6 rounded-full ${cnRandomDurationDelay()}`}
          ></span>
          <span
            className={`w-20  h-6 rounded-full ${cnRandomDurationDelay()}`}
          ></span>
        </div>
      </div>
      <div
        className={`items-center w-30 h-16 rounded-xl ${cnRandomDurationDelay()}`}
      />
    </div>
  );
};

const KanjiMain = () => {
  return (
    <div className="mr-4 pl-2 rounded-3xl">
      <div
        className={`mt-4 rounded-3xl  w-28 h-32 ${cnRandomDurationDelay()}`}
      ></div>
      <div
        className={`mt-2 w-28 h-8 rounded-full  ${cnRandomDurationDelay()}`}
      />
    </div>
  );
};
export const CardLoadingScreen = () => {
  return (
    <article className="w-full rounded-lg border-2 border-dotted">
      <div className="hidden sm:flex">
        <div className="border-r-2 border-dotted">
          <KanjiMain />
        </div>
        <div className="px-2 w-full my-4 ">
          <WordPart />
          <div className="mt-4 mb-4  border-b-2 border-dotted w-full"></div>
          <WordPart />
        </div>
      </div>
      <div className="flex flex-col sm:hidden">
        <div className="flex justify-center w-full">
          <KanjiMain />
        </div>
        <div className="px-2 w-full py-2 mt-2 border-t-2 border-dotted flex flex-col justify-center">
          <WordPart />
          <div className="mt-2 mb-2 border-b-2 border-dotted w-full"></div>
          <WordPart />
        </div>
      </div>
      <div className="flex justify-center flex-wrap mr-4 border-t-2 border-dotted pt-1 w-full">
        <KanjiPart />
        <KanjiPart /> <KanjiPart />
      </div>
      <div className="flex justify-center flex-wrap border-t-2 border-dotted mt-1 mb-2 pt-1 px-2">
        <BadgeLoading text="n2" />
        <BadgeLoading text="wikipedia 200" />
        <BadgeLoading text="twitter 1000" />
        <BadgeLoading text="google 20" />
        <BadgeLoading text="netflix 200" />
      </div>
    </article>
  );
};
