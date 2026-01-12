import type { Locale } from './locales';

// English messages
import enCommon from '@/messages/en/common.json';
import enAuth from '@/messages/en/auth.json';
import enNav from '@/messages/en/nav.json';
import enCompute from '@/messages/en/compute.json';
import enHistory from '@/messages/en/history.json';

// German messages
import deCommon from '@/messages/de/common.json';
import deAuth from '@/messages/de/auth.json';
import deNav from '@/messages/de/nav.json';
import deCompute from '@/messages/de/compute.json';
import deHistory from '@/messages/de/history.json';

// French messages
import frCommon from '@/messages/fr/common.json';
import frAuth from '@/messages/fr/auth.json';
import frNav from '@/messages/fr/nav.json';
import frCompute from '@/messages/fr/compute.json';
import frHistory from '@/messages/fr/history.json';

export type Messages = {
  common: typeof enCommon;
  auth: typeof enAuth;
  nav: typeof enNav;
  compute: typeof enCompute;
  history: typeof enHistory;
};

const messages: Record<Locale, Messages> = {
  en: { common: enCommon, auth: enAuth, nav: enNav, compute: enCompute, history: enHistory },
  de: { common: deCommon, auth: deAuth, nav: deNav, compute: deCompute, history: deHistory },
  fr: { common: frCommon, auth: frAuth, nav: frNav, compute: frCompute, history: frHistory },
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
