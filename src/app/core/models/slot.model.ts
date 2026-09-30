export interface SlotItem {
  id: string;
  title: string;
  date: string;
  status: 'available' | 'booked' | 'expired';
  location?: string;
  notes?: string;
}

export interface TrackerSettings {
  autoRefreshIntervalMinutes: number;
  notificationsEnabled: boolean;
  soundAlerts: boolean;
}
