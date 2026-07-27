import { StrokeOrderUnavailableGallery } from "@/components/common/StrokeOrderUnavailable";

/** Temporary preview page for stroke-order unavailable fallbacks — remove after picking a variant. */
export const StrokeOrderUnavailableGalleryPage = () => (
  <div className="w-full max-w-4xl px-2 pt-16 pb-24 mx-auto sm:px-4">
    <h1 className="px-4 mb-2 text-xl font-bold tracking-tight">
      Stroke order unavailable — gallery
    </h1>
    <StrokeOrderUnavailableGallery />
  </div>
);
