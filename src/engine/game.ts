import {
  BOARD_COLS,
  BOARD_ROWS_HIDDEN,
  LINES_PER_LEVEL,
  LOCK_DELAY_HARD_CAP_MS,
  LOCK_DELAY_MAX_RESETS,
  LOCK_DELAY_MS,
  NEXT_QUEUE_SIZE,
  SCORE_HARD_DROP_PER_CELL,
  SCORE_SOFT_DROP_PER_CELL,
  START_LEVEL,
} from "../config";
import { ActivePiece, LineClearResult, PieceType } from "../types";
import { Board } from "./board";
import { dropIntervalMs } from "./gravity";
import { getKicks, getShapeSize, SevenBag } from "./pieces";
import { ClearScoreResult, scoreLineClear } from "./scoring";
import { detectTSpin } from "./tspin";

export interface GameCallbacks {
  onMove?: () => void;
  onRotate?: () => void;
  onSoftDropTick?: () => void;
  onHardDrop?: (distance: number) => void;
  onLock?: () => void;
  onHold?: () => void;
  onLineClear?: (result: LineClearResult, score: ClearScoreResult) => void;
  onLevelUp?: (level: number) => void;
  onGameOver?: () => void;
}

export class Game {
  readonly board = new Board();
  private bag = new SevenBag();

  current: ActivePiece | null = null;
  holdType: PieceType | null = null;
  canHold = true;

  score = 0;
  level = START_LEVEL;
  lines = 0;
  gameOver = false;

  private comboCount = -1;
  private backToBackActive = false;

  private lastActionWasRotation = false;
  private lastKickIndexUsed = -1;

  private lockDelayElapsed = 0;
  private resetsUsed = 0;
  private totalGroundTimeMs = 0;
  private gravityAccumulator = 0;

  constructor(private callbacks: GameCallbacks = {}) {
    this.spawnNext();
  }

  reset(): void {
    this.board.reset();
    this.bag = new SevenBag();
    this.holdType = null;
    this.canHold = true;
    this.score = 0;
    this.level = START_LEVEL;
    this.lines = 0;
    this.gameOver = false;
    this.comboCount = -1;
    this.backToBackActive = false;
    this.spawnNext();
  }

  nextPieces(): PieceType[] {
    return this.bag.peek(NEXT_QUEUE_SIZE);
  }

  getGhostPiece(): ActivePiece | null {
    if (!this.current) return null;
    const dist = this.board.dropDistance(this.current);
    return { ...this.current, row: this.current.row + dist };
  }

  // ---- Player actions -------------------------------------------------------

  moveLeft(): void {
    if (this.tryMove(-1)) this.callbacks.onMove?.();
  }

  moveRight(): void {
    if (this.tryMove(1)) this.callbacks.onMove?.();
  }

  rotateCW(): void {
    if (this.tryRotate(1)) this.callbacks.onRotate?.();
  }

  rotateCCW(): void {
    if (this.tryRotate(-1)) this.callbacks.onRotate?.();
  }

  hardDrop(): void {
    if (!this.current || this.gameOver) return;
    const dist = this.board.dropDistance(this.current);
    this.current = { ...this.current, row: this.current.row + dist };
    this.score += dist * SCORE_HARD_DROP_PER_CELL;
    this.callbacks.onHardDrop?.(dist);
    this.lockCurrentPiece();
  }

  hold(): void {
    if (!this.canHold || !this.current || this.gameOver) return;
    const currentType = this.current.type;
    const incomingType = this.holdType ?? this.bag.next();
    this.holdType = currentType;
    this.spawnPiece(incomingType);
    this.canHold = false;
    this.clearLockState();
    this.callbacks.onHold?.();
  }

  /** Advances the simulation by dtMs. softDropHeld accelerates gravity + scores. */
  update(dtMs: number, softDropHeld: boolean): void {
    if (!this.current || this.gameOver) return;

    const grounded = !this.board.isValidPosition({ ...this.current, row: this.current.row + 1 });

    if (grounded) {
      this.lockDelayElapsed += dtMs;
      this.totalGroundTimeMs += dtMs;
      if (this.lockDelayElapsed >= LOCK_DELAY_MS || this.totalGroundTimeMs >= LOCK_DELAY_HARD_CAP_MS) {
        this.lockCurrentPiece();
      }
      return;
    }

    this.totalGroundTimeMs = 0;
    const baseInterval = dropIntervalMs(this.level);
    const effectiveInterval = softDropHeld ? baseInterval / 20 : baseInterval;
    this.gravityAccumulator += dtMs;

    while (this.gravityAccumulator >= effectiveInterval) {
      this.gravityAccumulator -= effectiveInterval;
      const moved = this.tryMove(0, 1);
      if (!moved) {
        this.gravityAccumulator = 0;
        break;
      }
      if (softDropHeld) {
        this.score += SCORE_SOFT_DROP_PER_CELL;
        this.callbacks.onSoftDropTick?.();
      }
    }
  }

  // ---- Internals --------------------------------------------------------------

  private tryMove(dCol: number, dRow = 0): boolean {
    if (!this.current) return false;
    const candidate: ActivePiece = { ...this.current, row: this.current.row + dRow, col: this.current.col + dCol };
    if (!this.board.isValidPosition(candidate)) return false;
    this.current = candidate;
    this.lastActionWasRotation = false;
    this.lastKickIndexUsed = -1;
    this.onSuccessfulAction();
    return true;
  }

  private tryRotate(dir: 1 | -1): boolean {
    if (!this.current) return false;
    const from = this.current.rotation;
    const to = ((from + dir + 4) % 4) as 0 | 1 | 2 | 3;
    const kicks = getKicks(this.current.type, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      const candidate: ActivePiece = {
        ...this.current,
        rotation: to,
        row: this.current.row - ky,
        col: this.current.col + kx,
      };
      if (this.board.isValidPosition(candidate)) {
        this.current = candidate;
        this.lastActionWasRotation = true;
        this.lastKickIndexUsed = i;
        this.onSuccessfulAction();
        return true;
      }
    }
    return false;
  }

  private onSuccessfulAction(): void {
    if (!this.current) return;
    const grounded = !this.board.isValidPosition({ ...this.current, row: this.current.row + 1 });
    if (grounded && this.resetsUsed < LOCK_DELAY_MAX_RESETS) {
      this.lockDelayElapsed = 0;
      this.resetsUsed++;
    }
  }

  private clearLockState(): void {
    this.lockDelayElapsed = 0;
    this.resetsUsed = 0;
    this.totalGroundTimeMs = 0;
    this.gravityAccumulator = 0;
    this.lastActionWasRotation = false;
    this.lastKickIndexUsed = -1;
  }

  private lockCurrentPiece(): void {
    if (!this.current) return;
    const piece = this.current;
    const tspin = detectTSpin(this.board, piece, this.lastActionWasRotation, this.lastKickIndexUsed);
    this.board.lockPiece(piece);
    this.callbacks.onLock?.();

    const fullRows = this.board.findFullRows();

    if (fullRows.length > 0) {
      this.board.clearRows(fullRows);
      this.lines += fullRows.length;
      const newLevel = START_LEVEL + Math.floor(this.lines / LINES_PER_LEVEL);
      const leveledUp = newLevel > this.level;
      this.level = newLevel;
      this.comboCount = this.comboCount < 0 ? 0 : this.comboCount + 1;

      const result = scoreLineClear({
        linesCleared: fullRows.length,
        isTSpin: tspin.isTSpin,
        isMini: tspin.isMini,
        level: this.level,
        combo: this.comboCount,
        backToBackActive: this.backToBackActive,
      });
      this.score += result.points;
      this.backToBackActive = result.isDifficult;

      this.callbacks.onLineClear?.(
        { linesCleared: fullRows.length, clearedRows: fullRows, isTSpin: tspin.isTSpin, isTSpinMini: tspin.isMini },
        result
      );
      if (leveledUp) this.callbacks.onLevelUp?.(this.level);
    } else {
      this.comboCount = -1;
      if (tspin.isTSpin) {
        // A T-Spin that clears no lines still scores and preserves back-to-back.
        const result = scoreLineClear({
          linesCleared: 0,
          isTSpin: true,
          isMini: tspin.isMini,
          level: this.level,
          combo: 0,
          backToBackActive: this.backToBackActive,
        });
        this.score += result.points;
        this.backToBackActive = true;
        this.callbacks.onLineClear?.(
          { linesCleared: 0, clearedRows: [], isTSpin: true, isTSpinMini: tspin.isMini },
          result
        );
      }
    }

    this.spawnNext();
  }

  private spawnNext(): void {
    const type = this.bag.next();
    this.spawnPiece(type);
    this.canHold = true;
    this.clearLockState();
  }

  private spawnPiece(type: PieceType): void {
    const size = getShapeSize(type);
    const row = BOARD_ROWS_HIDDEN - 2;
    const col = Math.floor((BOARD_COLS - size) / 2);
    const piece: ActivePiece = { type, rotation: 0, row, col };
    this.current = piece;
    if (!this.board.isValidPosition(piece)) {
      this.gameOver = true;
      this.current = piece; // leave it visible, overlapping, for the game-over render
      this.callbacks.onGameOver?.();
    }
  }
}
