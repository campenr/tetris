import { BOARD_COLS, BOARD_ROWS_TOTAL } from "../config";
import { ActivePiece, BoardCell } from "../types";
import { getCells } from "./pieces";

export class Board {
  readonly cols = BOARD_COLS;
  readonly rows = BOARD_ROWS_TOTAL;
  private grid: BoardCell[][];

  constructor() {
    this.grid = Board.emptyGrid();
  }

  private static emptyGrid(): BoardCell[][] {
    const g: BoardCell[][] = [];
    for (let r = 0; r < BOARD_ROWS_TOTAL; r++) {
      g.push(new Array<BoardCell>(BOARD_COLS).fill(null));
    }
    return g;
  }

  reset(): void {
    this.grid = Board.emptyGrid();
  }

  cellAt(row: number, col: number): BoardCell {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  /** True if the given [row,col] is occupied (by a locked block OR the wall/floor). */
  isBlocked(row: number, col: number): boolean {
    if (col < 0 || col >= this.cols) return true;
    if (row >= this.rows) return true;
    if (row < 0) return false; // above the board is open (spawn buffer)
    return this.grid[row][col] !== null;
  }

  worldCellsFor(piece: ActivePiece): [number, number][] {
    return getCells(piece.type, piece.rotation).map(
      ([dr, dc]) => [piece.row + dr, piece.col + dc] as [number, number]
    );
  }

  isValidPosition(piece: ActivePiece): boolean {
    for (const [r, c] of this.worldCellsFor(piece)) {
      if (this.isBlocked(r, c)) return false;
    }
    return true;
  }

  lockPiece(piece: ActivePiece): void {
    for (const [r, c] of this.worldCellsFor(piece)) {
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        this.grid[r][c] = piece.type;
      }
    }
  }

  /** Returns the row indices (0-indexed, internal grid) that are fully filled. */
  findFullRows(): number[] {
    const full: number[] = [];
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r].every((c) => c !== null)) full.push(r);
    }
    return full;
  }

  /** Removes the given rows and shifts everything above them down. */
  clearRows(rows: number[]): void {
    const rowSet = new Set(rows);
    const kept = this.grid.filter((_, idx) => !rowSet.has(idx));
    const removedCount = this.rows - kept.length;
    const newRows: BoardCell[][] = [];
    for (let i = 0; i < removedCount; i++) {
      newRows.push(new Array<BoardCell>(this.cols).fill(null));
    }
    this.grid = [...newRows, ...kept];
  }

  /** Hard drop distance in rows for the given piece (used for scoring/ghost). */
  dropDistance(piece: ActivePiece): number {
    let dist = 0;
    while (this.isValidPosition({ ...piece, row: piece.row + dist + 1 })) {
      dist++;
    }
    return dist;
  }

  forEachFilledCell(cb: (row: number, col: number, type: PieceTypeOrNull) => void): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.grid[r][c];
        if (v !== null) cb(r, c, v);
      }
    }
  }
}

type PieceTypeOrNull = BoardCell;
