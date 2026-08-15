let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/** Must be called from within a user-gesture handler (keydown) to satisfy autoplay policy. */
export function resumeAudioContext(): void {
  const c = getAudioContext();
  if (c && c.state === "suspended") void c.resume();
}
