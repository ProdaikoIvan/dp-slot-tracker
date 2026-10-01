import { Injectable, signal } from '@angular/core';
import { STORAGE_KEYS } from '../constants/app.constants';

export interface UserSettings {
  email: string;
  emailNotificationsEnabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  readonly email = signal<string>('');
  readonly emailNotificationsEnabled = signal<boolean>(false);

  constructor() {
    void this.loadSettings();
  }

  async loadSettings(): Promise<UserSettings> {
    let email = '';
    let emailNotificationsEnabled = false;

    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEYS.settings);
        const stored = data[STORAGE_KEYS.settings] as UserSettings | undefined;
        if (stored) {
          email = stored.email || '';
          emailNotificationsEnabled = Boolean(stored.emailNotificationsEnabled);
        }
      } catch {
        // Fallback to localStorage
      }
    }

    if (!email && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.settings);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<UserSettings>;
          email = parsed.email || '';
          emailNotificationsEnabled = Boolean(parsed.emailNotificationsEnabled);
        }
      } catch {
        // Ignore parse error
      }
    }

    this.email.set(email);
    this.emailNotificationsEnabled.set(emailNotificationsEnabled);

    return { email, emailNotificationsEnabled };
  }

  async saveSettings(email: string, emailNotificationsEnabled: boolean): Promise<void> {
    const cleanEmail = email.trim();
    this.email.set(cleanEmail);
    this.emailNotificationsEnabled.set(emailNotificationsEnabled);

    const settings: UserSettings = {
      email: cleanEmail,
      emailNotificationsEnabled,
    };

    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      try {
        await chrome.storage.local.set({
          [STORAGE_KEYS.settings]: settings,
        });
      } catch {
        // Ignore chrome storage error
      }
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      } catch {
        // Ignore localStorage error
      }
    }
  }

  isValidEmail(email: string): boolean {
    const trimmed = email.trim();
    if (!trimmed) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(trimmed);
  }
}
