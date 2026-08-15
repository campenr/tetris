import { HIGH_SCORE_INITIALS_LENGTH } from "./config";
import { Game, GameCallbacks } from "./engine/game";
import { InputController } from "./input";
import { Sfx } from "./audio/sfx";
import { Music } from "./audio/music";
import { resumeAudioContext } from "./audio/context";
import { createGL, fitCanvasToWindow } from "./render/gl";
import { Renderer } from "./render/renderer";
import { drawFrame, FlowState, HIGH_SCORE_LETTER_CHARSET } from "./render/scene";
import { loadHighScores, qualifiesForHighScore, submitHighScore } from "./storage/highscores";
import { GameScreen } from "./types";

function main(): void {
  const canvas = document.getElementById("screen") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Canvas element #screen not found.");

  const gl = createGL(canvas);
  const renderer = new Renderer(gl);
  const sfx = new Sfx();
  const music = new Music();

  const gameCallbacks: GameCallbacks = {
    onMove: () => sfx.play("move"),
    onRotate: () => sfx.play("rotate"),
    onSoftDropTick: () => sfx.play("softDropTick"),
    onHardDrop: () => sfx.play("hardDrop"),
    onLock: () => sfx.play("lock"),
    onHold: () => sfx.play("hold"),
    onLineClear: (result, score) => {
      if (result.linesCleared === 4) sfx.play("lineClearTetris");
      else if (result.linesCleared === 3) sfx.play("lineClearTriple");
      else if (result.linesCleared === 2) sfx.play("lineClearDouble");
      else if (result.linesCleared === 1) sfx.play("lineClearSingle");
      else if (result.isTSpin) sfx.play("lineClearSingle");
      if (score.clearName) {
        flow.message = { text: score.clearName, timerMs: 1200 };
      }
    },
    onLevelUp: () => sfx.play("levelUp"),
    onGameOver: () => {
      sfx.play("gameOver");
      const g = flow.game;
      if (qualifiesForHighScore(g.score)) {
        flow.entry = {
          initials: new Array(HIGH_SCORE_INITIALS_LENGTH).fill("A"),
          slotIndex: 0,
          pendingScore: g.score,
          pendingLevel: g.level,
          pendingLines: g.lines,
        };
        flow.screen = GameScreen.HIGH_SCORE_ENTRY;
      } else {
        flow.screen = GameScreen.GAME_OVER;
      }
    },
  };

  const flow: FlowState = {
    screen: GameScreen.TITLE,
    game: new Game(gameCallbacks),
    highScores: loadHighScores(),
    entry: null,
    message: null,
    muted: false,
    blinkMs: 0,
  };

  function startNewGame(): void {
    flow.game = new Game(gameCallbacks);
    flow.screen = GameScreen.PLAYING;
    flow.message = null;
    flow.entry = null;
  }

  function cycleLetter(dir: number): void {
    const entry = flow.entry;
    if (!entry) return;
    const charset = HIGH_SCORE_LETTER_CHARSET;
    let idx = charset.indexOf(entry.initials[entry.slotIndex]);
    if (idx < 0) idx = 0;
    idx = (idx + dir + charset.length) % charset.length;
    entry.initials[entry.slotIndex] = charset[idx];
    sfx.play("menuMove");
  }

  function confirmHighScoreEntry(): void {
    const entry = flow.entry;
    if (!entry) return;
    if (entry.slotIndex < HIGH_SCORE_INITIALS_LENGTH - 1) {
      entry.slotIndex++;
      sfx.play("menuConfirm");
      return;
    }
    const saved = submitHighScore({
      initials: entry.initials.join(""),
      score: entry.pendingScore,
      level: entry.pendingLevel,
      lines: entry.pendingLines,
      date: new Date().toISOString().slice(0, 10),
    });
    flow.highScores = saved;
    flow.entry = null;
    flow.screen = GameScreen.HIGH_SCORE_TABLE;
    sfx.play("highScore");
  }

  const input = new InputController({
    onAnyKey: (e) => {
      resumeAudioContext();
      music.start();
      switch (flow.screen) {
        case GameScreen.TITLE:
          startNewGame();
          break;
        case GameScreen.GAME_OVER:
          if (e.code !== "KeyR") flow.screen = GameScreen.TITLE;
          break;
        case GameScreen.HIGH_SCORE_TABLE:
          flow.screen = GameScreen.TITLE;
          break;
        case GameScreen.HIGH_SCORE_ENTRY:
          if (e.code === "ArrowUp") cycleLetter(1);
          else if (e.code === "ArrowDown") cycleLetter(-1);
          else if (e.code === "ArrowLeft") {
            const entry = flow.entry;
            if (entry && entry.slotIndex > 0) {
              entry.slotIndex--;
              sfx.play("menuMove");
            }
          } else if (e.code === "ArrowRight") {
            const entry = flow.entry;
            if (entry && entry.slotIndex < HIGH_SCORE_INITIALS_LENGTH - 1) {
              entry.slotIndex++;
              sfx.play("menuMove");
            }
          } else if (e.code === "Enter") {
            confirmHighScoreEntry();
          }
          break;
        default:
          break;
      }
    },
    onMoveLeft: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.moveLeft();
    },
    onMoveRight: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.moveRight();
    },
    onRotateCW: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.rotateCW();
    },
    onRotateCCW: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.rotateCCW();
    },
    onHardDrop: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.hardDrop();
    },
    onHold: () => {
      if (flow.screen === GameScreen.PLAYING) flow.game.hold();
    },
    onPause: () => {
      if (flow.screen === GameScreen.PLAYING) flow.screen = GameScreen.PAUSED;
      else if (flow.screen === GameScreen.PAUSED) flow.screen = GameScreen.PLAYING;
    },
    onRestart: () => {
      if (flow.screen === GameScreen.GAME_OVER) startNewGame();
    },
    onMute: () => {
      flow.muted = sfx.toggleMute();
      music.setMuted(flow.muted);
    },
  });

  fitCanvasToWindow(canvas);
  window.addEventListener("resize", () => fitCanvasToWindow(canvas));

  let lastTime = performance.now();
  function frame(now: number): void {
    const dt = Math.min(50, now - lastTime);
    lastTime = now;
    flow.blinkMs += dt;

    input.update(dt);

    music.update(flow.game.level);

    if (flow.screen === GameScreen.PLAYING) {
      flow.game.update(dt, input.isSoftDropHeld());
    }

    if (flow.message) {
      flow.message.timerMs -= dt;
      if (flow.message.timerMs <= 0) flow.message = null;
    }

    drawFrame(renderer, flow);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
