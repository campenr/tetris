import { BOARD_COLS, BOARD_ROWS_TOTAL } from "../src/config";
import { Board } from "../src/engine/board";
import { detectTSpin } from "../src/engine/tspin";
import { ActivePiece } from "../src/types";

// ---- Line clear test --------------------------------------------------------
const board = new Board();
const targetRow = BOARD_ROWS_TOTAL - 1;
for (let c = 0; c < BOARD_COLS - 1; c++) {
  board.lockPiece({ type: "I", rotation: 0, row: targetRow, col: c } as ActivePiece);
}
// the above locks piece cells per I-piece shape, not literal single cells; do it manually instead:
const board2 = new Board();
for (let c = 0; c < BOARD_COLS; c++) {
  // hack: directly exercise lockPiece by way of single-cell "O"-like placement is awkward;
  // instead verify via findFullRows/clearRows using the private grid indirectly through lockPiece calls
}

// Simpler: use the public API only. Build a board manually via repeated single O-piece locks
// shifted across columns is awkward given O is 2-wide; instead assert clearRows/findFullRows
// behave correctly using a controlled sequence of I-piece (horizontal, 4-wide) placements.
const b = new Board();
for (let startCol = 0; startCol < BOARD_COLS; startCol += 4) {
  b.lockPiece({ type: "I", rotation: 0, row: targetRow - 1, col: startCol } as ActivePiece);
}
const full = b.findFullRows();
console.log("full rows found:", full);
if (full.length !== 1 || full[0] !== targetRow) {
  throw new Error(`SELFTEST FAILED: expected exactly row ${targetRow} full, got ${JSON.stringify(full)}`);
}
b.clearRows(full);
const afterClear = b.findFullRows();
if (afterClear.length !== 0) throw new Error("SELFTEST FAILED: row should be empty after clear");
console.log("line clear mechanics OK");

// ---- T-spin corner detection test -------------------------------------------
// Build a board where a T piece at rotation 1 (pointing right) sitting in a
// pocket has 3 of its 4 bounding-box corners occupied, with both "front"
// corners (top-right, bottom-right for facing-right) occupied -> full T-Spin.
const tBoard = new Board();
const pr = 10;
const pc = 4;
// Fill all 4 corners of the 3x3 box around (pr,pc).
const corners: [number, number][] = [
  [pr, pc],
  [pr, pc + 2],
  [pr + 2, pc],
  [pr + 2, pc + 2],
];
for (const [r, c] of corners) {
  tBoard.lockPiece({ type: "O", rotation: 0, row: r, col: c - 1 } as ActivePiece); // O covers (r,c-1..c) etc, close enough to occupy (r,c)
}
const tPiece: ActivePiece = { type: "T", rotation: 1, row: pr, col: pc };
const result = detectTSpin(tBoard, tPiece, true, 2);
console.log("t-spin result:", result);
if (!result.isTSpin) throw new Error("SELFTEST FAILED: expected a T-spin to be detected");

console.log("SELFTEST2 OK");
