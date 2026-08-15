import { GRAVITY_BASE, GRAVITY_MAX_LEVEL_FOR_CURVE, GRAVITY_MIN_INTERVAL_MS, GRAVITY_STEP } from "../config";

/** Standard Tetris Guideline gravity curve, returned in milliseconds per row. */
export function dropIntervalMs(level: number): number {
  const clampedLevel = Math.min(level, GRAVITY_MAX_LEVEL_FOR_CURVE);
  const seconds = Math.pow(GRAVITY_BASE - (clampedLevel - 1) * GRAVITY_STEP, clampedLevel - 1);
  const ms = seconds * 1000;
  return Math.max(ms, GRAVITY_MIN_INTERVAL_MS);
}
