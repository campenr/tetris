import {
  BOARD_COLS,
  BOARD_ORIGIN_X,
  BOARD_ORIGIN_Y,
  BOARD_PX_HEIGHT,
  BOARD_PX_WIDTH,
  BOARD_ROWS_HIDDEN,
  CELL_SIZE,
  COLOR_BOARD_BG,
  COLOR_GHOST_ALPHA,
  COLOR_GRID_LINE,
  COLOR_TEXT,
  COLOR_TEXT_LIGHT,
  HIGH_SCORE_INITIALS_LENGTH,
  HIGH_SCORE_LETTER_CHARSET,
  PANEL_ORIGIN_X,
  PIECE_COLORS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
} from "../config";
import { Game } from "../engine/game";
import { getCells } from "../engine/pieces";
import { ActivePiece, GameScreen, HighScoreEntry, PieceType } from "../types";
import { Renderer } from "./renderer";

export interface Message {
  text: string;
  timerMs: number;
}

export interface HighScoreEntryState {
  initials: string[]; // length HIGH_SCORE_INITIALS_LENGTH
  slotIndex: number;
  pendingScore: number;
  pendingLevel: number;
  pendingLines: number;
}

export interface FlowState {
  screen: GameScreen;
  game: Game;
  highScores: HighScoreEntry[];
  entry: HighScoreEntryState | null;
  message: Message | null;
  muted: boolean;
  blinkMs: number;
}

function padScore(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(8, "0");
}

function drawMiniPiece(r: Renderer, boxX: number, boxY: number, boxW: number, boxH: number, type: PieceType | null, scale: number): void {
  if (!type) return;
  const cells = getCells(type, 0);
  let minR = Infinity;
  let maxR = -Infinity;
  let minC = Infinity;
  let maxC = -Infinity;
  for (const [cr, cc] of cells) {
    minR = Math.min(minR, cr);
    maxR = Math.max(maxR, cr);
    minC = Math.min(minC, cc);
    maxC = Math.max(maxC, cc);
  }
  const w = (maxC - minC + 1) * scale;
  const h = (maxR - minR + 1) * scale;
  const originX = boxX + (boxW - w) / 2 - minC * scale;
  const originY = boxY + (boxH - h) / 2 - minR * scale;
  const color = PIECE_COLORS[type];
  for (const [cr, cc] of cells) {
    r.block(originX + cc * scale, originY + cr * scale, scale, color);
  }
}

function drawBoard(r: Renderer, game: Game, blinkMs: number): void {
  r.solid(BOARD_ORIGIN_X, BOARD_ORIGIN_Y, BOARD_PX_WIDTH, BOARD_PX_HEIGHT, COLOR_BOARD_BG);

  for (let c = 1; c < BOARD_COLS; c++) {
    r.solid(BOARD_ORIGIN_X + c * CELL_SIZE, BOARD_ORIGIN_Y, 1, BOARD_PX_HEIGHT, COLOR_GRID_LINE);
  }
  for (let row = 1; row < BOARD_PX_HEIGHT / CELL_SIZE; row++) {
    r.solid(BOARD_ORIGIN_X, BOARD_ORIGIN_Y + row * CELL_SIZE, BOARD_PX_WIDTH, 1, COLOR_GRID_LINE);
  }

  game.board.forEachFilledCell((row, col, type) => {
    if (row < BOARD_ROWS_HIDDEN || !type) return;
    const x = BOARD_ORIGIN_X + col * CELL_SIZE;
    const y = BOARD_ORIGIN_Y + (row - BOARD_ROWS_HIDDEN) * CELL_SIZE;
    r.block(x, y, CELL_SIZE, PIECE_COLORS[type]);
  });

  if (!game.gameOver) {
    const ghost = game.getGhostPiece();
    if (ghost) drawActivePiece(r, ghost, true);
  }

  const flashHidden = game.gameOver && Math.floor(blinkMs / 250) % 2 === 0;
  if (game.current && !flashHidden) {
    drawActivePiece(r, game.current, false);
  }
}

function drawActivePiece(r: Renderer, piece: ActivePiece, ghost: boolean): void {
  const cells = getCells(piece.type, piece.rotation);
  const color = PIECE_COLORS[piece.type];
  for (const [dr, dc] of cells) {
    const row = piece.row + dr;
    const col = piece.col + dc;
    if (row < BOARD_ROWS_HIDDEN) continue;
    const x = BOARD_ORIGIN_X + col * CELL_SIZE;
    const y = BOARD_ORIGIN_Y + (row - BOARD_ROWS_HIDDEN) * CELL_SIZE;
    r.block(x, y, CELL_SIZE, color, ghost ? COLOR_GHOST_ALPHA : 1);
  }
}

function drawPanel(r: Renderer, flow: FlowState): void {
  const px = PANEL_ORIGIN_X;
  let y = 4;
  const pad = 4;
  const innerW = SCREEN_WIDTH - PANEL_ORIGIN_X - pad * 2;

  r.text(px + pad, y, "HOLD", COLOR_TEXT, 1);
  y += 10;
  r.panelBevel(px + pad, y, innerW, 40, false);
  drawMiniPiece(r, px + pad, y, innerW, 40, flow.game.holdType, 8);
  y += 48;

  r.text(px + pad, y, "NEXT", COLOR_TEXT, 1);
  y += 10;
  const nextBoxH = 36;
  const next = flow.game.nextPieces();
  for (let i = 0; i < next.length; i++) {
    r.panelBevel(px + pad, y, innerW, nextBoxH, false);
    drawMiniPiece(r, px + pad, y, innerW, nextBoxH, next[i], 7);
    y += nextBoxH + 4;
  }
  y += 4;

  r.text(px + pad, y, "SCORE", COLOR_TEXT, 1);
  y += 10;
  r.panelBevel(px + pad, y, innerW, 16, false);
  r.text(px + pad + 2, y + 4, padScore(flow.game.score), COLOR_TEXT, 1);
  y += 24;

  r.text(px + pad, y, "LEVEL", COLOR_TEXT, 1);
  y += 10;
  r.panelBevel(px + pad, y, innerW, 16, false);
  r.text(px + pad + 2, y + 4, String(flow.game.level).padStart(3, "0"), COLOR_TEXT, 1);
  y += 24;

  r.text(px + pad, y, "LINES", COLOR_TEXT, 1);
  y += 10;
  r.panelBevel(px + pad, y, innerW, 16, false);
  r.text(px + pad + 2, y + 4, String(flow.game.lines).padStart(3, "0"), COLOR_TEXT, 1);
  y += 24;

  if (flow.message && flow.message.timerMs > 0) {
    r.textCentered(px + innerW / 2 + pad, y, flow.message.text, COLOR_TEXT, 1);
  }

  if (flow.muted) {
    r.text(px + pad, SCREEN_HEIGHT - 12, "MUTED", COLOR_TEXT, 1);
  }
}

function drawDim(r: Renderer): void {
  r.solid(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, [0, 0, 0], 0.6);
}

function centeredPanel(r: Renderer, w: number, h: number): { x: number; y: number } {
  const x = Math.round((SCREEN_WIDTH - w) / 2);
  const y = Math.round((SCREEN_HEIGHT - h) / 2);
  r.panelBevel(x, y, w, h, true);
  return { x, y };
}

function drawTitle(r: Renderer, flow: FlowState): void {
  r.solid(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, [0, 0, 0]);
  r.textCentered(SCREEN_WIDTH / 2, 60, "TETRIS", COLOR_TEXT_LIGHT, 2);
  r.textCentered(SCREEN_WIDTH / 2, 90, "FOR WINDOWS", COLOR_TEXT_LIGHT, 1);

  const topScore = flow.highScores.length > 0 ? flow.highScores[0].score : 0;
  r.textCentered(SCREEN_WIDTH / 2, 140, "TOP SCORE", COLOR_TEXT_LIGHT, 1);
  r.textCentered(SCREEN_WIDTH / 2, 152, padScore(topScore), COLOR_TEXT_LIGHT, 1);

  if (Math.floor(flow.blinkMs / 500) % 2 === 0) {
    r.textCentered(SCREEN_WIDTH / 2, 200, "PRESS ANY KEY TO START", COLOR_TEXT_LIGHT, 1);
  }

  r.textCentered(SCREEN_WIDTH / 2, 240, "ARROWS MOVE/ROTATE", COLOR_TEXT_LIGHT, 1);
  r.textCentered(SCREEN_WIDTH / 2, 250, "SPACE HARD DROP  C HOLD", COLOR_TEXT_LIGHT, 1);
  r.textCentered(SCREEN_WIDTH / 2, 260, "P PAUSE  M MUTE", COLOR_TEXT_LIGHT, 1);
}

function drawPauseOverlay(r: Renderer): void {
  drawDim(r);
  const w = 180;
  const h = 130;
  const { x, y } = centeredPanel(r, w, h);
  r.textCentered(x + w / 2, y + 10, "PAUSED", COLOR_TEXT, 1);
  const lines = [
    "ARROWS  MOVE/ROTATE",
    "Z        ROTATE CCW",
    "SPACE   HARD DROP",
    "C/SHIFT HOLD",
    "P/ESC   RESUME",
    "M       MUTE",
  ];
  lines.forEach((line, i) => r.text(x + 10, y + 30 + i * 12, line, COLOR_TEXT, 1));
}

function drawGameOverOverlay(r: Renderer, flow: FlowState): void {
  drawDim(r);
  const w = 180;
  const h = 110;
  const { x, y } = centeredPanel(r, w, h);
  r.textCentered(x + w / 2, y + 10, "GAME OVER", COLOR_TEXT, 1);
  r.textCentered(x + w / 2, y + 30, `SCORE ${padScore(flow.game.score)}`, COLOR_TEXT, 1);
  r.textCentered(x + w / 2, y + 42, `LEVEL ${flow.game.level}  LINES ${flow.game.lines}`, COLOR_TEXT, 1);
  if (Math.floor(flow.blinkMs / 400) % 2 === 0) {
    r.textCentered(x + w / 2, y + 70, "PRESS R TO RESTART", COLOR_TEXT, 1);
  }
  r.textCentered(x + w / 2, y + 84, "ANY OTHER KEY: TITLE", COLOR_TEXT, 1);
}

function drawHighScoreEntry(r: Renderer, flow: FlowState): void {
  drawDim(r);
  const entry = flow.entry;
  if (!entry) return;
  const w = 200;
  const h = 130;
  const { x, y } = centeredPanel(r, w, h);
  r.textCentered(x + w / 2, y + 10, "NEW HIGH SCORE!", COLOR_TEXT, 1);
  r.textCentered(x + w / 2, y + 24, padScore(entry.pendingScore), COLOR_TEXT, 1);

  const letterScale = 2;
  const spacing = 24;
  const totalW = HIGH_SCORE_INITIALS_LENGTH * spacing;
  const startX = x + w / 2 - totalW / 2;
  const letterY = y + 50;

  for (let i = 0; i < HIGH_SCORE_INITIALS_LENGTH; i++) {
    const cx = startX + i * spacing + spacing / 2;
    const selected = i === entry.slotIndex;
    r.textCentered(cx, letterY, entry.initials[i], COLOR_TEXT, letterScale);
    if (selected && Math.floor(flow.blinkMs / 300) % 2 === 0) {
      r.textCentered(cx, letterY - 14, "^", COLOR_TEXT, 1);
      r.textCentered(cx, letterY + 20, "v", COLOR_TEXT, 1);
    }
  }

  r.textCentered(x + w / 2, y + h - 20, "UP/DOWN: LETTER", COLOR_TEXT, 1);
  r.textCentered(x + w / 2, y + h - 10, "LEFT/RIGHT: SLOT  ENTER: OK", COLOR_TEXT, 1);
}

function drawHighScoreTable(r: Renderer, flow: FlowState): void {
  r.solid(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, [0, 0, 0]);
  r.textCentered(SCREEN_WIDTH / 2, 16, "HIGH SCORES", COLOR_TEXT_LIGHT, 1);
  let y = 36;
  flow.highScores.slice(0, 10).forEach((entryItem, i) => {
    const rank = String(i + 1).padStart(2, "0");
    r.text(30, y, `${rank} ${entryItem.initials.padEnd(3, " ")}`, COLOR_TEXT_LIGHT, 1);
    r.text(120, y, padScore(entryItem.score), COLOR_TEXT_LIGHT, 1);
    y += 12;
  });
  if (Math.floor(flow.blinkMs / 500) % 2 === 0) {
    r.textCentered(SCREEN_WIDTH / 2, 290, "PRESS ANY KEY", COLOR_TEXT_LIGHT, 1);
  }
}

export function drawFrame(r: Renderer, flow: FlowState): void {
  r.begin();

  switch (flow.screen) {
    case GameScreen.TITLE:
      drawTitle(r, flow);
      break;
    case GameScreen.PLAYING:
      drawBoard(r, flow.game, flow.blinkMs);
      drawPanel(r, flow);
      break;
    case GameScreen.PAUSED:
      drawBoard(r, flow.game, flow.blinkMs);
      drawPanel(r, flow);
      drawPauseOverlay(r);
      break;
    case GameScreen.GAME_OVER:
      drawBoard(r, flow.game, flow.blinkMs);
      drawPanel(r, flow);
      drawGameOverOverlay(r, flow);
      break;
    case GameScreen.HIGH_SCORE_ENTRY:
      drawBoard(r, flow.game, flow.blinkMs);
      drawPanel(r, flow);
      drawHighScoreEntry(r, flow);
      break;
    case GameScreen.HIGH_SCORE_TABLE:
      drawHighScoreTable(r, flow);
      break;
    default:
      break;
  }

  r.flush();
}

export { HIGH_SCORE_LETTER_CHARSET };
