import { ActivePiece } from "../types";
import { Board } from "./board";
import { LAST_KICK_TEST_INDEX } from "./pieces";

export interface TSpinResult {
  isTSpin: boolean;
  isMini: boolean;
}

const NONE: TSpinResult = { isTSpin: false, isMini: false };

// T piece bounding box corners, relative offsets (dr, dc) within the 3x3 box.
const CORNER_TL: [number, number] = [0, 0];
const CORNER_TR: [number, number] = [0, 2];
const CORNER_BL: [number, number] = [2, 0];
const CORNER_BR: [number, number] = [2, 2];

/**
 * Standard "3-corner" T-Spin rule:
 *  - Last successful action on this piece must have been a rotation.
 *  - At least 3 of the 4 corners of the T's 3x3 bounding box must be occupied
 *    (by locked blocks or the wall/floor).
 *  - If both corners on the side the T is "pointing" toward are occupied,
 *    it's a full T-Spin. Otherwise (only one front corner occupied) it's a
 *    Mini T-Spin - UNLESS the rotation succeeded via the final SRS kick
 *    test, in which case it is always upgraded to a full T-Spin.
 */
export function detectTSpin(
  board: Board,
  piece: ActivePiece,
  lastActionWasRotation: boolean,
  lastKickIndexUsed: number
): TSpinResult {
  if (piece.type !== "T" || !lastActionWasRotation) return NONE;

  const occupied = (corner: [number, number]): boolean =>
    board.isBlocked(piece.row + corner[0], piece.col + corner[1]);

  const tl = occupied(CORNER_TL);
  const tr = occupied(CORNER_TR);
  const bl = occupied(CORNER_BL);
  const br = occupied(CORNER_BR);

  const totalCorners = [tl, tr, bl, br].filter(Boolean).length;
  if (totalCorners < 3) return NONE;

  let front: [boolean, boolean];
  switch (piece.rotation) {
    case 0: // pointing up
      front = [tl, tr];
      break;
    case 1: // pointing right
      front = [tr, br];
      break;
    case 2: // pointing down
      front = [bl, br];
      break;
    default: // 3, pointing left
      front = [tl, bl];
      break;
  }

  const frontCount = front.filter(Boolean).length;
  const usedLastKick = lastKickIndexUsed === LAST_KICK_TEST_INDEX;

  if (frontCount === 2 || usedLastKick) {
    return { isTSpin: true, isMini: false };
  }
  return { isTSpin: true, isMini: true };
}
