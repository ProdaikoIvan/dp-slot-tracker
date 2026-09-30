import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService {
  private readonly isChromeExtension = typeof chrome !== 'undefined' && !!chrome.storage;

  async get<T>(key: string): Promise<T | null> {
    if (this.isChromeExtension) {
      const result = await chrome.storage.local.get([key]);
      return (result[key] as T) ?? null;
    }

    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.isChromeExtension) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    if (this.isChromeExtension) {
      await chrome.storage.local.remove(key);
      return;
    }

    localStorage.removeItem(key);
  }
}
