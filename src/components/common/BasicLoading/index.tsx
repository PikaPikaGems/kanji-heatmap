import "./basic-loading.css";

export const BasicLoading = () => {
  return (
    <div className="bg-background rounded-xl p-6 space-y-4">
      <div className="sr-only">Loading...</div>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full animate-shimmer"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/4 animate-shimmer rounded"></div>
          <div className="h-3 w-1/3 animate-shimmer rounded"></div>
        </div>
      </div>
      <div className="flex flex-col space-y-3">
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-3/4 animate-shimmer rounded"></div>
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-3/4 animate-shimmer rounded"></div>
      </div>
      <div className="flex flex-col space-y-3">
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-full animate-shimmer rounded"></div>
        <div className="h-4 w-3/4 animate-shimmer rounded"></div>
      </div>
    </div>
  );
};
