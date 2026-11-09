import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/common/ResponsiveSelect";
import { cnWarningText } from "@/lib/generic-cn";
import { cn } from "@/lib/utils";
import { listProviderModels } from "@/lib/ai-explain/providers";
import { AI_PROVIDERS } from "@/lib/ai-explain/providers/capabilities";
import type { AiModelKind, AiProvider } from "@/lib/ai-explain/providers/types";

type ModelList =
  | { status: "loading" }
  | { status: "done"; models: string[] }
  | { status: "error"; message: string };

const DEFAULT_MODEL_OPTION = "__default__";
const CUSTOM_MODEL_OPTION = "__custom__";

/**
 * Picks a tool's model from the provider's own list (fetched once per
 * session), or a typed name. Unset means the provider's default.
 */
export const ModelField = ({
  provider,
  kind,
  apiKey,
  value,
  onChange,
}: {
  provider: AiProvider;
  kind: AiModelKind;
  apiKey: string;
  value: string | undefined;
  onChange: (model: string | undefined) => void;
}) => {
  const info = AI_PROVIDERS[provider];
  const fixed = info.fixedModels?.[kind];
  const defaultModel = info.defaultModels[kind] ?? "";
  const [list, setList] = useState<ModelList>({ status: "loading" });
  const [customOpen, setCustomOpen] = useState(false);

  // Effect needed: fetches this key's models from the provider when the
  // tool's section opens; render can't await a request, and the result must
  // be ignored after unmount or a key change.
  useEffect(() => {
    if (fixed || apiKey === "") return;
    let active = true;
    setList({ status: "loading" });
    listProviderModels(provider, kind, apiKey).then(
      (models) => active && setList({ status: "done", models }),
      (error: unknown) =>
        active &&
        setList({
          status: "error",
          message: error instanceof Error ? error.message : "",
        })
    );
    return () => {
      active = false;
    };
  }, [provider, kind, apiKey, fixed]);

  const listed = fixed
    ? fixed.map((model) => model.id)
    : list.status === "done"
      ? list.models
      : [];
  const labelOf = (id: string) =>
    fixed?.find((model) => model.id === id)?.label ?? id;
  // The default model is already the first option.
  const others = listed.filter((model) => model !== defaultModel);
  const options = [
    {
      value: DEFAULT_MODEL_OPTION,
      label: `Default (${labelOf(defaultModel)})`,
    },
    ...others.map((model) => ({ value: model, label: labelOf(model) })),
    // Keep a saved model that isn't (or isn't yet) in the list selectable.
    ...(value !== undefined && !listed.includes(value)
      ? [{ value, label: value }]
      : []),
    ...(fixed
      ? []
      : [{ value: CUSTOM_MODEL_OPTION, label: "Type a model name…" }]),
  ];
  const missingDefault =
    value === undefined &&
    list.status === "done" &&
    list.models.length > 0 &&
    !list.models.includes(defaultModel);

  return (
    <div className="space-y-1">
      <p aria-hidden className="text-sm font-semibold">
        Model
      </p>
      <ResponsiveSelect
        isLabelSrOnly
        label="Model"
        value={
          customOpen ? CUSTOM_MODEL_OPTION : (value ?? DEFAULT_MODEL_OPTION)
        }
        onChange={(next) => {
          if (next === CUSTOM_MODEL_OPTION) {
            setCustomOpen(true);
            return;
          }
          setCustomOpen(false);
          onChange(next === DEFAULT_MODEL_OPTION ? undefined : next);
        }}
        options={options}
      />
      {customOpen && (
        <Input
          className="rounded-lg"
          aria-label="Model name"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() || undefined)}
          placeholder={defaultModel}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
      )}
      {missingDefault && (
        <p className={cn("pt-1 text-xs", cnWarningText)}>
          Your {info.label} account doesn&apos;t list {defaultModel}. Pick
          another model.
        </p>
      )}
      {!fixed && (
        <p className="pt-1 text-xs text-muted-foreground">
          {list.status === "loading" && "Loading your models… "}
          {list.status === "error" && `Couldn't load models. ${list.message} `}
          Models come from your {info.label} account.
        </p>
      )}
    </div>
  );
};
