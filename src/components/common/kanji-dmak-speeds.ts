export type AnimationSpeed = "fast" | "slow";

export const SPEEDS: Record<AnimationSpeed, { rate: number }> = {
  fast: { rate: 0.0095 },
  slow: { rate: 0.022 },
};
