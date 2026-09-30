import { SupportedCenter } from '../models/center.model';

export const SUPPORTED_CENTERS: SupportedCenter[] = [
  // 🇪🇸 Іспанія
  {
    id: 'madrid',
    subdomain: 'madrid',
    name: 'Мадрид',
    country: 'Іспанія',
    countryCode: 'ES',
    flag: '🇪🇸',
    address: 'Blvr. de José Prat, 35, Vicálvaro',
    queueUrl: 'https://madrid.pasport.org.ua/solutions/e-queue',
  },
  {
    id: 'valencia',
    subdomain: 'valencia',
    name: 'Валенсія',
    country: 'Іспанія',
    countryCode: 'ES',
    flag: '🇪🇸',
    address: 'Av. de Pius XII, 2',
    queueUrl: 'https://valencia.pasport.org.ua/solutions/e-queue',
  },
  {
    id: 'barcelona',
    subdomain: 'barcelona',
    name: 'Барселона',
    country: 'Іспанія',
    countryCode: 'ES',
    flag: '🇪🇸',
    address: 'Av. del Segle XXI, 6',
    queueUrl: 'https://barcelona.pasport.org.ua/solutions/e-queue',
  },

  // 🇩🇪 Німеччина
  {
    id: 'berlin',
    subdomain: 'berlin',
    name: 'Берлін',
    country: 'Німеччина',
    countryCode: 'DE',
    flag: '🇩🇪',
    address: 'Am Treptower Park 14',
    queueUrl: 'https://berlin.pasport.org.ua/solutions/e-queue',
  },
  {
    id: 'cologne',
    subdomain: 'cologne',
    name: 'Кельн',
    country: 'Німеччина',
    countryCode: 'DE',
    flag: '🇩🇪',
    address: 'Händelstraße 25-29',
    queueUrl: 'https://cologne.pasport.org.ua/solutions/e-queue',
  },
  {
    id: 'munchen',
    subdomain: 'munchen',
    name: 'Мюнхен',
    country: 'Німеччина',
    countryCode: 'DE',
    flag: '🇩🇪',
    address: 'Heinrich-Wieland-Str. 5',
    queueUrl: 'https://munchen.pasport.org.ua/solutions/e-queue',
  },
];

const SUBDOMAIN_ALIASES: Record<string, string> = {
  koln: 'cologne',
  cologne: 'cologne',
  munich: 'munchen',
  munchen: 'munchen',
};

export function findSupportedCenter(subdomain: string): SupportedCenter | null {
  const key = subdomain.toLowerCase();
  const canonical = SUBDOMAIN_ALIASES[key] ?? key;
  return SUPPORTED_CENTERS.find((c) => c.subdomain === canonical) ?? null;
}
