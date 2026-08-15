import {
  SCORE_BACK_TO_BACK_MULTIPLIER,
  SCORE_COMBO_BASE,
  SCORE_DOUBLE,
  SCORE_SINGLE,
  SCORE_TETRIS,
  SCORE_TRIPLE,
  SCORE_TSPIN,
  SCORE_TSPIN_DOUBLE,
  SCORE_TSPIN_MINI,
  SCORE_TSPIN_MINI_SINGLE,
  SCORE_TSPIN_SINGLE,
  SCORE_TSPIN_TRIPLE,
} from "../config";

export interface ClearScoreInput {
  linesCleared: number; // 0-4
  isTSpin: boolean;
  isMini: boolean;
  level: number;
  combo: number; // 0 = not a combo (first clear), 1+ = consecutive clear count
  backToBackActive: boolean; // true if the previous "difficult" clear chains into this one
}

export interface ClearScoreResult {
  points: number;
  isDifficult: boolean; // tetris or any t-spin clear - used to track back-to-back
  clearName: string;
}

function baseLineClearPoints(lines: number, isTSpin: boolean, isMini: boolean): { points: number; name: string } {
  if (isTSpin) {
    if (isMini) {
      if (lines === 0) return { points: SCORE_TSPIN_MINI, name: "T-SPIN MINI" };
      if (lines === 1) return { points: SCORE_TSPIN_MINI_SINGLE, name: "T-SPIN MINI SINGLE" };
      // Mini double/triple are not part of the standard guideline table;
      // fall through to full T-spin scoring for those rare cases.
    }
    if (lines === 0) return { points: SCORE_TSPIN, name: "T-SPIN" };
    if (lines === 1) return { points: SCORE_TSPIN_SINGLE, name: "T-SPIN SINGLE" };
    if (lines === 2) return { points: SCORE_TSPIN_DOUBLE, name: "T-SPIN DOUBLE" };
    return { points: SCORE_TSPIN_TRIPLE, name: "T-SPIN TRIPLE" };
  }
  switch (lines) {
    case 1:
      return { points: SCORE_SINGLE, name: "SINGLE" };
    case 2:
      return { points: SCORE_DOUBLE, name: "DOUBLE" };
    case 3:
      return { points: SCORE_TRIPLE, name: "TRIPLE" };
    case 4:
      return { points: SCORE_TETRIS, name: "TETRIS" };
    default:
      return { points: 0, name: "" };
  }
}

export function scoreLineClear(input: ClearScoreInput): ClearScoreResult {
  const { linesCleared, isTSpin, isMini, level, combo, backToBackActive } = input;
  const { points: base, name } = baseLineClearPoints(linesCleared, isTSpin, isMini);

  const isDifficult = linesCleared === 4 || isTSpin;
  let points = base * level;

  if (isDifficult && backToBackActive) {
    points = Math.floor(points * SCORE_BACK_TO_BACK_MULTIPLIER);
  }

  if (linesCleared > 0 && combo > 0) {
    points += SCORE_COMBO_BASE * combo * level;
  }

  return { points, isDifficult, clearName: name };
}
