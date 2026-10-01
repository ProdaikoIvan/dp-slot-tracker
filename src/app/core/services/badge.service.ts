import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BadgeService {
  setTimer(seconds: number): void {
    const text = this.formatTime(seconds);
    this.setBadge(text, '#82aaff', '#0f172a');
  }

  setFound(): void {
    this.setBadge('SLOT', '#00d27a', '#08120c');
  }

  clear(): void {
    if (typeof chrome !== 'undefined' && chrome?.action) {
      try {
        chrome.action.setBadgeText({ text: '' });
      } catch {
        // Outside extension environment
      }
    }
  }

  private setBadge(text: string, bgColor: string, textColor: string): void {
    if (typeof chrome !== 'undefined' && chrome?.action) {
      try {
        chrome.action.setBadgeText({ text });
        chrome.action.setBadgeBackgroundColor({ color: bgColor });
        if ('setBadgeTextColor' in chrome.action) {
          chrome.action.setBadgeTextColor({ color: textColor });
        }
      } catch {
        // Outside extension environment
      }
    }
  }

  formatTime(seconds: number): string {
    if (seconds <= 0) return '';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
