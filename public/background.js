// ═══════════════════════════════════════════════════════════════
// Background Service Worker — DP Slot Tracker (Chrome MV3)
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = 'dp_slot_tracker_state';
const ALARM_NAME = 'dp_slot_check';
const DEFAULT_SERVICE_ID = '4';

// ───────────────────────────────────────────────────────────────
// 1. Storage helpers (DRY state read/write)
// ───────────────────────────────────────────────────────────────

async function getState() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data?.[STORAGE_KEY] ?? null;
}

async function updateState(patch) {
  const current = (await getState()) || {};
  await chrome.storage.local.set({
    [STORAGE_KEY]: { ...current, ...patch },
  });
}

// ───────────────────────────────────────────────────────────────
// 2. Badge management
// ───────────────────────────────────────────────────────────────

let badgeInterval = null;
let flashBadgeInterval = null;

function formatBadgeText(seconds) {
  if (seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function stopBadgeCountdown() {
  if (badgeInterval !== null) {
    clearInterval(badgeInterval);
    badgeInterval = null;
  }
}

function startBadgeCountdown(nextTimestamp) {
  stopBadgeCountdown();
  if (!nextTimestamp) return;

  const update = () => {
    const remaining = Math.max(0, Math.ceil((nextTimestamp - Date.now()) / 1000));
    if (remaining <= 0) {
      stopBadgeCountdown();
      void triggerBackgroundCheck();
      return;
    }
    chrome.action.setBadgeText({ text: formatBadgeText(remaining) });
    chrome.action.setBadgeBackgroundColor({ color: '#82aaff' });
    if ('setBadgeTextColor' in chrome.action) {
      chrome.action.setBadgeTextColor({ color: '#0f172a' });
    }
  };

  update();
  badgeInterval = setInterval(update, 1000);
}

function stopFlashingBadge() {
  if (flashBadgeInterval !== null) {
    clearInterval(flashBadgeInterval);
    flashBadgeInterval = null;
  }
}

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
    chrome.action.setBadgeText({ text: 'SLOT' });
    chrome.action.setBadgeBackgroundColor({ color: toggle ? '#f59e0b' : '#00d27a' });
  }, 600);
}

async function clearBadgeAndAlarm() {
  stopBadgeCountdown();
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.action.setBadgeText({ text: '' });
}

// ───────────────────────────────────────────────────────────────
// 3. Tab lifecycle listeners
// ───────────────────────────────────────────────────────────────

/** When tracked tab is closed — stop tracker and show notice */
chrome.tabs.onRemoved.addListener(async (closedTabId) => {
  try {
    const state = await getState();
    if (!state || state.targetTabId !== closedTabId) return;

    console.log('[DP Background] Tracked tab was closed:', closedTabId);
    await clearBadgeAndAlarm();
    await updateState({
      isRunning: false,
      status: 'idle',
      lastMessage: null,
      tabClosedNotice: true,
      targetTabId: null,
      nextCheckTimestamp: null,
    });
  } catch (err) {
    console.error('[DP Background] Error on tab close:', err);
  }
});

/** When tracked tab navigates away from queue page — stop with error */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (!changeInfo.url) return;

  try {
    const state = await getState();
    if (!state || state.targetTabId !== tabId) return;
    if (changeInfo.url.includes('/solutions/e-queue')) return;

    console.log('[DP Background] Tracked tab navigated away:', changeInfo.url);
    await clearBadgeAndAlarm();
    await updateState({
      isRunning: false,
      status: 'error',
      lastMessage: 'Ви перейшли зі сторінки черги. Відкрийте "Запис онлайн"',
      targetTabId: null,
      nextCheckTimestamp: null,
    });
  } catch (err) {
    console.error('[DP Background] Error on tab update:', err);
  }
});

// ───────────────────────────────────────────────────────────────
// 4. Storage watcher — sync alarm & badge with state changes
// ───────────────────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEY]) return;

  const newState = changes[STORAGE_KEY].newValue;
  if (!newState || !newState.isRunning) {
    stopBadgeCountdown();
    chrome.alarms.clear(ALARM_NAME);
    return;
  }

  if (newState.nextCheckTimestamp) {
    startBadgeCountdown(newState.nextCheckTimestamp);
  }

  const intervalMinutes = Math.max(1, (newState.intervalSeconds || 60) / 60);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  });
});

// ───────────────────────────────────────────────────────────────
// 5. Background slot check logic
// ───────────────────────────────────────────────────────────────

let isCheckingInBackground = false;

async function triggerBackgroundCheck() {
  if (isCheckingInBackground) return;
  isCheckingInBackground = true;

  try {
    const state = await getState();

    if (!state || !state.isRunning || !state.targetTabId) {
      await clearBadgeAndAlarm();
      return;
    }

    chrome.action.setBadgeText({ text: '...' });
    await updateState({
      status: 'checking',
      lastMessage: 'Перевірка слотів...',
    });

    // Verify tab still exists
    let tab;
    try {
      tab = await chrome.tabs.get(state.targetTabId);
    } catch {
      await clearBadgeAndAlarm();
      await updateState({
        isRunning: false,
        status: 'idle',
        lastMessage: null,
        tabClosedNotice: true,
        targetTabId: null,
        nextCheckTimestamp: null,
      });
      return;
    }

    // Tab navigated away from queue
    if (!tab?.url || !tab.url.includes('/solutions/e-queue')) {
      await clearBadgeAndAlarm();
      await updateState({
        isRunning: false,
        status: 'error',
        lastMessage: 'Ви перейшли зі сторінки черги. Відкрийте "Запис онлайн"',
        targetTabId: null,
        nextCheckTimestamp: null,
      });
      return;
    }

    const attempt = state.checkAttempt || 0;
    const isFirstCheck = attempt === 0;

    const results = await chrome.scripting.executeScript({
      target: { tabId: state.targetTabId },
      func: inPageCheckDaysScript,
      args: [DEFAULT_SERVICE_ID, isFirstCheck],
    });

    const result = results?.[0]?.result;
    if (!result) return;

    if (result.success && result.days?.length > 0) {
      // ✅ Slots found!
      await clearBadgeAndAlarm();
      startFlashingBadge();
      void playOffscreenAudio();
      showSlotNotification(result);

      await updateState({
        isRunning: false,
        status: 'found',
        foundDays: result.days,
        centerName: result.centerName || null,
        serviceName: result.serviceName || null,
        availableServices: result.availableServices || [],
        lastMessage: `Знайдено дати (${result.days.length}) для ${result.serviceName || 'Оформлення документів'}`,
        checkAttempt: 0,
        nextCheckTimestamp: null,
      });
    } else if (result.success) {
      // No slots yet — schedule next check
      const intervalSec = state.intervalSeconds || 60;
      const nextTimestamp = Date.now() + intervalSec * 1000;
      startBadgeCountdown(nextTimestamp);

      await updateState({
        status: 'waiting',
        foundDays: [],
        lastMessage: 'Вільних дат наразі немає',
        checkAttempt: attempt + 1,
        nextCheckTimestamp: nextTimestamp,
      });
    } else if (result.error) {
      await clearBadgeAndAlarm();
      await updateState({
        status: 'error',
        lastMessage: result.error,
        nextCheckTimestamp: null,
      });
    }
  } catch (err) {
    console.error('[DP Background] Check execution error:', err);
  } finally {
    isCheckingInBackground = false;
  }
}

// ───────────────────────────────────────────────────────────────
// 6. Alarm listener
// ───────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    void triggerBackgroundCheck();
  }
});

// ───────────────────────────────────────────────────────────────
// 7. Message handlers (popup ↔ background communication)
// ───────────────────────────────────────────────────────────────

const MESSAGE_HANDLERS = {
  BADGE_TICK: (message, sendResponse) => {
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
  },

  TIME_TO_CHECK: (_, sendResponse) => {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const state = data?.[STORAGE_KEY];
      if (state?.status === 'found' || !state?.isRunning) {
        stopBadgeCountdown();
        return;
      }
      void triggerBackgroundCheck();
    });
    sendResponse?.({ success: true });
  },

  CHECK_NOW: (_, sendResponse) => {
    void triggerBackgroundCheck();
    sendResponse?.({ success: true });
  },

  START_TRACKER: async (message, sendResponse) => {
    const targetTabId = message.targetTabId;
    const intervalSeconds = message.intervalSeconds || 60;
    const nextCheckTimestamp = Date.now() + intervalSeconds * 1000;

    await updateState({
      isRunning: true,
      status: 'waiting',
      intervalSeconds,
      targetTabId,
      foundDays: [],
      lastMessage: null,
      tabClosedNotice: false,
      checkAttempt: 0,
      nextCheckTimestamp,
    });

    startBadgeCountdown(nextCheckTimestamp);
    void triggerBackgroundCheck();
    sendResponse?.({ success: true });
  },

  STOP_TRACKER: async (_, sendResponse) => {
    stopFlashingBadge();
    await clearBadgeAndAlarm();
    await updateState({
      isRunning: false,
      status: 'idle',
      targetTabId: null,
      nextCheckTimestamp: null,
    });
    sendResponse?.({ success: true });
  },

  RESET_TRACKER: async (_, sendResponse) => {
    stopFlashingBadge();
    await clearBadgeAndAlarm();
    await updateState({
      isRunning: false,
      status: 'idle',
      targetTabId: null,
      foundDays: [],
      lastMessage: null,
      centerName: null,
      tabClosedNotice: false,
      checkAttempt: 0,
      intervalSeconds: 60,
      nextCheckTimestamp: null,
    });
    sendResponse?.({ success: true });
  },

  SET_INTERVAL: async (message, sendResponse) => {
    await updateState({ intervalSeconds: message.intervalSeconds || 60 });
    sendResponse?.({ success: true });
  },

  TOGGLE_SOUND: async (_, sendResponse) => {
    const state = await getState();
    const nextSound = state?.soundEnabled !== false ? false : true;
    await updateState({ soundEnabled: nextSound });
    sendResponse?.({ success: true, soundEnabled: nextSound });
  },

  DISMISS_TAB_CLOSED_MODAL: async (_, sendResponse) => {
    await updateState({ tabClosedNotice: false });
    sendResponse?.({ success: true });
  },

  POPUP_OPENED: (_, sendResponse) => {
    stopFlashingBadge();
    chrome.action.setBadgeText({ text: '' });
    sendResponse?.({ success: true });
  },

  STOP_FLASHING: (_, sendResponse) => {
    stopFlashingBadge();
    chrome.action.setBadgeText({ text: 'SLOT' });
    chrome.action.setBadgeBackgroundColor({ color: '#00d27a' });
    sendResponse?.({ success: true });
  },
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = MESSAGE_HANDLERS[message?.type];
  if (!handler) return;

  const result = handler(message, sendResponse);
  // Return true for async handlers to keep sendResponse channel open
  if (result instanceof Promise) {
    result.catch((err) => console.error('[DP Background] Handler error:', err));
    return true;
  }
});

// ───────────────────────────────────────────────────────────────
// 8. Notifications
// ───────────────────────────────────────────────────────────────

function showSlotNotification(result) {
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
          }
        },
      );
    }
  } catch (err) {
    console.error('[DP Background] Notification error:', err);
  }
}

if (chrome.notifications?.onClicked) {
  chrome.notifications.onClicked.addListener(async (notifId) => {
    if (typeof notifId !== 'string' || !notifId.startsWith('dp_slots_')) return;
    try {
      const state = await getState();
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
  });
}

// ───────────────────────────────────────────────────────────────
// 9. Offscreen audio playback
// ───────────────────────────────────────────────────────────────

async function playOffscreenAudio() {
  try {
    const state = await getState();
    if (state?.soundEnabled === false) return;

    if ('offscreen' in chrome && chrome.offscreen?.createDocument) {
      const existing = await chrome.runtime
        .getContexts?.({ contextTypes: ['OFFSCREEN_DOCUMENT'] })
        .catch(() => []);

      if (!existing || existing.length === 0) {
        await chrome.offscreen.createDocument({
          url: 'offscreen.html',
          reasons: ['AUDIO_PLAYBACK'],
          justification: 'Play chime when slots are found',
        });
      }
      await chrome.runtime.sendMessage({ type: 'PLAY_OFFSCREEN_AUDIO' }).catch(() => {});
    }
  } catch (err) {
    // Silently fail — audio is non-critical
  }
}

// ───────────────────────────────────────────────────────────────
// 10. In-page script (executed in target tab context)
// ───────────────────────────────────────────────────────────────

function inPageCheckDaysScript(defaultServiceId = '4', isFirstCheck = false) {
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
    const serviceId =
      select?.value && select.value.trim() !== '' ? select.value : defaultServiceId;
    const selectedOption =
      select?.selectedOptions?.[0] ||
      (select && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null);
    const serviceName = selectedOption?.text?.trim() || 'Оформлення документів';

    const availableServices = select
      ? Array.from(select.options)
          .filter((opt) => opt.value && opt.value.trim() !== '')
          .map((opt) => ({ id: opt.value, name: opt.text.trim() }))
      : [];

    const pageHeading = document.querySelector('h1')?.textContent?.trim();
    const subdomain = window.location.hostname.split('.')[0] || '';
    const centerName =
      pageHeading ||
      (subdomain ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) : 'ДП Документ');

    const formData = new FormData();
    formData.append('form', 'days');
    formData.append('ServiceCenterId', center);
    formData.append('ServiceId', serviceId);
    formData.append(csrf, '1');

    return fetch(window.location.href, { method: 'POST', body: formData })
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
