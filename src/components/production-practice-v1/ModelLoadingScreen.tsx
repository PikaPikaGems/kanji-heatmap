export const ModelLoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-6 text-center animate-fade-in">
      <div className="text-4xl animate-pulse" aria-hidden>
        ✍️
      </div>
      <div>
        <h2 className="text-xl font-bold">Loading handwriting model…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This only happens once per visit. Hang tight.
        </p>
      </div>
    </div>
  );
};
