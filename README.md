# TETRIS for Windows (3.0-style, modern ruleset)

<img width="600" height="752" alt="image" src="https://github.com/user-attachments/assets/4a57e237-b532-4de0-a803-f7342a26b893" />

A from-scratch Tetris implementation styled after the 1990 Microsoft
Entertainment Pack "Tetris for Windows" (chunky gray 3D bevels, single
right-side stat panel, no hold box in the original - but the *ruleset* here
is the full modern Tetris Guideline standard: SRS rotation + wall kicks,
7-bag randomizer, hold, ghost piece, 3-piece next queue, lock delay,
T-Spin detection, combo/back-to-back scoring, and the standard guideline
gravity curve.

Everything renders through raw WebGL (no framework, no libraries) at a
fixed 256x320 internal resolution, upscaled with nearest-neighbor filtering
for crisp chunky pixels at any window size. Text uses a hand-baked 8x8
bitmap font atlas - a single texture shared by both the flat-color bevels
and all on-screen text. Sound effects are synthesized live with the Web
Audio API - there are no image or audio asset files anywhere in this
project.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (only needed to *build* the game -
  the finished game itself is plain HTML/JS/WebGL with zero runtime
  dependencies).

## Build & run

```bash
npm install     # installs esbuild + typescript (dev-only)
npm run build    # type-checks, then bundles src/ -> dist/game.js
```

Then just open `index.html` in a browser. Double-clicking the file works
fine (everything is generated at runtime - no external assets are fetched,
so there are no `file://` CORS issues). If your browser is picky about
local files, serve the folder instead:

```bash
npm run serve    # http-server on http://localhost:8080
```

To iterate on the code with auto-rebuild on save:

```bash
npm run watch
```

To run the (small) headless engine self-tests:

```bash
npm test
```

## Controls

| Key                | Action              |
|---------------------|---------------------|
| Left / Right arrow  | Move                |
| Down arrow (hold)   | Soft drop           |
| Up arrow / X        | Rotate clockwise    |
| Z                    | Rotate counter-clockwise |
| Space                | Hard drop           |
| C / Shift            | Hold                |
| P / Escape           | Pause               |
| R                     | Restart (on Game Over) |
| M                     | Mute                |

There's no rebind UI or settings menu by design - everything is
keyboard-driven, and the pause screen lists the bindings above.

## Where to tweak things

**`src/config.ts` is the single source of truth for every tunable value**
in the game - resolution, cell size, colors, DAS/ARR/soft-drop speed, the
gravity curve, lock delay timing, the scoring table, SFX pitches/durations,
next-queue depth, and the high-score table size. Nothing gameplay-, visual-,
or audio-related is hardcoded outside that file - change a number there and
rebuild.

## Project layout

```
index.html               Page shell: sunken Win3.0-style bevel frame around the canvas
src/
  config.ts               <-- all tunable constants live here
  types.ts                 Shared types
  main.ts                    Bootstrap, screen/flow state machine, game loop
  input.ts                    Keyboard handling + DAS/ARR auto-repeat
  engine/
    pieces.ts                 SRS shapes, wall-kick tables, 7-bag randomizer
    board.ts                   Grid storage, collision, line clearing
    game.ts                     Core state machine (gravity, lock delay, hold, etc.)
    gravity.ts                    Guideline gravity curve
    scoring.ts                     Guideline scoring table
    tspin.ts                        3-corner T-Spin detection
  render/
    gl.ts                      WebGL context + integer canvas scaling
    font.ts                     Bitmap font atlas baking
    renderer.ts                   Low-level quad/text batch renderer
    scene.ts                       All screen drawing (title/board/panel/overlays)
  audio/
    sfx.ts                     Web Audio synthesized sound effects
  storage/
    highscores.ts                localStorage-backed top-10 table
test/
  *.selftest.ts             Headless engine smoke tests (run via `npm test`)
```

## Notes on the ruleset

- **T-Spins**: detected via the standard "3-corner rule" (last action must
  be a rotation; at least 3 of the T piece's 3x3 bounding-box corners must
  be occupied). The two corners the T points toward decide Mini vs. full
  T-Spin, with the usual upgrade-to-full rule when the rotation only
  succeeded via the last SRS kick test.
- **Back-to-back**: chains across consecutive Tetrises and/or T-Spin clears
  for a 1.5x bonus; broken only by an "easy" (non-Tetris, non-T-Spin) clear.
- **Combo**: +50 x combo-count x level for consecutive clearing pieces;
  broken by any piece that locks without clearing a line.
- High scores are stored in this browser's `localStorage` only - there's no
  server/account sync.
