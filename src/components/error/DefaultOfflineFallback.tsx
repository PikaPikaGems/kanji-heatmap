import { DefaultErrorFallback } from "./DefaultErrorFallback";

export const DefaultOfflineFallback = () => {
  const offlineMessage = `Not cached yet 😅 Try it once while you're online, and it'll be available anytime, anywhere—even offline! 📱✨`;
  return (
    <div className="mt-10">
      <DefaultErrorFallback message={offlineMessage} />
    </div>
  );
};
