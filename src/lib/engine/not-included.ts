/**
 * Stand-in for `kh-study-engine` and `kh-study-engine/mock` in builds without
 * the optional study engine (KH_STUDY_ENGINE_ENTRY unset; see vite.config.ts).
 * The app checks `__STUDY_ENGINE_INCLUDED__` before importing either module,
 * so these only run if that guard is bypassed.
 */
const notIncluded = (): never => {
  throw new Error("The study engine is not included in this build");
};

export const createEngine = () => ({ type: "unavailable" as const });
export const createMockBackend = notIncluded;
export const createEngineWithDependencies = () => ({
  type: "unavailable" as const,
});
