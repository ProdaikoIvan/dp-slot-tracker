import { Injectable, signal } from '@angular/core';
import { TARGET_SITE } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class ActiveTabService {
  readonly isOnTargetSite = signal<boolean>(false);
  private readonly isChromeExtension = typeof chrome !== 'undefined' && !!chrome.tabs?.query;

  constructor() {
    this.checkCurrentTab();
  }

  async checkCurrentTab(): Promise<boolean> {
    if (this.isChromeExtension) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const isTarget = tab?.url?.includes(TARGET_SITE.domain) ?? false;
        this.isOnTargetSite.set(isTarget);
        return isTarget;
      } catch {
        this.isOnTargetSite.set(false);
        return false;
      }
    }

    // За замовчуванням у звичайному браузері вважаємо, що не на сайті (для перевірки кнопки)
    this.isOnTargetSite.set(false);
    return false;
  }

  openTargetSite(): void {
    if (this.isChromeExtension) {
      chrome.tabs.create({ url: TARGET_SITE.url });
      return;
    }

    window.open(TARGET_SITE.url, '_blank');
  }

  toggleSimulation(): void {
    this.isOnTargetSite.update((v) => !v);
  }
}
