// DP Slot Tracker Content Script
// Runs inside pasport.org.ua tabs to ensure the extension badge ticks continuously even when popup is closed

let badgeIntervalId = null;

function formatBadgeSeconds(seconds) {
  if (seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function stopLiveBadge() {
  if (badgeIntervalId !== null) {
    clearInterval(badgeIntervalId);
    badgeIntervalId = null;
  }
}

function startLiveBadge(nextTimestamp) {
  stopLiveBadge();
  if (!nextTimestamp) return;

  const updateBadge = () => {
    const remaining = Math.max(0, Math.ceil((nextTimestamp - Date.now()) / 1000));
    if (remaining <= 0) {
      stopLiveBadge();
      // Signal background to trigger slot check immediately
      try {
        chrome.runtime.sendMessage({ type: 'TIME_TO_CHECK' }).catch(() => {});
      } catch {
        // Extension context may be reloading
      }
      return;
    }

    const text = formatBadgeSeconds(remaining);
    try {
      chrome.runtime.sendMessage({ type: 'BADGE_TICK', text }).catch(() => {});
    } catch {
      stopLiveBadge();
    }
  };

  updateBadge();
  badgeIntervalId = setInterval(updateBadge, 1000);
}

function handleStateUpdate(state) {
  if (!state || !state.isRunning || state.status === 'found' || !state.nextCheckTimestamp) {
    stopLiveBadge();
    return;
  }

  // Only run live timer if this tab is on the queue page
  if (window.location.pathname.includes('/solutions/e-queue')) {
    startLiveBadge(state.nextCheckTimestamp);
  } else {
    stopLiveBadge();
  }
}

// Initial check on page load
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get('dp_slot_tracker_state', (data) => {
    handleStateUpdate(data?.dp_slot_tracker_state);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.dp_slot_tracker_state) {
      handleStateUpdate(changes.dp_slot_tracker_state.newValue);
    }
  });
}

