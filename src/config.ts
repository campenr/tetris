// ============================================================================
// CENTRAL CONFIG
// Every tunable value in the game lives here. Nothing gameplay/visual/audio
// related should be hardcoded elsewhere - import from this module instead.
// ============================================================================

// ---- Internal render resolution -------------------------------------------
export const CELL_SIZE = 16; // px, at native internal resolution
export const BOARD_COLS = 10;
export const BOARD_ROWS_VISIBLE = 20;
export const BOARD_ROWS_HIDDEN = 4; // buffer rows above the visible field
export const BOARD_ROWS_TOTAL = BOARD_ROWS_VISIBLE + BOARD_ROWS_HIDDEN;

export const BOARD_PX_WIDTH = BOARD_COLS * CELL_SIZE; // 160
export const BOARD_PX_HEIGHT = BOARD_ROWS_VISIBLE * CELL_SIZE; // 320

export const PANEL_WIDTH = 96; // px, right-side stat panel
export const SCREEN_WIDTH = BOARD_PX_WIDTH + PANEL_WIDTH; // 256
export const SCREEN_HEIGHT = BOARD_PX_HEIGHT; // 320

export const BOARD_ORIGIN_X = 0;
export const BOARD_ORIGIN_Y = 0;
export const PANEL_ORIGIN_X = BOARD_PX_WIDTH;
export const PANEL_ORIGIN_Y = 0;

// ---- Font -------------------------------------------------------------------
export const FONT_GLYPH_W = 8;
export const FONT_GLYPH_H = 8;

// ---- Win 3.0 gray bevel palette ---------------------------------------------
export const COLOR_FACE = [0xc0, 0xc0, 0xc0] as const; // base gray
export const COLOR_LIGHT = [0xff, 0xff, 0xff] as const; // raised highlight / sunken shadow-side
export const COLOR_SHADOW = [0x80, 0x80, 0x80] as const; // raised shadow / sunken highlight-side
export const COLOR_DARK = [0x00, 0x00, 0x00] as const; // outermost dark edge
export const COLOR_BOARD_BG = [0x00, 0x00, 0x00] as const;
export const COLOR_GRID_LINE = [0x1a, 0x1a, 0x1a] as const;
export const COLOR_TEXT = [0x00, 0x00, 0x00] as const;
export const COLOR_TEXT_LIGHT = [0xff, 0xff, 0xff] as const;
export const COLOR_TITLEBAR_TEXT = [0xff, 0xff, 0xff] as const;
export const COLOR_GHOST_ALPHA = 0.35;

// Modern guideline piece colors (not period-accurate - chosen deliberately)
export const PIECE_COLORS: Record<string, readonly [number, number, number]> = {
  I: [0x00, 0xf0, 0xf0],
  O: [0xf0, 0xf0, 0x00],
  T: [0xa0, 0x00, 0xf0],
  S: [0x00, 0xf0, 0x00],
  Z: [0xf0, 0x00, 0x00],
  J: [0x00, 0x00, 0xf0],
  L: [0xf0, 0xa0, 0x00],
};

// ---- Movement feel ------------------------------------------------------
export const DAS_MS = 150; // delay before auto-repeat kicks in
export const ARR_MS = 30; // auto-repeat interval once DAS elapses
export const SOFT_DROP_FACTOR = 20; // multiplier over normal gravity speed

// ---- Lock delay -----------------------------------------------------------
export const LOCK_DELAY_MS = 500;
export const LOCK_DELAY_MAX_RESETS = 15; // moves/rotates allowed to reset the timer
export const LOCK_DELAY_HARD_CAP_MS = 5000; // absolute cap regardless of resets

// ---- Gravity (standard Tetris Guideline curve) -----------------------------
// dropIntervalSeconds(level) = (GRAVITY_BASE - (level-1)*GRAVITY_STEP) ^ (level-1)
// Tuneable so the curve can be softened/steepened without touching game code.
export const GRAVITY_BASE = 0.8;
export const GRAVITY_STEP = 0.007;
export const GRAVITY_MIN_INTERVAL_MS = 16; // effectively 20G floor
export const GRAVITY_MAX_LEVEL_FOR_CURVE = 20; // beyond this, use the floor

// ---- Level progression ------------------------------------------------------
export const LINES_PER_LEVEL = 10;
export const START_LEVEL = 1;

// ---- Scoring (standard Tetris Guideline table) -----------------------------
export const SCORE_SINGLE = 100;
export const SCORE_DOUBLE = 300;
export const SCORE_TRIPLE = 500;
export const SCORE_TETRIS = 800;
export const SCORE_TSPIN_MINI = 100;
export const SCORE_TSPIN_MINI_SINGLE = 200;
export const SCORE_TSPIN = 400;
export const SCORE_TSPIN_SINGLE = 800;
export const SCORE_TSPIN_DOUBLE = 1200;
export const SCORE_TSPIN_TRIPLE = 1600;
export const SCORE_SOFT_DROP_PER_CELL = 1;
export const SCORE_HARD_DROP_PER_CELL = 2;
export const SCORE_COMBO_BASE = 50;
export const SCORE_BACK_TO_BACK_MULTIPLIER = 1.5;

// ---- Queue / hold -----------------------------------------------------------
export const NEXT_QUEUE_SIZE = 3;

// ---- High scores --------------------------------------------------------
export const HIGH_SCORE_MAX_ENTRIES = 10;
export const HIGH_SCORE_INITIALS_LENGTH = 3;
export const HIGH_SCORE_STORAGE_KEY = "win31tetris.highscores.v1";
export const HIGH_SCORE_LETTER_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

// ---- Audio (Web Audio synthesized SFX; all values in Hz / ms / gain) -------
export const SFX_MASTER_GAIN = 0.25;
export const SFX = {
  move: { freq: 220, durationMs: 30, type: "square" as OscillatorType, gain: 0.5 },
  rotate: { freq: 330, durationMs: 40, type: "square" as OscillatorType, gain: 0.5 },
  softDropTick: { freq: 150, durationMs: 15, type: "square" as OscillatorType, gain: 0.3 },
  hardDrop: { freq: 90, durationMs: 80, type: "square" as OscillatorType, gain: 0.8 },
  lock: { freq: 180, durationMs: 50, type: "square" as OscillatorType, gain: 0.5 },
  hold: { freq: 260, durationMs: 40, type: "triangle" as OscillatorType, gain: 0.5 },
  lineClearSingle: { freq: 440, durationMs: 120, type: "square" as OscillatorType, gain: 0.7 },
  lineClearDouble: { freq: 523, durationMs: 140, type: "square" as OscillatorType, gain: 0.7 },
  lineClearTriple: { freq: 659, durationMs: 160, type: "square" as OscillatorType, gain: 0.75 },
  lineClearTetris: { freq: 880, durationMs: 260, type: "square" as OscillatorType, gain: 0.85 },
  levelUp: { freq: 660, durationMs: 200, type: "triangle" as OscillatorType, gain: 0.7 },
  gameOver: { freq: 110, durationMs: 500, type: "sawtooth" as OscillatorType, gain: 0.7 },
  highScore: { freq: 990, durationMs: 300, type: "triangle" as OscillatorType, gain: 0.8 },
  menuMove: { freq: 300, durationMs: 25, type: "square" as OscillatorType, gain: 0.4 },
  menuConfirm: { freq: 500, durationMs: 60, type: "square" as OscillatorType, gain: 0.6 },
};

// ---- Background music -------------------------------------------------------
// Synthesized (not an audio file) for the same reason the SFX are - keeps
// the project asset-free. The melody is "Korobeiniki", an 1861 Russian folk
// tune in the public domain (the same melody used in the famous Tetris
// arrangement); it's hand-transcribed here as plain note/duration data so
// it's trivially tweakable. Durations are in beats; tempo (beats/minute) is
// what actually sets the pace, and speeds up with level for the classic
// "getting frantic" effect.
export const MUSIC_NOTE_TYPE: OscillatorType = "square";
export const MUSIC_GAIN = 0.16; // kept well under SFX_MASTER_GAIN so SFX still cut through
export const MUSIC_NOTE_GAP = 0.02; // seconds of silence between notes, for articulation
export const MUSIC_TEMPO_BASE_BPM = 144;
export const MUSIC_TEMPO_BPM_PER_LEVEL = 4;
export const MUSIC_TEMPO_MAX_BPM = 300;
export const MUSIC_SCHEDULE_AHEAD_SEC = 0.75; // how far ahead of "now" notes get queued

// "R" = rest (silence). Durations: 1 = quarter note at the current tempo.
export const MUSIC_MELODY: readonly [string, number][] = [
  ["E5", 1], ["B4", 0.5], ["C5", 0.5], ["D5", 1], ["C5", 0.5], ["B4", 0.5],
  ["A4", 1], ["A4", 0.5], ["C5", 0.5], ["E5", 1], ["D5", 0.5], ["C5", 0.5],
  ["B4", 1.5], ["C5", 0.5], ["D5", 1], ["E5", 1],
  ["C5", 1], ["A4", 1], ["A4", 1], ["R", 1],

  ["D5", 1], ["F5", 0.5], ["A5", 1], ["G5", 0.5], ["F5", 0.5],
  ["E5", 1.5], ["C5", 0.5], ["E5", 1], ["D5", 0.5], ["C5", 0.5],
  ["B4", 1.5], ["B4", 0.5], ["C5", 0.5], ["D5", 1],
  ["E5", 1],
  ["C5", 1], ["A4", 1], ["A4", 1], ["R", 1],
];

// ---- Keybinds ----------------------------------------------------------
export const KEYBINDS = {
  moveLeft: ["ArrowLeft"],
  moveRight: ["ArrowRight"],
  softDrop: ["ArrowDown"],
  rotateCW: ["ArrowUp", "KeyX"],
  rotateCCW: ["KeyZ"],
  hardDrop: ["Space"],
  hold: ["KeyC", "ShiftLeft", "ShiftRight"],
  pause: ["KeyP", "Escape"],
  restart: ["KeyR"],
  mute: ["KeyM"],
};

// ---- Canvas scaling ----------------------------------------------------
export const MIN_INTEGER_SCALE = 1;
