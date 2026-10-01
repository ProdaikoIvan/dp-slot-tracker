import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  DEFAULT_TRACKER_INTERVAL_SECONDS,
  TrackerPersistedState,
  TrackerStatus,
} from '../models/tracker.model';
import { QueueCheckerService } from './queue-checker.service';
import { SoundNotificationService } from './sound-notification.service';
import { BadgeService } from './badge.service';
import { TrackerStorageService } from './tracker-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SlotTrackerService implements OnDestroy {
  private readonly checkerService = inject(QueueCheckerService);
  private readonly soundService = inject(SoundNotificationService);
  private readonly badgeService = inject(BadgeService);
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

  private timerId: ReturnType<typeof setInterval> | null = null;
  private isChecking = false;
  private unwatchStorage: (() => void) | null = null;

  constructor() {
    void this.loadPersistedState();
    this.unwatchStorage = this.storageService.watchChanges((newState) => {
      this.syncFromState(newState);
    });
  }

  start(): void {
    if (this.isRunning()) return;

    this.foundDays.set([]);
    this.lastMessage.set(null);
    this.showTabClosedModal.set(false);
    this.remainingSeconds.set(this.intervalSeconds());
    this.status.set('waiting');
    this.badgeService.setTimer(this.remainingSeconds());
    this.startCountdown();
    void this.savePersistedState();
    void this.initAndCheck();
  }

  private async initAndCheck(): Promise<void> {
    const activeId = await this.checkerService.getActiveTabId();
    if (!this.isRunning()) return;

    this.targetTabId.set(activeId);
    void this.savePersistedState();
    await this.performCheck();
  }

  stop(): void {
    this.stopCountdown();
    this.badgeService.clear();
    this.targetTabId.set(null);
    this.status.set('idle');
    this.remainingSeconds.set(this.intervalSeconds());
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: 'STOP_FLASHING' }).catch?.(() => {});
      } catch {}
    }
    void this.savePersistedState();
  }

  toggle(): void {
    if (this.isRunning()) {
      this.stop();
    } else {
      this.start();
    }
  }

  setIntervalSeconds(seconds: number): void {
    this.intervalSeconds.set(seconds);
    if (!this.isRunning()) {
      this.remainingSeconds.set(seconds);
    }
    void this.savePersistedState();
  }

  reset(): void {
    this.stop();
    this.foundDays.set([]);
    this.lastMessage.set(null);
    this.centerName.set(null);
    this.showTabClosedModal.set(false);
    this.intervalSeconds.set(DEFAULT_TRACKER_INTERVAL_SECONDS);
    this.remainingSeconds.set(DEFAULT_TRACKER_INTERVAL_SECONDS);
    this.badgeService.clear();
    void this.savePersistedState();
  }

  dismissTabClosedModal(): void {
    this.showTabClosedModal.set(false);
    void this.savePersistedState();
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.timerId = setInterval(() => {
      const sec = this.remainingSeconds();
      if (sec > 1) {
        const next = sec - 1;
        this.remainingSeconds.set(next);
        this.badgeService.setTimer(next);
      } else {
        this.stopCountdown();
        this.remainingSeconds.set(0);
        void this.performCheck();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private async performCheck(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      this.status.set('checking');

      const result = await this.checkerService.checkActiveTab(this.targetTabId() ?? undefined);
      if (this.status() === 'idle') return;

      if (result.success) {
        if (result.centerName) this.centerName.set(result.centerName);

        if (result.days.length > 0) {
          this.stopCountdown();
          this.remainingSeconds.set(0);
          this.foundDays.set([...result.days]);
          this.status.set('found');
          const serviceTitle = result.serviceName ? ` для «${result.serviceName}»` : '';
          this.lastMessage.set(`Знайдено вільні дати (${result.days.length})${serviceTitle}`);
          this.badgeService.setFound();
          this.soundService.playSuccess();
        } else {
          this.foundDays.set([]);
          this.status.set('waiting');
          this.lastMessage.set('Вільних дат наразі немає');
          this.remainingSeconds.set(this.intervalSeconds());
          this.badgeService.setTimer(this.remainingSeconds());
          this.startCountdown();
        }
      } else {
        this.status.set('error');
        this.lastMessage.set(result.error || 'Помилка перевірки');
        this.stopCountdown();
        this.badgeService.clear();
        this.targetTabId.set(null);
      }

      void this.savePersistedState();
    } finally {
      this.isChecking = false;
    }
  }

  private toPersistedState(): TrackerPersistedState {
    return {
      isRunning: this.isRunning(),
      status: this.status(),
      intervalSeconds: this.intervalSeconds(),
      targetTabId: this.targetTabId(),
      foundDays: this.foundDays(),
      lastMessage: this.lastMessage(),
      nextCheckTimestamp: this.isRunning() ? Date.now() + this.remainingSeconds() * 1000 : null,
      tabClosedNotice: this.showTabClosedModal(),
      centerName: this.centerName(),
    };
  }

  async savePersistedState(): Promise<void> {
    await this.storageService.save(this.toPersistedState());
  }

  async loadPersistedState(): Promise<void> {
    const state = await this.storageService.load();
    if (state) this.syncFromState(state);
  }

  private syncFromState(state: TrackerPersistedState): void {
    if (state.intervalSeconds) this.intervalSeconds.set(state.intervalSeconds);
    this.foundDays.set(state.foundDays || []);
    this.lastMessage.set(state.lastMessage || null);
    this.targetTabId.set(state.targetTabId || null);
    this.centerName.set(state.centerName || null);
    if (state.tabClosedNotice) this.showTabClosedModal.set(true);

    if (state.status === 'found') {
      this.stopCountdown();
      this.remainingSeconds.set(0);
      this.status.set('found');
      this.badgeService.setFound();
      return;
    }

    if (!state.isRunning) {
      this.stopCountdown();
      this.status.set(state.status);
      return;
    }

    if (state.nextCheckTimestamp) {
      const remainingSec = Math.max(1, Math.ceil((state.nextCheckTimestamp - Date.now()) / 1000));
      this.status.set(state.status);
      this.remainingSeconds.set(remainingSec);
      this.badgeService.setTimer(remainingSec);
      this.startCountdown();

      if (remainingSec === 1) {
        void this.performCheck();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    this.unwatchStorage?.();
    if (!this.isRunning() && this.status() !== 'found') {
      this.badgeService.clear();
    }
  }
}
