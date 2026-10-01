// Background Service Worker for DP Slot Tracker (Chrome Manifest V3)

const STORAGE_KEY = 'dp_slot_tracker_state';
const ALARM_NAME = 'dp_slot_check';
const DEFAULT_SERVICE_ID = '4';

let badgeInterval = null;

function formatBadgeText(seconds) {
  if (seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function startBadgeCountdown(nextTimestamp) {
  stopBadgeCountdown();
  if (!nextTimestamp) return;

  const update = () => {
    const remaining = Math.max(0, Math.ceil((nextTimestamp - Date.now()) / 1000));
    if (remaining <= 0) {
      stopBadgeCountdown();
      return;
    }
    const text = formatBadgeText(remaining);
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#82aaff' });
    if ('setBadgeTextColor' in chrome.action) {
      chrome.action.setBadgeTextColor({ color: '#0f172a' });
    }
  };

  update();
  badgeInterval = setInterval(update, 1000);
}

function stopBadgeCountdown() {
  if (badgeInterval !== null) {
    clearInterval(badgeInterval);
    badgeInterval = null;
  }
}

let flashBadgeInterval = null;

function startFlashingBadge() {
  stopFlashingBadge();
  stopBadgeCountdown();
  let toggle = false;
  chrome.action.setBadgeText({ text: 'SLOT' });
  chrome.action.setBadgeBackgroundColor({ color: '#00d27a' });
  if ('setBadgeTextColor' in chrome.action) {
    chrome.action.setBadgeTextColor({ color: '#08120c' });
  }

  flashBadgeInterval = setInterval(() => {
    toggle = !toggle;
    const color = toggle ? '#f59e0b' : '#00d27a';
    chrome.action.setBadgeText({ text: 'SLOT' });
    chrome.action.setBadgeBackgroundColor({ color });
  }, 600);
}

function stopFlashingBadge() {
  if (flashBadgeInterval !== null) {
    clearInterval(flashBadgeInterval);
    flashBadgeInterval = null;
  }
}

// 1. Listen for tab closure
chrome.tabs.onRemoved.addListener(async (closedTabId) => {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const state = data?.[STORAGE_KEY];

    if (state && state.targetTabId === closedTabId) {
      console.log('[DP Background] Tracked tab was closed:', closedTabId);
      stopBadgeCountdown();
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.action.setBadgeText({ text: '' });
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...state,
          isRunning: false,
          status: 'idle',
          lastMessage: null,
          tabClosedNotice: true,
          targetTabId: null,
          nextCheckTimestamp: null,
        },
      });
    }
  } catch (err) {
    console.error('[DP Background] Error on tab close:', err);
  }
});

// 2. Listen for tab navigation: if user leaves /solutions/e-queue, stop and show error
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return;

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const state = data?.[STORAGE_KEY];

    if (state && state.targetTabId === tabId && !changeInfo.url.includes('/solutions/e-queue')) {
      console.log('[DP Background] Tracked tab navigated away:', changeInfo.url);
      stopBadgeCountdown();
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.action.setBadgeText({ text: '' });
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...state,
          isRunning: false,
          status: 'error',
          lastMessage: 'Ви перейшли зі сторінки черги. Відкрийте "Запис онлайн"',
          targetTabId: null,
          nextCheckTimestamp: null,
        },
      });
    }
  } catch (err) {
    console.error('[DP Background] Error on tab update:', err);
  }
});

// 3. Listen for storage changes: manage background alarm & badge countdown
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEY]) return;

  const newState = changes[STORAGE_KEY].newValue;
  if (!newState || !newState.isRunning) {
    stopBadgeCountdown();
    chrome.alarms.clear(ALARM_NAME);
    return;
  }

  // Start badge countdown timer for live toolbar updates
  if (newState.nextCheckTimestamp) {
    startBadgeCountdown(newState.nextCheckTimestamp);
  }

  // Schedule alarm for periodic checks
  const intervalMinutes = Math.max(1, (newState.intervalSeconds || 60) / 60);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  });
});

let isCheckingInBackground = false;

async function triggerBackgroundCheck() {
  if (isCheckingInBackground) return;
  isCheckingInBackground = true;

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const state = data?.[STORAGE_KEY];

    if (!state || !state.isRunning || !state.targetTabId) {
      stopBadgeCountdown();
      await chrome.alarms.clear(ALARM_NAME);
      return;
    }

    // Indicate check in progress
    chrome.action.setBadgeText({ text: '...' });

    // Verify tab still exists
    let tab;
    try {
      tab = await chrome.tabs.get(state.targetTabId);
    } catch {
      stopBadgeCountdown();
      await chrome.action.setBadgeText({ text: '' });
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...state,
          isRunning: false,
          status: 'idle',
          lastMessage: null,
          tabClosedNotice: true,
          targetTabId: null,
          nextCheckTimestamp: null,
        },
      });
      return;
    }

    if (!tab?.url || !tab.url.includes('/solutions/e-queue')) {
      stopBadgeCountdown();
      await chrome.action.setBadgeText({ text: '' });
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...state,
          isRunning: false,
          status: 'error',
          lastMessage: 'Ви перейшли зі сторінки черги. Відкрийте "Запис онлайн"',
          targetTabId: null,
          nextCheckTimestamp: null,
        },
      });
      return;
    }

    // Execute check in the page context
    const results = await chrome.scripting.executeScript({
      target: { tabId: state.targetTabId },
      func: inPageCheckDaysScript,
      args: [DEFAULT_SERVICE_ID],
    });

    const result = results?.[0]?.result;
    if (!result) return;

    if (result.success) {
      if (result.days && result.days.length > 0) {
        // Slots found!
        stopBadgeCountdown();
        await chrome.alarms.clear(ALARM_NAME);
        startFlashingBadge();

        // 1. Гарантований звуковий сигнал через Offscreen Document
        void playOffscreenAudio();

        // 2. Системне спливаюче сповіщення Windows/Chrome із вказанням центру та послуги
        const centerTitle = result.centerName || 'ДП Документ';
        const serviceTitle = result.serviceName || 'Оформлення документів';
        const notifId = 'dp_slots_' + Date.now();
        try {
          if (chrome.notifications?.create) {
            chrome.notifications.create(
              notifId,
              {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon-128.png'),
                title: `🎉 Знайдено слоти: ${centerTitle}`,
                message: `Послуга: ${serviceTitle}\nДати: ${result.days.join(', ')}\nНатисніть тут, щоб відкрити чергу!`,
                priority: 2,
                requireInteraction: true,
              },
              (createdId) => {
                if (chrome.runtime.lastError) {
                  console.error('[DP Background] Notification error:', chrome.runtime.lastError);
                } else {
                  console.log('[DP Background] Notification created:', createdId);
                }
              }
            );
          }
        } catch (notifErr) {
          console.error('[DP Background] Notification error:', notifErr);
        }

        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            ...state,
            isRunning: false,
            status: 'found',
            foundDays: result.days,
            centerName: result.centerName || null,
            serviceName: result.serviceName || null,
            availableServices: result.availableServices || [],
            lastMessage: `Знайдено дати (${result.days.length}) для ${serviceTitle}`,
            checkCount: (state.checkCount || 0) + 1,
            nextCheckTimestamp: null,
          },
        });
      } else {
        // No slots yet, schedule next timestamp
        const intervalSec = state.intervalSeconds || 60;
        const nextTimestamp = Date.now() + intervalSec * 1000;
        startBadgeCountdown(nextTimestamp);

        await chrome.storage.local.set({
          [STORAGE_KEY]: {
            ...state,
            status: 'waiting',
            foundDays: [],
            lastMessage: 'Вільних дат наразі немає',
            checkCount: (state.checkCount || 0) + 1,
            nextCheckTimestamp: nextTimestamp,
          },
        });
      }
    } else if (result.error) {
      stopBadgeCountdown();
      await chrome.action.setBadgeText({ text: '' });
      await chrome.alarms.clear(ALARM_NAME);
      await chrome.storage.local.set({
        [STORAGE_KEY]: {
          ...state,
          status: 'error',
          lastMessage: result.error,
          nextCheckTimestamp: null,
        },
      });
    }
  } catch (err) {
    console.error('[DP Background] Check execution error:', err);
  } finally {
    isCheckingInBackground = false;
  }
}

// 4. Listen for alarm: perform background check on target tab
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void triggerBackgroundCheck();
  }
});

// 5. Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'BADGE_TICK' && typeof message.text === 'string') {
    if (flashBadgeInterval !== null) {
      sendResponse?.({ success: false });
      return;
    }
    chrome.action.setBadgeText({ text: message.text });
    chrome.action.setBadgeBackgroundColor({ color: '#82aaff' });
    if ('setBadgeTextColor' in chrome.action) {
      chrome.action.setBadgeTextColor({ color: '#0f172a' });
    }
    sendResponse?.({ success: true });
  } else if (message?.type === 'TIME_TO_CHECK') {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const state = data?.[STORAGE_KEY];
      if (state?.status === 'found' || !state?.isRunning) {
        stopBadgeCountdown();
        return;
      }
      void triggerBackgroundCheck();
    });
    sendResponse?.({ success: true });
  } else if (message?.type === 'STOP_FLASHING') {
    stopFlashingBadge();
    chrome.action.setBadgeText({ text: 'SLOT' });
    chrome.action.setBadgeBackgroundColor({ color: '#00d27a' });
    sendResponse?.({ success: true });
  }
});

// Helper to ensure offscreen document exists and play sound
async function playOffscreenAudio() {
  try {
    if ('offscreen' in chrome && chrome.offscreen?.createDocument) {
      const existing = await chrome.runtime.getContexts?.({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      }).catch(() => []);

      if (!existing || existing.length === 0) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['AUDIO_PLAYBACK'],
          justification: 'Play chime when slots are found',
        });
      }
      await chrome.runtime.sendMessage({ type: 'PLAY_OFFSCREEN_AUDIO' }).catch(() => {});
      return;
    }
  } catch (err) {
  }
}

if (chrome.notifications?.onClicked) {
  chrome.notifications.onClicked.addListener(async (notifId) => {
    if (typeof notifId === 'string' && (notifId.startsWith('dp_slots_') || notifId === 'dp_slots_found')) {
      try {
        const data = await chrome.storage.local.get(STORAGE_KEY);
        const state = data?.[STORAGE_KEY];
        if (state?.targetTabId) {
          await chrome.tabs.update(state.targetTabId, { active: true });
          const tab = await chrome.tabs.get(state.targetTabId).catch(() => null);
          if (tab?.windowId) {
            await chrome.windows.update(tab.windowId, { focused: true });
          }
        }
      } catch (err) {
        console.error('[DP Background] Focus tab error:', err);
      }
    }
  });
}

// In-page script executed in web page
function inPageCheckDaysScript(defaultServiceId = '4') {
  try {
    const form = document.querySelector('form#services');
    if (!form) {
      return { success: false, days: [], error: 'Форму черги (#services) не знайдено' };
    }

    const xData = form.getAttribute('x-data') || '';
    const csrfMatch = xData.match(/"csrf"\s*:\s*"([^"]+)"/);
    const centerMatch = xData.match(/"center"\s*:\s*"([^"]+)"/);

    if (!csrfMatch || !centerMatch) {
      return { success: false, days: [], error: 'Не знайдено токени форми черги' };
    }

    const csrf = csrfMatch[1];
    const center = centerMatch[1];
    const select = document.querySelector('select#service');
    const serviceId = select?.value && select.value.trim() !== '' ? select.value : defaultServiceId;
    const selectedOption = select?.selectedOptions?.[0] || (select && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null);
    const serviceName = selectedOption?.text?.trim() || 'Оформлення документів';

    const availableServices = select
      ? Array.from(select.options)
          .filter((opt) => opt.value && opt.value.trim() !== '')
          .map((opt) => ({ id: opt.value, name: opt.text.trim() }))
      : [];

    const pageHeading = document.querySelector('h1')?.textContent?.trim();
    const subdomain = window.location.hostname.split('.')[0] || '';
    const centerName = pageHeading || (subdomain ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) : 'ДП Документ');

    const formData = new FormData();
    formData.append('form', 'days');
    formData.append('ServiceCenterId', center);
    formData.append('ServiceId', serviceId);
    formData.append(csrf, '1');

    return fetch(window.location.href, {
      method: 'POST',
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 503) {
            return { success: false, days: [], error: 'Сервер перевантажений (503)' };
          }
          return { success: false, days: [], error: `Помилка сервера (HTTP ${res.status})` };
        }
        return res.json();
      })
      .then((data) => {
        const days = data?.days && Array.isArray(data.days) ? data.days : [];
        return {
          success: true,
          days,
          centerId: center,
          centerName,
          serviceId,
          serviceName,
          availableServices,
        };
      })
      .catch((err) => {
        return { success: false, days: [], error: err.message || 'Мережева помилка' };
      });
  } catch (err) {
    return { success: false, days: [], error: err.message || 'Помилка скрипту' };
  }
}
