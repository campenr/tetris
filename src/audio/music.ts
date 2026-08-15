import {
  MUSIC_GAIN,
  MUSIC_MELODY,
  MUSIC_NOTE_GAP,
  MUSIC_NOTE_TYPE,
  MUSIC_SCHEDULE_AHEAD_SEC,
  MUSIC_TEMPO_BASE_BPM,
  MUSIC_TEMPO_BPM_PER_LEVEL,
  MUSIC_TEMPO_MAX_BPM,
} from "../config";
import { getAudioContext } from "./context";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteToFreq(note: string): number {
  const match = /^([A-G]#?)(\d)$/.exec(note);
  if (!match) return 0;
  const [, name, octaveStr] = match;
  const semitone = NOTE_NAMES.indexOf(name);
  const octave = parseInt(octaveStr, 10);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function tempoForLevel(level: number): number {
  const bpm = MUSIC_TEMPO_BASE_BPM + (Math.max(1, level) - 1) * MUSIC_TEMPO_BPM_PER_LEVEL;
  return Math.min(bpm, MUSIC_TEMPO_MAX_BPM);
}

export class Music {
  private muted = false;
  private playing = false;
  private nextNoteTime = 0;
  private noteIndex = 0;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  start(): void {
    const ctx = getAudioContext();
    if (!ctx || this.playing) return;
    this.playing = true;
    this.noteIndex = 0;
    this.nextNoteTime = ctx.currentTime + 0.1;
  }

  stop(): void {
    this.playing = false;
  }

  /** Call once per frame. `level` drives tempo - the tune speeds up as the game does. */
  update(level: number): void {
    if (!this.playing) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const bpm = tempoForLevel(level);
    const secondsPerBeat = 60 / bpm;

    while (this.nextNoteTime < ctx.currentTime + MUSIC_SCHEDULE_AHEAD_SEC) {
      const [note, beats] = MUSIC_MELODY[this.noteIndex % MUSIC_MELODY.length];
      const durationSec = beats * secondsPerBeat;

      if (!this.muted && note !== "R") {
        this.scheduleNote(ctx, note, this.nextNoteTime, Math.max(0.03, durationSec - MUSIC_NOTE_GAP));
      }

      this.nextNoteTime += durationSec;
      this.noteIndex++;
    }
  }

  private scheduleNote(ctx: AudioContext, note: string, startTime: number, durationSec: number): void {
    const freq = noteToFreq(note);
    if (freq <= 0) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = MUSIC_NOTE_TYPE;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(MUSIC_GAIN, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.02);
  }
}
