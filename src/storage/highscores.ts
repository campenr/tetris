import { HIGH_SCORE_MAX_ENTRIES, HIGH_SCORE_STORAGE_KEY } from "../config";
import { HighScoreEntry } from "../types";

function isValidEntry(x: unknown): x is HighScoreEntry {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.initials === "string" &&
    typeof e.score === "number" &&
    typeof e.level === "number" &&
    typeof e.lines === "number" &&
    typeof e.date === "string"
  );
}

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).sort((a, b) => b.score - a.score).slice(0, HIGH_SCORE_MAX_ENTRIES);
  } catch {
    return [];
  }
}

function saveHighScores(entries: HighScoreEntry[]): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) - fail silently.
  }
}

export function qualifiesForHighScore(score: number): boolean {
  const entries = loadHighScores();
  if (entries.length < HIGH_SCORE_MAX_ENTRIES) return score > 0;
  return score > entries[entries.length - 1].score;
}

export function submitHighScore(entry: HighScoreEntry): HighScoreEntry[] {
  const entries = loadHighScores();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, HIGH_SCORE_MAX_ENTRIES);
  saveHighScores(trimmed);
  return trimmed;
}

export function topScore(): number {
  const entries = loadHighScores();
  return entries.length > 0 ? entries[0].score : 0;
}
