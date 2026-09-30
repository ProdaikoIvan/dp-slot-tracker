export const APP_CONFIG = {
  name: 'DP Slot Tracker',
  version: '1.0.0',
  description: 'Chrome extension for tracking delivery and appointment slots',
} as const;

export const STORAGE_KEYS = {
  settings: 'dp_slot_tracker_settings',
  slots: 'dp_slot_tracker_slots',
  lastSync: 'dp_slot_tracker_last_sync',
} as const;
