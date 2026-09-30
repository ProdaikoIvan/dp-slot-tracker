export type IconName = 'document' | 'external-link' | 'refresh' | 'play' | 'stop' | 'location';

export interface IconDefinition {
  content: string;
  fill?: 'none' | 'currentColor';
  stroke?: 'none' | 'currentColor';
  strokeWidth?: number;
}
