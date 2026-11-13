import { DefaultErrorFallback } from "./DefaultErrorFallback";

/** What to say when something isn't available offline because it was never loaded. */
export const NOT_CACHED_OFFLINE_MESSAGE = `Not cached yet 😅 Try it once while you're online, and it'll be available anytime, anywhere—even offline! 📱✨`;

export const DefaultOfflineFallback = () => {
  return (
    <div className="mt-10">
      <DefaultErrorFallback message={NOT_CACHED_OFFLINE_MESSAGE} />
    </div>
  );
};
