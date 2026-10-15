import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DownloadButton,
  TextActionButton,
} from "@/components/common/AiActionButtons";
import { downloadBlob } from "@/lib/ai-explain/download";
import type { MnemonicImage } from "@/lib/ai-explain/storage";
import { ImagePreview } from "./ImagePreview";
import { MnemonicForm } from "./MnemonicForm";

type GalleryImage = MnemonicImage & {
  unsaved?: boolean;
  persistedCreatedAt?: number;
};
type GalleryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; images: GalleryImage[]; selectedId: string | null };

const ImageActions = ({
  image,
  disabled,
  onDeleted,
}: {
  image: GalleryImage;
  disabled: boolean;
  onDeleted: () => void;
}) => {
  const [action, setAction] = useState<"idle" | "confirm-delete" | "deleting">(
    "idle"
  );
  const [error, setError] = useState("");

  const remove = async () => {
    setAction("deleting");
    setError("");
    try {
      const storage = await import("@/lib/ai-explain/storage");
      await storage.deleteMnemonicImage(image.id);
      onDeleted();
    } catch {
      setAction("idle");
      setError("Couldn't delete this image. Try again.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <DownloadButton
          disabled={disabled || action === "deleting"}
          onClick={() => {
            try {
              const extension =
                image.blob.type === "image/jpeg"
                  ? "jpg"
                  : image.blob.type === "image/webp"
                    ? "webp"
                    : "png";
              downloadBlob(
                image.blob,
                `kanji-mnemonic-${image.kanji}-${image.id}.${extension}`
              );
              setError("");
            } catch {
              setError("Couldn't download the image. Try again.");
            }
          }}
        >
          Download
        </DownloadButton>
        <span aria-hidden>·</span>
        <TextActionButton
          icon={<Trash2 size={14} />}
          className="text-rose-500"
          disabled={disabled || action === "deleting"}
          onClick={() => setAction("confirm-delete")}
        >
          Delete
        </TextActionButton>
      </div>
      {action !== "idle" && (
        <div className="animate-fade-in-fast space-y-2 rounded-lg border p-3 text-center">
          <p className="text-sm">
            Delete this mnemonic? Download it first if you want to keep it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1">
            <TextActionButton
              icon={<Trash2 size={14} />}
              className="text-rose-500"
              busy={action === "deleting"}
              busyLabel="Deleting…"
              disabled={disabled}
              onClick={() => void remove()}
            >
              Delete image
            </TextActionButton>
            <span aria-hidden>·</span>
            <TextActionButton
              icon={<X size={14} />}
              disabled={action === "deleting"}
              onClick={() => setAction("idle")}
            >
              Keep image
            </TextActionButton>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Holds the selected image's place (image, caption, action row) while a new
 * mnemonic is being made, so switching to "+" doesn't shift the layout.
 */
const NewMnemonicPlaceholder = ({ pending }: { pending: boolean }) => (
  <div className="space-y-3">
    <div className="animate-fade-in mx-auto flex aspect-square w-full max-w-lg flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-foreground/20 text-muted-foreground">
      {pending ? (
        <Loader2 className="size-8 animate-spin" />
      ) : (
        <ImagePlus className="size-8" />
      )}
      <span className="text-sm">
        {pending
          ? "Generating your mnemonic…"
          : "Describe your new mnemonic below"}
      </span>
    </div>
    <p className="text-center text-xs text-muted-foreground">New mnemonic</p>
    <div aria-hidden className="invisible flex justify-center">
      <DownloadButton tabIndex={-1}>Download</DownloadButton>
    </div>
  </div>
);

const MnemonicGallery = ({
  kanji,
  keyword,
}: {
  kanji: string;
  keyword: string;
}) => {
  const [gallery, setGallery] = useState<GalleryState>({ status: "loading" });
  const [pending, setPending] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Effect needed: read the external IndexedDB database and subscribe to content
  // clearing; render cannot perform asynchronous reads or unsubscribe on unmount.
  useEffect(() => {
    let active = true;
    let cleared = false;
    const onChanged = (event: Event) => {
      if (!(event as CustomEvent<{ cleared: boolean }>).detail?.cleared) return;
      cleared = true;
      setGallery({ status: "ready", images: [], selectedId: null });
      setPending(false);
    };
    window.addEventListener("ai-generated-content-changed", onChanged);
    void import("@/lib/ai-explain/storage")
      .then((storage) => storage.listMnemonicImages(kanji))
      .then(
        (images) => {
          if (!active || cleared) return;
          setGallery({
            status: "ready",
            images: images.map((image) => ({
              ...image,
              persistedCreatedAt: image.createdAt,
            })),
            selectedId: images[0]?.id ?? null,
          });
        },
        () => {
          if (!active || cleared) return;
          setGallery({
            status: "error",
            message:
              "Couldn't load saved mnemonics. Retry before generating another image.",
          });
        }
      );
    return () => {
      active = false;
      window.removeEventListener("ai-generated-content-changed", onChanged);
    };
  }, [kanji, loadAttempt]);

  if (gallery.status === "loading")
    return (
      <p role="status" className="p-3 text-sm">
        Loading saved mnemonics…
      </p>
    );
  if (gallery.status === "error")
    return (
      <div className="space-y-3 p-3">
        <p role="alert" className="text-sm">
          {gallery.message}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setGallery({ status: "loading" });
            setLoadAttempt(loadAttempt + 1);
          }}
        >
          Retry
        </Button>
      </div>
    );

  const selected = gallery.images.find(
    (image) => image.id === gallery.selectedId
  );

  return (
    <div className="space-y-4 p-2 text-left">
      {gallery.images.length > 0 && (
        <div
          className="flex flex-wrap gap-2"
          aria-label="Saved mnemonic images"
        >
          {gallery.images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              disabled={pending}
              aria-label={`Select mnemonic ${index + 1}`}
              aria-pressed={image.id === selected?.id}
              className={`rounded-xl border-2 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${image.id === selected?.id ? "border-primary" : "border-transparent"}`}
              onClick={() => setGallery({ ...gallery, selectedId: image.id })}
            >
              <ImagePreview
                blob={image.blob}
                description={image.description}
                thumbnail
              />
            </button>
          ))}
          {gallery.images.length < 3 && (
            <button
              type="button"
              disabled={pending}
              aria-label="Add mnemonic"
              aria-pressed={!selected}
              className={`rounded-xl border-2 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${selected ? "border-transparent" : "border-primary"}`}
              onClick={() => setGallery({ ...gallery, selectedId: null })}
            >
              <span className="flex aspect-square size-20 max-w-[20vw] items-center justify-center rounded-lg border-2 border-dashed border-foreground/30 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Plus className="size-6" />
              </span>
            </button>
          )}
        </div>
      )}
      {!selected && gallery.images.length > 0 && (
        <NewMnemonicPlaceholder pending={pending} />
      )}
      {selected && (
        <div className="space-y-3">
          <ImagePreview
            blob={selected.blob}
            description={selected.description}
          />
          <p className="text-center text-xs text-muted-foreground">
            AI-generated mnemonic · {selected.resolution.toUpperCase()} ·{" "}
            {selected.quality === "low" ? "Standard" : "Higher detail"}
          </p>
          {selected.unsaved && (
            <p role="alert" className="text-sm text-destructive">
              Generated, but couldn&apos;t save on this device. Download this
              image to keep it.
            </p>
          )}
          <ImageActions
            key={selected.id}
            image={selected}
            disabled={pending}
            onDeleted={() => {
              const images = gallery.images.filter(
                (image) => image.id !== selected.id
              );
              setGallery({
                status: "ready",
                images,
                selectedId: images[0]?.id ?? null,
              });
            }}
          />
        </div>
      )}
      {gallery.images.length === 3 && (
        <p className="text-sm text-muted-foreground">
          Select an image to regenerate, or delete one before adding another.
        </p>
      )}
      {(selected || gallery.images.length < 3) && (
        <MnemonicForm
          key={selected?.id ?? "new"}
          kanji={kanji}
          keyword={keyword}
          image={selected}
          expectedCreatedAt={selected?.persistedCreatedAt}
          onPending={setPending}
          onComplete={(image, saved) => {
            setGallery((current) => {
              if (current.status !== "ready") return current;
              const previous = current.images.find(
                (item) => item.id === image.id
              );
              const entry = {
                ...image,
                unsaved: !saved,
                persistedCreatedAt: saved
                  ? image.createdAt
                  : previous?.persistedCreatedAt,
              };
              const exists = current.images.some(
                (item) => item.id === image.id
              );
              const images = exists
                ? current.images.map((item) =>
                    item.id === image.id ? entry : item
                  )
                : [...current.images, entry];
              return { status: "ready", images, selectedId: image.id };
            });
          }}
        />
      )}
      <p className="text-xs text-muted-foreground">
        Resolution and quality are set in User Preferences. Regenerate makes a
        fresh interpretation of your scene.
      </p>
      <p className="text-xs text-muted-foreground">
        AI can make mistakes. Generated content is saved only in this browser.
        It may be lost if browser data is cleared. Download anything you want to
        keep.
      </p>
      <p className="text-xs text-muted-foreground">
        {gallery.images.filter((image) => !image.unsaved).length} saved ·{" "}
        {gallery.images.length} of 3 slots
      </p>
    </div>
  );
};

const VisualMnemonics = (props: { kanji: string; keyword: string }) => (
  <MnemonicGallery key={props.kanji} {...props} />
);

export default VisualMnemonics;
