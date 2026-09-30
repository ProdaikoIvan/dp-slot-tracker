import { IconName, IconDefinition } from './icon.model';
import { DOCUMENT_ICON } from './document.icon';
import { EXTERNAL_LINK_ICON } from './external-link.icon';
import { REFRESH_ICON } from './refresh.icon';
import { PLAY_ICON } from './play.icon';
import { STOP_ICON } from './stop.icon';

export * from './icon.model';

export const ICON_REGISTRY: Record<IconName, IconDefinition> = {
  document: DOCUMENT_ICON,
  'external-link': EXTERNAL_LINK_ICON,
  refresh: REFRESH_ICON,
  play: PLAY_ICON,
  stop: STOP_ICON,
};
