import { ALL_PIECE_TYPES, PieceType, RotationState } from "../types";

// Each piece's 4 rotation states, expressed as [row, col] cell offsets within
// an NxN bounding box (N=4 for I/O, N=3 for the rest), per the SRS spec.
interface ShapeDef {
  size: number;
  states: readonly (readonly [number, number])[][];
}

const SHAPES: Record<PieceType, ShapeDef> = {
  I: {
    size: 4,
    states: [
      [[1, 0], [1, 1], [1, 2], [1, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 1], [1, 1], [2, 1], [3, 1]],
    ],
  },
  O: {
    size: 4,
    states: [
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [1, 2]],
    ],
  },
  T: {
    size: 3,
    states: [
      [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 1]],
      [[0, 1], [1, 0], [1, 1], [2, 1]],
    ],
  },
  S: {
    size: 3,
    states: [
      [[0, 1], [0, 2], [1, 0], [1, 1]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 1], [1, 2], [2, 0], [2, 1]],
      [[0, 0], [1, 0], [1, 1], [2, 1]],
    ],
  },
  Z: {
    size: 3,
    states: [
      [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 2], [1, 1], [1, 2], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[0, 1], [1, 0], [1, 1], [2, 0]],
    ],
  },
  J: {
    size: 3,
    states: [
      [[0, 0], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [0, 2], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 0], [2, 1]],
    ],
  },
  L: {
    size: 3,
    states: [
      [[0, 2], [1, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [1, 2], [2, 0]],
      [[0, 0], [0, 1], [1, 1], [2, 1]],
    ],
  },
};

export function getShapeSize(type: PieceType): number {
  return SHAPES[type].size;
}

export function getCells(type: PieceType, rotation: RotationState): readonly (readonly [number, number])[] {
  return SHAPES[type].states[rotation];
}

// Kick tables: keyed "fromTo" (e.g. "01" = state0 -> state1).
// Values are [x, y] offsets in "y-up" convention: apply as
// newCol = col + x; newRow = row - y.
type KickTable = Record<string, readonly (readonly [number, number])[]>;

const JLSTZ_KICKS: KickTable = {
  "01": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "10": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "12": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  "21": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  "23": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  "32": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "30": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  "03": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

const I_KICKS: KickTable = {
  "01": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "10": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "12": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  "21": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "23": [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  "32": [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  "30": [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  "03": [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

const O_KICKS: readonly (readonly [number, number])[] = [[0, 0]];

export function getKicks(type: PieceType, from: RotationState, to: RotationState): readonly (readonly [number, number])[] {
  if (type === "O") return O_KICKS;
  const key = `${from}${to}`;
  const table = type === "I" ? I_KICKS : JLSTZ_KICKS;
  return table[key] ?? [[0, 0]];
}

// Index of the "last" kick test in the JLSTZ/I tables (0-indexed: tests 0..4).
// Used by T-spin detection: a T-spin that only succeeds via this final kick
// test is always scored as a full T-Spin, never a Mini.
export const KICK_TEST_COUNT = 5;
export const LAST_KICK_TEST_INDEX = KICK_TEST_COUNT - 1;

// ---- 7-bag randomizer ------------------------------------------------------
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class SevenBag {
  private queue: PieceType[] = [];

  private refill(): void {
    this.queue.push(...shuffle([...ALL_PIECE_TYPES]));
  }

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  peek(count: number): PieceType[] {
    while (this.queue.length < count) this.refill();
    return this.queue.slice(0, count);
  }
}
