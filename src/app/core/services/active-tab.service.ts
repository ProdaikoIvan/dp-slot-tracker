import { Injectable, signal } from '@angular/core';
import { TARGET_SITE } from '../constants/app.constants';
import { findSupportedCenter, SUPPORTED_CENTERS } from '../constants/centers.constants';
import { SupportedCenter } from '../models/center.model';

@Injectable({
  providedIn: 'root',
})
export class ActiveTabService {
  readonly isOnTargetSite = signal<boolean>(false);
  readonly isCenterSupported = signal<boolean>(false);
  readonly detectedCenter = signal<SupportedCenter | null>(null);
  readonly availableCenters = SUPPORTED_CENTERS;

  private readonly isChromeExtension = typeof chrome !== 'undefined' && !!chrome.tabs?.query;

  constructor() {
    this.checkCurrentTab();
  }

  async checkCurrentTab(): Promise<boolean> {
    if (this.isChromeExtension) {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tab?.url ?? '';
        const isTarget = url.includes(TARGET_SITE.domain);

        this.isOnTargetSite.set(isTarget);
        if (isTarget) {
          this.parseCenterFromUrl(url);
        } else {
          this.isCenterSupported.set(false);
          this.detectedCenter.set(null);
        }
        return isTarget;
      } catch {
        this.resetState();
        return false;
      }
    }

    this.resetState();
    return false;
  }

  private parseCenterFromUrl(url: string): void {
    const match = url.match(/^https?:\/\/([a-z0-9-]+)\.pasport\.org\.ua/i);
    const sub = match ? match[1].toLowerCase() : '';
    const center = sub ? findSupportedCenter(sub) : null;

    if (center) {
      this.detectedCenter.set(center);
      this.isCenterSupported.set(true);
    } else {
      this.detectedCenter.set(null);
      this.isCenterSupported.set(false);
    }
  }

  openTargetSite(url?: string): void {
    const target = url ?? TARGET_SITE.url;
    if (this.isChromeExtension) {
      chrome.tabs.create({ url: target });
      return;
    }
    window.open(target, '_blank');
  }

  private resetState(): void {
    this.isOnTargetSite.set(false);
    this.isCenterSupported.set(false);
    this.detectedCenter.set(null);
  }
}
