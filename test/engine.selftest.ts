import { Game } from "../src/engine/game";

let lockCount = 0;
let clearCount = 0;
let gameOverFired = false;

const game = new Game({
  onLock: () => lockCount++,
  onLineClear: (result, score) => {
    clearCount++;
    console.log("line clear:", result.linesCleared, score.clearName, score.points);
  },
  onGameOver: () => {
    gameOverFired = true;
  },
});

// Drive a bunch of hard drops and rotations to exercise the pipeline.
for (let i = 0; i < 500 && !game.gameOver; i++) {
  game.rotateCW();
  if (i % 3 === 0) game.moveLeft();
  if (i % 5 === 0) game.moveRight();
  if (i % 7 === 0) game.hold();
  game.hardDrop();
}

console.log("locks:", lockCount, "clears:", clearCount, "score:", game.score, "level:", game.level, "lines:", game.lines);
console.log("gameOver:", game.gameOver, "fired:", gameOverFired);

if (lockCount === 0) throw new Error("SELFTEST FAILED: no pieces ever locked");
if (!game.gameOver) throw new Error("SELFTEST FAILED: expected game over after 500 hard drops with no clearing strategy");
console.log("SELFTEST OK");
