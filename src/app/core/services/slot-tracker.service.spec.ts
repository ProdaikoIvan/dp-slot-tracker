import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlotTrackerService } from './slot-tracker.service';
import { QueueCheckerService } from './queue-checker.service';
import { SoundNotificationService } from './sound-notification.service';
import { BadgeService } from './badge.service';
import { STORAGE_KEYS } from '../constants/app.constants';

describe('SlotTrackerService', () => {
  let service: SlotTrackerService;
  let mockChecker: { checkActiveTab: ReturnType<typeof vi.fn>; getActiveTabId: ReturnType<typeof vi.fn> };
  let mockSound: { playSuccess: ReturnType<typeof vi.fn>; playTestBeep: ReturnType<typeof vi.fn>; isEnabled: ReturnType<typeof vi.fn> };
  let mockBadge: { setTimer: ReturnType<typeof vi.fn>; setFound: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.useFakeTimers();
    mockChecker = {
      checkActiveTab: vi.fn().mockResolvedValue({
        success: true,
        days: [],
      }),
      getActiveTabId: vi.fn().mockResolvedValue(123),
    };
    mockSound = {
      playSuccess: vi.fn(),
      playTestBeep: vi.fn(),
      isEnabled: vi.fn().mockReturnValue(true),
    };
    mockBadge = {
      setTimer: vi.fn(),
      setFound: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SlotTrackerService,
        { provide: BadgeService, useValue: mockBadge },
        { provide: QueueCheckerService, useValue: mockChecker },
        { provide: SoundNotificationService, useValue: mockSound },
      ],
    });
    service = TestBed.inject(SlotTrackerService);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it('should be created with default values', () => {
    expect(service).toBeTruthy();
    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.intervalSeconds()).toBe(60);
    expect(service.remainingSeconds()).toBe(60);
    expect(service.foundDays()).toEqual([]);
  });

  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  it('should start, update status, and perform initial check', async () => {
    service.start();
    expect(service.isRunning()).toBe(true);

    await flush();

    expect(mockChecker.checkActiveTab).toHaveBeenCalledTimes(1);
    expect(service.status()).toBe('waiting');
    expect(service.lastMessage()).toBe('Вільних дат наразі немає');
  });

  it('should stop and reset status to idle', () => {
    service.start();
    service.stop();
    expect(service.isRunning()).toBe(false);
    expect(service.status()).toBe('idle');
  });

  it('should reset all tracker state on reset()', () => {
    service.foundDays.set(['2026-10-15']);
    service.lastMessage.set('Found dates');
    service.intervalSeconds.set(120);

    service.reset();

    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.foundDays()).toEqual([]);
    expect(service.lastMessage()).toBeNull();
    expect(service.intervalSeconds()).toBe(60);
    expect(service.remainingSeconds()).toBe(60);
  });

  it('should toggle running state', () => {
    service.toggle();
    expect(service.isRunning()).toBe(true);
    service.toggle();
    expect(service.isRunning()).toBe(false);
  });

  it('should change interval and update remaining when idle', () => {
    service.setIntervalSeconds(120);
    expect(service.intervalSeconds()).toBe(120);
    expect(service.remainingSeconds()).toBe(120);
  });

  it('should set status to found when days are detected', async () => {
    mockChecker.checkActiveTab.mockResolvedValueOnce({
      success: true,
      days: ['2026-10-15', '2026-10-16'],
      centerId: '41',
    });

    service.start();
    await flush();

    expect(service.status()).toBe('found');
    expect(service.foundDays()).toEqual(['2026-10-15', '2026-10-16']);
    expect(service.lastMessage()).toContain('Знайдено вільні дати');
    expect(mockSound.playSuccess).toHaveBeenCalledTimes(1);
  });

  it('should set status to error when checker fails', async () => {
    mockChecker.checkActiveTab.mockResolvedValueOnce({
      success: false,
      days: [],
      error: 'Оберіть послугу на сторінці',
    });

    service.start();
    await flush();

    expect(service.status()).toBe('error');
    expect(service.lastMessage()).toBe('Оберіть послугу на сторінці');
  });

  it('should stop timer on error and not tick countdown', async () => {
    mockChecker.checkActiveTab.mockResolvedValueOnce({
      success: false,
      days: [],
      error: 'Помилка зʼєднання',
    });

    service.start();
    await flush();

    expect(service.status()).toBe('error');
    const remainingAtError = service.remainingSeconds();

    vi.advanceTimersByTime(5000);
    expect(service.remainingSeconds()).toBe(remainingAtError);
    expect(mockChecker.checkActiveTab).toHaveBeenCalledTimes(1);
  });

  it('should sync tab closed notice when received from storage', () => {
    service.start();

    // Simulate background worker updating storage when tab is closed
    const storageWatcherCallback = (service as unknown as { unwatchStorage: unknown; syncFromState: (s: unknown) => void }).syncFromState;
    storageWatcherCallback.call(service, {
      isRunning: false,
      status: 'idle',
      intervalSeconds: 60,
      targetTabId: null,
      foundDays: [],
      lastMessage: null,
      nextCheckTimestamp: null,
      tabClosedNotice: true,
    });

    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.showTabClosedModal()).toBe(true);
    expect(service.targetTabId()).toBeNull();

    service.dismissTabClosedModal();
    expect(service.showTabClosedModal()).toBe(false);
  });

  it('should sync navigated away error when received from storage', () => {
    service.start();

    // Simulate background worker updating storage when tab navigates away
    const storageWatcherCallback = (service as unknown as { syncFromState: (s: unknown) => void }).syncFromState;
    storageWatcherCallback.call(service, {
      isRunning: false,
      status: 'error',
      intervalSeconds: 60,
      targetTabId: null,
      foundDays: [],
      lastMessage: 'Ви перейшли зі сторінки черги. Відкрийте "Запис онлайн"',
      nextCheckTimestamp: null,
    });

    expect(service.status()).toBe('error');
    expect(service.isRunning()).toBe(false);
    expect(service.lastMessage()).toContain('Ви перейшли зі сторінки черги');
    expect(service.targetTabId()).toBeNull();
  });

  it('should restore running timer from persisted state', async () => {
    const futureTime = Date.now() + 45000;
    const mockStorageGet = vi.fn().mockResolvedValue({
      [STORAGE_KEYS.trackerState]: {
        isRunning: true,
        status: 'waiting',
        intervalSeconds: 60,
        targetTabId: 789,
        foundDays: [],
        lastMessage: null,
        nextCheckTimestamp: futureTime,
      },
    });

    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: mockStorageGet,
          set: vi.fn(),
        },
      },
    };

    await service.loadPersistedState();

    expect(service.status()).toBe('waiting');
    expect(service.isRunning()).toBe(true);
    expect(service.targetTabId()).toBe(789);
    expect(service.remainingSeconds()).toBe(45);
    expect(mockBadge.setTimer).toHaveBeenCalledWith(45);
  });

  it('should restore found slots from persisted state', async () => {
    const mockStorageGet = vi.fn().mockResolvedValue({
      [STORAGE_KEYS.trackerState]: {
        isRunning: false,
        status: 'found',
        intervalSeconds: 60,
        targetTabId: 789,
        foundDays: ['2026-10-15'],
        lastMessage: 'Знайдено вільні дати (1)',
        nextCheckTimestamp: null,
        centerName: 'Мадрид',
      },
    });

    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: mockStorageGet,
          set: vi.fn(),
        },
      },
      runtime: {
        sendMessage: vi.fn().mockResolvedValue(undefined),
      },
    };

    await service.loadPersistedState();

    expect(service.status()).toBe('found');
    expect(service.foundDays()).toEqual(['2026-10-15']);
    expect(service.centerName()).toBe('Мадрид');
    expect(mockBadge.setFound).toHaveBeenCalled();
  });
});
