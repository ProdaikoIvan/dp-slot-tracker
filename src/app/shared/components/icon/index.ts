import { IconName, IconDefinition } from './icon.model';
import { DOCUMENT_ICON } from './svg/document.icon';
import { EXTERNAL_LINK_ICON } from './svg/external-link.icon';
import { REFRESH_ICON } from './svg/refresh.icon';
import { PLAY_ICON } from './svg/play.icon';
import { STOP_ICON } from './svg/stop.icon';
import { LOCATION_ICON } from './svg/location.icon';

export * from './icon.model';
export * from './icon.component';

export const ICON_REGISTRY: Record<IconName, IconDefinition> = {
  document: DOCUMENT_ICON,
  'external-link': EXTERNAL_LINK_ICON,
  refresh: REFRESH_ICON,
  play: PLAY_ICON,
  stop: STOP_ICON,
  location: LOCATION_ICON,
};
