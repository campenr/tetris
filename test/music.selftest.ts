import { MUSIC_MELODY, MUSIC_TEMPO_BASE_BPM, MUSIC_TEMPO_MAX_BPM } from "../src/config";
import { tempoForLevel } from "../src/audio/music";

// tempoForLevel should start at the base, increase with level, and clamp at the max.
if (tempoForLevel(1) !== MUSIC_TEMPO_BASE_BPM) {
  throw new Error(`SELFTEST FAILED: level 1 tempo should be base (${MUSIC_TEMPO_BASE_BPM}), got ${tempoForLevel(1)}`);
}
if (tempoForLevel(5) <= tempoForLevel(1)) {
  throw new Error("SELFTEST FAILED: tempo should increase with level");
}
if (tempoForLevel(999) !== MUSIC_TEMPO_MAX_BPM) {
  throw new Error(`SELFTEST FAILED: tempo should clamp at ${MUSIC_TEMPO_MAX_BPM}, got ${tempoForLevel(999)}`);
}
console.log("tempo levels 1/5/10/20/999:", [1, 5, 10, 20, 999].map(tempoForLevel));

// Every melody entry should be a valid note name (or rest "R") with a positive duration.
const noteRe = /^([A-G]#?\d)$/;
for (const [note, beats] of MUSIC_MELODY) {
  if (note !== "R" && !noteRe.test(note)) {
    throw new Error(`SELFTEST FAILED: malformed note "${note}"`);
  }
  if (!(beats > 0)) {
    throw new Error(`SELFTEST FAILED: non-positive duration for note "${note}": ${beats}`);
  }
}
console.log("melody entries:", MUSIC_MELODY.length, "all well-formed");

console.log("\nSELFTEST (music) OK");
