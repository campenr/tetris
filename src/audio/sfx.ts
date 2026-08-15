import { SFX, SFX_MASTER_GAIN } from "../config";
import { getAudioContext } from "./context";

type SfxName = keyof typeof SFX;

export class Sfx {
  private muted = false;

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  play(name: SfxName): void {
    if (this.muted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const def = SFX[name];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = def.type;
    osc.frequency.setValueAtTime(def.freq, ctx.currentTime);

    // A slight downward glide on longer tones for a period-appropriate "blip" feel.
    if (def.durationMs > 100) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, def.freq * 0.6), ctx.currentTime + def.durationMs / 1000);
    }

    const peak = def.gain * SFX_MASTER_GAIN;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + def.durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + def.durationMs / 1000 + 0.02);
  }
}
