import { useId, useState } from "react";
import type { StudyEngineMockControls } from "kh-study-engine/mock";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEngineState } from "@/lib/engine/engine";
import {
  setMockBackendValue,
  useMockBackendValues,
  type MockBackendValues,
} from "@/lib/engine/mock-controls-state";
import { snapshotValue } from "@/lib/engine/store-cache";
import { useEngineQuery } from "@/lib/engine/use-engine-query";

const FAILURE_CODES = [
  "validation_failed",
  "premium_lapsed",
  "stale_session",
  "schema_version_mismatch",
  "unknown_operation_error",
] as const;

const MockSwitch = ({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id}>{label}</label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
};

const FailNextOperation = ({
  controls,
}: {
  controls: StudyEngineMockControls;
}) => {
  const [code, setCode] = useState<(typeof FAILURE_CODES)[number]>(
    FAILURE_CODES[0]
  );
  const outbox = useEngineQuery("sync.watchOutbox:1", (api) =>
    api.sync.watchOutbox({ limit: 1 })
  );
  const operationId =
    snapshotValue(outbox)?.pendingSyncOperations[0]?.operationId;

  return (
    <div className="flex flex-col gap-1.5">
      <select
        aria-label="Failure code"
        value={code}
        onChange={(e) => {
          const next = FAILURE_CODES.find((c) => c === e.target.value);
          if (next) setCode(next);
        }}
        className="h-8 px-2 border rounded-md bg-background"
      >
        {FAILURE_CODES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        disabled={operationId === undefined}
        onClick={() => {
          if (operationId === undefined) return;
          controls.injectOperationFailure(operationId, code);
        }}
      >
        Fail next pending operation
      </Button>
    </div>
  );
};

const MockBackendControls = ({
  controls,
}: {
  controls: StudyEngineMockControls;
}) => {
  const values = useMockBackendValues();
  const toggle =
    (key: keyof MockBackendValues, apply: (on: boolean) => void) =>
    (on: boolean) => {
      apply(on);
      setMockBackendValue(key, on);
    };

  return (
    <details className="w-full text-xs">
      <summary className="cursor-pointer select-none text-muted-foreground">
        Mock backend
      </summary>
      <div
        className="flex flex-col gap-2 pt-2 text-left"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <MockSwitch
          label="Premium active"
          checked={values.premiumActive}
          onCheckedChange={toggle("premiumActive", (on) =>
            controls.setEntitlementActive(on)
          )}
        />
        <MockSwitch
          label="Offline"
          checked={values.offline}
          onCheckedChange={toggle("offline", (on) => controls.goOffline(on))}
        />
        <MockSwitch
          label="Require bootstrap"
          checked={values.requireBootstrap}
          onCheckedChange={toggle("requireBootstrap", (on) =>
            controls.requireBootstrap(on)
          )}
        />
        <MockSwitch
          label="Schema mismatch"
          checked={values.schemaMismatch}
          onCheckedChange={toggle("schemaMismatch", (on) =>
            controls.setSchemaMismatch(on)
          )}
        />
        <FailNextOperation controls={controls} />
      </div>
    </details>
  );
};

/**
 * Dev-only controls for the in-memory mock backend. Renders nothing against a
 * real backend or in builds without the engine.
 */
export const MockBackendPanel = () => {
  const engine = useEngineState();
  if (engine.status !== "ready" || engine.mockControls === null) return null;
  return <MockBackendControls controls={engine.mockControls} />;
};
