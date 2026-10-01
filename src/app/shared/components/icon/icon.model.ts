export type IconName =
  | 'document'
  | 'external-link'
  | 'refresh'
  | 'play'
  | 'stop'
  | 'location'
  | 'settings'
  | 'bell'
  | 'bell-off'
  | 'close'
  | 'mail';

export interface IconDefinition {
  content: string;
  fill?: 'none' | 'currentColor';
  stroke?: 'none' | 'currentColor';
  strokeWidth?: number;
}
