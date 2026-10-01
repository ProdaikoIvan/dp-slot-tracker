import { Injectable } from '@angular/core';
import { QueueCheckResult } from '../models/queue-check.model';
import { DEFAULT_SERVICE_ID } from '../constants/app.constants';
import { inPageCheckDays } from '../utils/queue-script.util';

export { inPageCheckDays };

@Injectable({
  providedIn: 'root',
})
export class QueueCheckerService {
  async getActiveTabId(): Promise<number | null> {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) return null;
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      return tabs[0]?.id ?? null;
    } catch {
      return null;
    }
  }

  async checkActiveTab(specificTabId?: number): Promise<QueueCheckResult> {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return {
        success: false,
        days: [],
        error: 'Chrome API недоступне',
      };
    }

    if (!chrome.scripting) {
      return {
        success: false,
        days: [],
        error: 'Оновіть розширення (кнопка 🔄 в chrome://extensions)',
      };
    }

    try {
      let activeTab: chrome.tabs.Tab | undefined;

      if (specificTabId !== undefined) {
        try {
          activeTab = await chrome.tabs.get(specificTabId);
        } catch {
          return {
            success: false,
            days: [],
            error: 'Вкладку черги закрито',
          };
        }
      } else {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        activeTab = tabs[0];
      }

      if (!activeTab?.id) {
        return {
          success: false,
          days: [],
          error: 'Вкладку черги не знайдено',
        };
      }

      if (!activeTab.url || !activeTab.url.includes('/solutions/e-queue')) {
        return {
          success: false,
          days: [],
          error: 'Відкрийте сторінку черги (Запис онлайн)',
        };
      }

      console.log('[DP Slot Tracker] Запуск перевірки у вкладці ID:', activeTab.id, activeTab.url);

      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: inPageCheckDays,
        args: [DEFAULT_SERVICE_ID],
      });

      const scriptResult = results?.[0]?.result as QueueCheckResult | undefined;
      console.log('[DP Slot Tracker] Результат перевірки:', scriptResult);

      if (!scriptResult) {
        return {
          success: false,
          days: [],
          error: 'Не вдалося отримати відповідь від сторінки',
        };
      }

      return scriptResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Помилка виконання перевірки';
      console.error('[DP Slot Tracker] Помилка:', message);
      return {
        success: false,
        days: [],
        error: message,
      };
    }
  }
}

