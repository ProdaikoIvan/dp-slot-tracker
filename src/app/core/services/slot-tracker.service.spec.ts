import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlotTrackerService } from './slot-tracker.service';
import { STORAGE_KEYS } from '../constants/app.constants';

describe('SlotTrackerService', () => {
  let service: SlotTrackerService;
  let mockSendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockSendMessage = vi.fn().mockResolvedValue({ success: true });
    (globalThis as unknown as { chrome: unknown }).chrome = {
      runtime: {
        sendMessage: mockSendMessage,
      },
      tabs: {
        query: vi.fn().mockResolvedValue([{ id: 123 }]),
      },
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [SlotTrackerService],
    });
    service = TestBed.inject(SlotTrackerService);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it('should be created with default values and send POPUP_OPENED', () => {
    expect(service).toBeTruthy();
    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.intervalSeconds()).toBe(30);
    expect(service.remainingSeconds()).toBe(30);
    expect(service.foundDays()).toEqual([]);
    expect(service.soundEnabled()).toBe(true);
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'POPUP_OPENED' });
  });

  it('should start and send START_TRACKER message to background', async () => {
    await service.start();
    expect(service.status()).toBe('waiting');
    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'START_TRACKER',
        targetTabId: 123,
        intervalSeconds: 30,
      })
    );
  });

  it('should stop and send STOP_TRACKER message', () => {
    service.stop();
    expect(service.status()).toBe('idle');
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'STOP_TRACKER' });
  });

  it('should reset all tracker state and send RESET_TRACKER', () => {
    service.foundDays.set(['2026-10-15']);
    service.lastMessage.set('Found dates');
    service.intervalSeconds.set(120);

    service.reset();

    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.foundDays()).toEqual([]);
    expect(service.lastMessage()).toBeNull();
    expect(service.intervalSeconds()).toBe(30);
    expect(service.remainingSeconds()).toBe(30);
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'RESET_TRACKER' });
  });

  it('should toggle running state', async () => {
    await service.start();
    expect(service.isRunning()).toBe(true);
    service.stop();
    expect(service.isRunning()).toBe(false);
  });

  it('should change interval and send SET_INTERVAL', () => {
    service.setIntervalSeconds(120);
    expect(service.intervalSeconds()).toBe(120);
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'SET_INTERVAL',
      intervalSeconds: 120,
    });
  });

  it('should toggle sound and send TOGGLE_SOUND', () => {
    expect(service.soundEnabled()).toBe(true);
    service.toggleSound();
    expect(service.soundEnabled()).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'TOGGLE_SOUND' });
  });

  it('should sync tab closed notice when received from storage', () => {
    const storageWatcherCallback = (service as unknown as { syncFromState: (s: unknown) => void }).syncFromState;
    storageWatcherCallback.call(service, {
      isRunning: false,
      status: 'idle',
      intervalSeconds: 30,
      targetTabId: null,
      foundDays: [],
      lastMessage: null,
      nextCheckTimestamp: null,
      tabClosedNotice: true,
    });

    expect(service.status()).toBe('idle');
    expect(service.isRunning()).toBe(false);
    expect(service.showTabClosedModal()).toBe(true);

    service.dismissTabClosedModal();
    expect(service.showTabClosedModal()).toBe(false);
    expect(mockSendMessage).toHaveBeenCalledWith({ type: 'DISMISS_TAB_CLOSED_MODAL' });
  });

  it('should restore found slots from persisted state', async () => {
    const mockStorageGet = vi.fn().mockResolvedValue({
      [STORAGE_KEYS.trackerState]: {
        isRunning: false,
        status: 'found',
        intervalSeconds: 30,
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
  });
});
