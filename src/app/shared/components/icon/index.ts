import { IconName, IconDefinition } from './icon.model';
import { DOCUMENT_ICON } from './svg/document.icon';
import { EXTERNAL_LINK_ICON } from './svg/external-link.icon';
import { REFRESH_ICON } from './svg/refresh.icon';
import { PLAY_ICON } from './svg/play.icon';
import { STOP_ICON } from './svg/stop.icon';
import { LOCATION_ICON } from './svg/location.icon';
import { SETTINGS_ICON } from './svg/settings.icon';
import { BELL_ICON } from './svg/bell.icon';
import { BELL_OFF_ICON } from './svg/bell-off.icon';
import { CLOSE_ICON } from './svg/close.icon';
import { MAIL_ICON } from './svg/mail.icon';

export * from './icon.model';
export * from './icon.component';

export const ICON_REGISTRY: Record<IconName, IconDefinition> = {
  document: DOCUMENT_ICON,
  'external-link': EXTERNAL_LINK_ICON,
  refresh: REFRESH_ICON,
  play: PLAY_ICON,
  stop: STOP_ICON,
  location: LOCATION_ICON,
  settings: SETTINGS_ICON,
  bell: BELL_ICON,
  'bell-off': BELL_OFF_ICON,
  close: CLOSE_ICON,
  mail: MAIL_ICON,
};
