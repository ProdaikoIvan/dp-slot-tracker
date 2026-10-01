import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class SoundNotificationService {
  private audioCtx: AudioContext | null = null;

  readonly isEnabled = signal<boolean>(this.loadInitialState());

  toggle(): boolean {
    const nextState = !this.isEnabled();
    this.isEnabled.set(nextState);
    this.persistState(nextState);

    if (nextState) {
      this.playTestBeep();
    }

    return nextState;
  }

  playSuccess(): void {
    if (!this.isEnabled()) return;
    this.playMelody([
      { freq: 587.33, duration: 0.12, delay: 0 },
      { freq: 880.0, duration: 0.15, delay: 0.12 },
      { freq: 1174.66, duration: 0.35, delay: 0.28 },
    ]);
  }

  playTestBeep(): void {
    this.playMelody([
      { freq: 659.25, duration: 0.08, delay: 0 },
      { freq: 880.0, duration: 0.15, delay: 0.09 },
    ]);
  }

  private playMelody(notes: Array<{ freq: number; duration: number; delay: number }>): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      for (const note of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        const startTime = now + note.delay;
        const endTime = startTime + note.duration;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  private loadInitialState(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.sound);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  }

  private persistState(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.sound, String(enabled));
    } catch {
      // Ignore storage errors
    }
  }
}
