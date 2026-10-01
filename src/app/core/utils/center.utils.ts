import { SupportedCenter } from '../models/center.model';
import { SUPPORTED_CENTERS } from '../constants/centers.constants';

/** Маппінг альтернативних назв субдоменів до канонічних */
const SUBDOMAIN_ALIASES: Record<string, string> = {
  koln: 'cologne',
  cologne: 'cologne',
  munich: 'munchen',
  munchen: 'munchen',
};

/** Знайти підтримуваний центр за назвою субдомену */
export function findSupportedCenter(subdomain: string): SupportedCenter | null {
  const key = subdomain.toLowerCase();
  const canonical = SUBDOMAIN_ALIASES[key] ?? key;
  return SUPPORTED_CENTERS.find((c) => c.subdomain === canonical) ?? null;
}
