export type TrackerStatus = 'idle' | 'checking' | 'waiting' | 'found' | 'error';

export interface TrackerIntervalOption {
  readonly label: string;
  readonly seconds: number;
}

export const TRACKER_INTERVAL_OPTIONS: readonly TrackerIntervalOption[] = [
  { label: '1 хв', seconds: 60 },
  { label: '2 хв', seconds: 120 },
  { label: '3 хв', seconds: 180 },
  { label: '5 хв', seconds: 300 },
] as const;

export const DEFAULT_TRACKER_INTERVAL_SECONDS = 60;

export interface TrackerPersistedState {
  isRunning: boolean;
  status: TrackerStatus;
  intervalSeconds: number;
  targetTabId: number | null;
  foundDays: string[];
  lastMessage: string | null;
  nextCheckTimestamp: number | null;
  tabClosedNotice?: boolean;
  centerName?: string | null;
}
