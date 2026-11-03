/**
 * The optional study engine, resolved at build time (see vite.config.ts).
 * Typed against `engine-contract` only, so type checking never needs the
 * engine itself.
 */
declare module "kh-study-engine" {
  import type { CreateEngine } from "engine-contract";

  export const createEngine: CreateEngine;
}

/** In-memory backend for host development. */
declare module "kh-study-engine/mock" {
  import type { Engine, IanaTimeZone, ReviewSettings } from "engine-contract";

  export type StudyEngineMockControls = {
    setEntitlementActive(active: boolean): void;
    requireBootstrap(required?: boolean): void;
    setSchemaMismatch(enabled: boolean): void;
    injectOperationFailure(operationId: string, code: string): void;
    goOffline(offline?: boolean): void;
    setPolicy(policy: {
      notesMaxUtf8Bytes?: number;
      reviewSettingsDefaults?: ReviewSettings;
      maxPendingOutboxOps?: number;
      maxOutboxOpStalenessMs?: number;
      userDataEvictionDelayMs?: number;
    }): void;
  };

  /** Transports are opaque to the host; they are only passed through. */
  type MockTransport = { readonly __mockTransport: unique symbol };

  export type StudyEngineMockBackend = {
    syncTransport: MockTransport;
    authTransport: MockTransport;
    controls: StudyEngineMockControls;
  };

  export function createMockBackend(): StudyEngineMockBackend;

  export function createEngineWithDependencies(deps: {
    syncTransport: MockTransport;
    authTransport: MockTransport;
    clock: { now(): Date };
    timeZoneProvider: { current(): IanaTimeZone };
  }): Engine;
}
