export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export const ALL_PIECE_TYPES: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Rotation states 0=spawn, 1=R(CW), 2=180, 3=L(CCW)
export type RotationState = 0 | 1 | 2 | 3;

export interface GridCell {
  row: number;
  col: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: RotationState;
  row: number; // top-left of bounding box, in internal (hidden-inclusive) board rows
  col: number;
}

export type BoardCell = PieceType | null;

export enum GameScreen {
  TITLE = "TITLE",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
  HIGH_SCORE_ENTRY = "HIGH_SCORE_ENTRY",
  HIGH_SCORE_TABLE = "HIGH_SCORE_TABLE",
}

export enum LastActionType {
  NONE,
  MOVE,
  ROTATE,
  SOFT_DROP,
  HARD_DROP,
}

export interface HighScoreEntry {
  initials: string;
  score: number;
  level: number;
  lines: number;
  date: string; // ISO date, yyyy-mm-dd
}

export interface LineClearResult {
  linesCleared: number;
  clearedRows: number[];
  isTSpin: boolean;
  isTSpinMini: boolean;
}
