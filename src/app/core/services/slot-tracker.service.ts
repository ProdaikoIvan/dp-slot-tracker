import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  DEFAULT_TRACKER_INTERVAL_SECONDS,
  TrackerPersistedState,
  TrackerStatus,
} from '../models/tracker.model';
import { TrackerStorageService } from './tracker-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SlotTrackerService implements OnDestroy {
  private readonly storageService = inject(TrackerStorageService);

  readonly status = signal<TrackerStatus>('idle');
  readonly isRunning = computed(() => this.status() === 'waiting' || this.status() === 'checking');
  readonly intervalSeconds = signal<number>(DEFAULT_TRACKER_INTERVAL_SECONDS);
  readonly remainingSeconds = signal<number>(DEFAULT_TRACKER_INTERVAL_SECONDS);
  readonly foundDays = signal<string[]>([]);
  readonly lastMessage = signal<string | null>(null);
  readonly targetTabId = signal<number | null>(null);
  readonly showTabClosedModal = signal<boolean>(false);
  readonly centerName = signal<string | null>(null);
  readonly soundEnabled = signal<boolean>(true);

  private nextCheckTimestamp: number | null = null;
  private uiTickerId: ReturnType<typeof setInterval> | null = null;
  private unwatchStorage: (() => void) | null = null;

  constructor() {
    void this.loadPersistedState();
    this.sendMessage({ type: 'POPUP_OPENED' });
    this.unwatchStorage = this.storageService.watchChanges((newState) => {
      this.syncFromState(newState);
    });

    this.uiTickerId = setInterval(() => {
      if (this.isRunning() && this.nextCheckTimestamp) {
        const remaining = Math.max(0, Math.ceil((this.nextCheckTimestamp - Date.now()) / 1000));
        this.remainingSeconds.set(remaining);
        if (remaining <= 0 && this.status() === 'waiting') {
          this.sendMessage({ type: 'TIME_TO_CHECK' });
        }
      }
    }, 1000);
  }

  async start(): Promise<void> {
    if (this.isRunning()) return;

    const activeTabId = await this.getActiveTabId();
    this.targetTabId.set(activeTabId);
    this.status.set('waiting');
    this.remainingSeconds.set(this.intervalSeconds());

    this.sendMessage({
      type: 'START_TRACKER',
      targetTabId: activeTabId,
      intervalSeconds: this.intervalSeconds(),
    });
  }

  stop(): void {
    this.status.set('idle');
    this.remainingSeconds.set(this.intervalSeconds());
    this.sendMessage({ type: 'STOP_TRACKER' });
  }

  toggle(): void {
    if (this.isRunning()) {
      this.stop();
    } else {
      void this.start();
    }
  }

  setIntervalSeconds(seconds: number): void {
    this.intervalSeconds.set(seconds);
    if (!this.isRunning()) {
      this.remainingSeconds.set(seconds);
    }
    this.sendMessage({ type: 'SET_INTERVAL', intervalSeconds: seconds });
  }

  reset(): void {
    this.status.set('idle');
    this.foundDays.set([]);
    this.lastMessage.set(null);
    this.centerName.set(null);
    this.showTabClosedModal.set(false);
    this.intervalSeconds.set(DEFAULT_TRACKER_INTERVAL_SECONDS);
    this.remainingSeconds.set(DEFAULT_TRACKER_INTERVAL_SECONDS);
    this.sendMessage({ type: 'RESET_TRACKER' });
  }

  toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    this.sendMessage({ type: 'TOGGLE_SOUND' });
  }

  dismissTabClosedModal(): void {
    this.showTabClosedModal.set(false);
    this.sendMessage({ type: 'DISMISS_TAB_CLOSED_MODAL' });
  }

  private sendMessage(message: unknown): void {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(message).catch?.(() => {});
      } catch {}
    }
  }

  private async getActiveTabId(): Promise<number | null> {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  async loadPersistedState(): Promise<void> {
    const state = await this.storageService.load();
    if (state) this.syncFromState(state);
  }

  private syncFromState(state: TrackerPersistedState): void {
    if (state.intervalSeconds) this.intervalSeconds.set(state.intervalSeconds);
    this.status.set(state.status || 'idle');
    this.foundDays.set(state.foundDays || []);
    this.lastMessage.set(state.lastMessage || null);
    this.targetTabId.set(state.targetTabId || null);
    this.centerName.set(state.centerName || null);
    if (state.soundEnabled !== undefined) this.soundEnabled.set(state.soundEnabled);
    this.showTabClosedModal.set(Boolean(state.tabClosedNotice));

    this.nextCheckTimestamp = state.nextCheckTimestamp || null;

    if (state.nextCheckTimestamp && state.isRunning) {
      const remaining = Math.max(0, Math.ceil((state.nextCheckTimestamp - Date.now()) / 1000));
      this.remainingSeconds.set(remaining);
    } else if (!state.isRunning) {
      this.remainingSeconds.set(this.intervalSeconds());
    }
  }

  ngOnDestroy(): void {
    if (this.uiTickerId !== null) {
      clearInterval(this.uiTickerId);
      this.uiTickerId = null;
    }
    this.unwatchStorage?.();
  }
}
