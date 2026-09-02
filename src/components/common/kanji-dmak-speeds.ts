export type AnimationSpeed = "fast" | "slow";

export const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};

/** DMAK `step` — higher is slower. Speed factors divide the base rate. */
export const dmakStepForSpeed = (
  speed: AnimationSpeed,
  settings: { slowSpeed: number; fastSpeed: number }
) => {
  const factor = speed === "fast" ? settings.fastSpeed : settings.slowSpeed;
  return SPEEDS[speed].rate / factor;
};
