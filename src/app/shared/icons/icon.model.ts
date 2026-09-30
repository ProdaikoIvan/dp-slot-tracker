export type IconName = 'document' | 'external-link' | 'refresh' | 'play' | 'stop';

export interface IconDefinition {
  content: string;
  fill?: 'none' | 'currentColor';
  stroke?: 'none' | 'currentColor';
  strokeWidth?: number;
}
