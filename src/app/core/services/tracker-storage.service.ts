import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';
import { TrackerPersistedState } from '../models/tracker.model';

@Injectable({
  providedIn: 'root',
})
export class TrackerStorageService {
  async save(state: TrackerPersistedState): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome?.storage?.local) return;

    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.trackerState]: state });
    } catch {
      // Storage unavailable or quota error
    }
  }

  async load(): Promise<TrackerPersistedState | null> {
    if (typeof chrome === 'undefined' || !chrome?.storage?.local) return null;

    try {
      const data = await chrome.storage.local.get(STORAGE_KEYS.trackerState);
      return (data[STORAGE_KEYS.trackerState] as TrackerPersistedState) ?? null;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome?.storage?.local) return;

    try {
      await chrome.storage.local.remove(STORAGE_KEYS.trackerState);
    } catch {
      // Ignore
    }
  }

  watchChanges(callback: (state: TrackerPersistedState) => void): () => void {
    if (typeof chrome === 'undefined' || !chrome?.storage?.onChanged) {
      return () => {};
    }

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName !== 'local' || !changes[STORAGE_KEYS.trackerState]) return;
      const state = changes[STORAGE_KEYS.trackerState].newValue as TrackerPersistedState | undefined;
      if (state) {
        callback(state);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      try {
        chrome.storage.onChanged.removeListener(listener);
      } catch {
        // Outside extension
      }
    };
  }
}
