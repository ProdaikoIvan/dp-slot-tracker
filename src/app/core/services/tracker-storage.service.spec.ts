import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrackerStorageService } from './tracker-storage.service';
import { TrackerPersistedState } from '../models/tracker.model';
import { STORAGE_KEYS } from '../constants/app.constants';

describe('TrackerStorageService', () => {
  let service: TrackerStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackerStorageService],
    });
    service = TestBed.inject(TrackerStorageService);
  });

  afterEach(() => {
    delete (globalThis as { chrome?: unknown }).chrome;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return null when chrome.storage is not available', async () => {
    const result = await service.load();
    expect(result).toBeNull();
  });

  it('should save and load state via chrome.storage.local', async () => {
    const sampleState: TrackerPersistedState = {
      isRunning: true,
      status: 'waiting',
      intervalSeconds: 60,
      targetTabId: 101,
      foundDays: [],
      lastMessage: null,
      nextCheckTimestamp: 123456789,
    };

    const mockSet = vi.fn().mockResolvedValue(undefined);
    const mockGet = vi.fn().mockResolvedValue({
      [STORAGE_KEYS.trackerState]: sampleState,
    });

    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          set: mockSet,
          get: mockGet,
        },
      },
    };

    await service.save(sampleState);
    expect(mockSet).toHaveBeenCalledWith({ [STORAGE_KEYS.trackerState]: sampleState });

    const loaded = await service.load();
    expect(loaded).toEqual(sampleState);
  });

  it('should clear state via chrome.storage.local', async () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined);
    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          remove: mockRemove,
        },
      },
    };

    await service.clear();
    expect(mockRemove).toHaveBeenCalledWith(STORAGE_KEYS.trackerState);
  });

  it('should subscribe and unsubscribe to chrome.storage.onChanged via watchChanges', () => {
    let capturedListener: ((changes: unknown, area: string) => void) | null = null;
    const addListener = vi.fn((cb) => {
      capturedListener = cb;
    });
    const removeListener = vi.fn();

    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        onChanged: {
          addListener,
          removeListener,
        },
      },
    };

    let received: unknown = null;
    const unwatch = service.watchChanges((state) => {
      received = state;
    });

    expect(addListener).toHaveBeenCalled();

    const sample = { status: 'found', isRunning: false };
    capturedListener!({ [STORAGE_KEYS.trackerState]: { newValue: sample } }, 'local');

    expect(received).toEqual(sample);

    unwatch();
    expect(removeListener).toHaveBeenCalled();
  });
});
