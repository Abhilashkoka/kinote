// Emergency numbers by country, and how KINOTE picks the right one.
//
// A phone can only reach the emergency services of the country it is physically in, so there are two questions:
//   1. Where is THIS phone?        -> the number the Call button dials (resolveCallerService)
//   2. Where is the monitored person? -> the numbers someone near them must dial (resolvePatientService)
// When the two differ, the app says so instead of dialling a number that won't connect.

export interface EmergencyService {
  country: string; // ISO 3166-1 alpha-2, e.g. "IN"
  name: string;
  /** Main number for a medical emergency. */
  primary: string;
  /** Dedicated ambulance number, when it differs from `primary`. */
  ambulance?: string;
  /** Short note shown under the button. */
  note?: string;
}

const EU_112 = (country: string, name: string): EmergencyService => ({ country, name, primary: '112' });

// Kept to well-established national numbers. Anything missing falls back to 112 (see DEFAULT_SERVICE).
export const EMERGENCY_SERVICES: Record<string, EmergencyService> = {
  IN: { country: 'IN', name: 'India', primary: '112', ambulance: '108', note: '112 for all emergencies · 108 for ambulance in most states' },
  US: { country: 'US', name: 'United States', primary: '911' },
  CA: { country: 'CA', name: 'Canada', primary: '911' },
  PR: { country: 'PR', name: 'Puerto Rico', primary: '911' },
  MX: { country: 'MX', name: 'Mexico', primary: '911' },
  PH: { country: 'PH', name: 'Philippines', primary: '911' },
  GB: { country: 'GB', name: 'United Kingdom', primary: '999', note: '112 also works' },
  IE: { country: 'IE', name: 'Ireland', primary: '112', note: '999 also works' },
  AU: { country: 'AU', name: 'Australia', primary: '000', note: '112 also works from mobiles' },
  NZ: { country: 'NZ', name: 'New Zealand', primary: '111' },
  JP: { country: 'JP', name: 'Japan', primary: '119', note: '119 for ambulance and fire · 110 for police' },
  KR: { country: 'KR', name: 'South Korea', primary: '119' },
  CN: { country: 'CN', name: 'China', primary: '120', note: '120 for ambulance · 110 for police' },
  HK: { country: 'HK', name: 'Hong Kong', primary: '999' },
  SG: { country: 'SG', name: 'Singapore', primary: '995', note: '995 for ambulance · 999 for police' },
  MY: { country: 'MY', name: 'Malaysia', primary: '999', note: '112 also works from mobiles' },
  TH: { country: 'TH', name: 'Thailand', primary: '1669', note: '1669 for ambulance · 191 for police' },
  ID: { country: 'ID', name: 'Indonesia', primary: '112', ambulance: '119' },
  VN: { country: 'VN', name: 'Vietnam', primary: '115', note: '115 for ambulance · 113 for police' },
  AE: { country: 'AE', name: 'United Arab Emirates', primary: '998', note: '998 for ambulance · 999 for police' },
  SA: { country: 'SA', name: 'Saudi Arabia', primary: '997', note: '997 for ambulance · 911 unified number in major cities' },
  QA: { country: 'QA', name: 'Qatar', primary: '999' },
  KW: { country: 'KW', name: 'Kuwait', primary: '112' },
  OM: { country: 'OM', name: 'Oman', primary: '9999' },
  PK: { country: 'PK', name: 'Pakistan', primary: '1122', ambulance: '115', note: '1122 Rescue · 115 Edhi ambulance' },
  BD: { country: 'BD', name: 'Bangladesh', primary: '999' },
  LK: { country: 'LK', name: 'Sri Lanka', primary: '1990', note: '1990 Suwa Seriya ambulance · 119 for police' },
  NP: { country: 'NP', name: 'Nepal', primary: '102', note: '102 for ambulance · 100 for police' },
  ZA: { country: 'ZA', name: 'South Africa', primary: '10177', note: '10177 for ambulance · 112 from mobiles' },
  NG: { country: 'NG', name: 'Nigeria', primary: '112' },
  KE: { country: 'KE', name: 'Kenya', primary: '999', note: '112 also works' },
  EG: { country: 'EG', name: 'Egypt', primary: '123', note: '123 for ambulance · 122 for police' },
  BR: { country: 'BR', name: 'Brazil', primary: '192', note: '192 SAMU ambulance · 190 for police' },
  AR: { country: 'AR', name: 'Argentina', primary: '107', note: '107 for ambulance · 911 in many cities' },
  CL: { country: 'CL', name: 'Chile', primary: '131', note: '131 for ambulance' },
  CO: { country: 'CO', name: 'Colombia', primary: '123' },
  RU: { country: 'RU', name: 'Russia', primary: '112', ambulance: '103' },
  TR: { country: 'TR', name: 'Turkey', primary: '112' },
  IL: { country: 'IL', name: 'Israel', primary: '101', note: '101 Magen David Adom ambulance' },
  CH: { country: 'CH', name: 'Switzerland', primary: '112', ambulance: '144' },
  NO: { country: 'NO', name: 'Norway', primary: '112', ambulance: '113', note: '113 for medical emergencies' },
  IS: EU_112('IS', 'Iceland'),
  DE: EU_112('DE', 'Germany'),
  FR: { country: 'FR', name: 'France', primary: '112', ambulance: '15', note: '15 SAMU medical line' },
  IT: { country: 'IT', name: 'Italy', primary: '112', ambulance: '118' },
  ES: EU_112('ES', 'Spain'),
  NL: EU_112('NL', 'Netherlands'),
  BE: EU_112('BE', 'Belgium'),
  AT: { country: 'AT', name: 'Austria', primary: '112', ambulance: '144' },
  PT: EU_112('PT', 'Portugal'),
  SE: EU_112('SE', 'Sweden'),
  DK: EU_112('DK', 'Denmark'),
  FI: EU_112('FI', 'Finland'),
  PL: EU_112('PL', 'Poland'),
  CZ: EU_112('CZ', 'Czechia'),
  SK: EU_112('SK', 'Slovakia'),
  HU: EU_112('HU', 'Hungary'),
  RO: EU_112('RO', 'Romania'),
  BG: EU_112('BG', 'Bulgaria'),
  GR: EU_112('GR', 'Greece'),
  HR: EU_112('HR', 'Croatia'),
  SI: EU_112('SI', 'Slovenia'),
  EE: EU_112('EE', 'Estonia'),
  LV: EU_112('LV', 'Latvia'),
  LT: EU_112('LT', 'Lithuania'),
  LU: EU_112('LU', 'Luxembourg'),
  MT: EU_112('MT', 'Malta'),
  CY: EU_112('CY', 'Cyprus'),
};

// 112 is the GSM standard number: most mobile networks route it to local emergency services.
export const DEFAULT_SERVICE: EmergencyService = {
  country: '',
  name: 'your area',
  primary: '112',
  note: 'Country not set · 112 works from most mobile phones',
};

export const COUNTRY_OPTIONS = Object.values(EMERGENCY_SERVICES).sort((a, b) => a.name.localeCompare(b.name));

export const serviceFor = (country?: string | null): EmergencyService =>
  (country && EMERGENCY_SERVICES[country.toUpperCase()]) || DEFAULT_SERVICE;

export const telLink = (number: string) => `tel:${number}`;

// ---------------------------------------------------------------------------
// Country detection
// ---------------------------------------------------------------------------

// International dialling codes for the countries above (longest match wins).
const DIAL_CODES: Record<string, string> = {
  '1': 'US', '91': 'IN', '44': 'GB', '353': 'IE', '61': 'AU', '64': 'NZ', '81': 'JP', '82': 'KR', '86': 'CN',
  '852': 'HK', '65': 'SG', '60': 'MY', '66': 'TH', '62': 'ID', '84': 'VN', '63': 'PH', '52': 'MX', '971': 'AE',
  '966': 'SA', '974': 'QA', '965': 'KW', '968': 'OM', '92': 'PK', '880': 'BD', '94': 'LK', '977': 'NP', '27': 'ZA',
  '234': 'NG', '254': 'KE', '20': 'EG', '55': 'BR', '54': 'AR', '56': 'CL', '57': 'CO', '7': 'RU', '90': 'TR',
  '972': 'IL', '41': 'CH', '47': 'NO', '354': 'IS', '49': 'DE', '33': 'FR', '39': 'IT', '34': 'ES', '31': 'NL',
  '32': 'BE', '43': 'AT', '351': 'PT', '46': 'SE', '45': 'DK', '358': 'FI', '48': 'PL', '420': 'CZ', '421': 'SK',
  '36': 'HU', '40': 'RO', '359': 'BG', '30': 'GR', '385': 'HR', '386': 'SI', '372': 'EE', '371': 'LV', '370': 'LT',
  '352': 'LU', '356': 'MT', '357': 'CY',
};

/** Country from an international number ("+91 98765 43210" -> "IN"). Numbers without "+" are ignored. */
export const countryFromPhone = (phone?: string | null): string | null => {
  if (!phone || !phone.trim().startsWith('+')) return null;
  const digits = phone.replace(/\D/g, '');
  for (let len = 3; len >= 1; len--) {
    const code = DIAL_CODES[digits.slice(0, len)];
    if (code) return code;
  }
  return null;
};

const ADDRESS_ALIASES: Record<string, string> = {
  usa: 'US', 'u.s.a.': 'US', 'u.s.': 'US', america: 'US', 'united states of america': 'US',
  uk: 'GB', 'u.k.': 'GB', england: 'GB', scotland: 'GB', wales: 'GB', 'great britain': 'GB',
  uae: 'AE', 'u.a.e.': 'AE', dubai: 'AE', 'abu dhabi': 'AE', bharat: 'IN', 'south korea': 'KR', korea: 'KR',
  holland: 'NL', czech: 'CZ', 'czech republic': 'CZ', 'hong kong sar': 'HK',
};

/** Country named at the end of an address ("…, Hyderabad, India" -> "IN"). */
export const countryFromAddress = (address?: string | null): string | null => {
  if (!address) return null;
  const parts = address.toLowerCase().split(/[,\n]/).map((p) => p.replace(/\d+/g, '').trim()).filter(Boolean);
  for (const part of parts.reverse()) {
    if (ADDRESS_ALIASES[part]) return ADDRESS_ALIASES[part];
    const match = Object.values(EMERGENCY_SERVICES).find((s) => s.name.toLowerCase() === part);
    if (match) return match.country;
  }
  return null;
};

const TIMEZONE_COUNTRY: Record<string, string> = {
  'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Manila': 'PH', 'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM', 'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD', 'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP', 'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE', 'Africa/Cairo': 'EG', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'Asia/Jerusalem': 'IL',
  'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU',
};

/** Best guess at where this phone/computer is, from its language region and time zone. */
export const detectDeviceCountry = (): string | null => {
  try {
    const langs = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
    for (const lang of langs) {
      const region = lang.split('-')[1];
      if (region && EMERGENCY_SERVICES[region.toUpperCase()]) return region.toUpperCase();
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONE_COUNTRY[tz]) return TIMEZONE_COUNTRY[tz];
    if (tz.startsWith('America/')) return null; // too many countries share these zones
  } catch {
    // ignore
  }
  return null;
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

export type CountrySource = 'chosen' | 'address' | 'phone' | 'device' | 'default';

export interface ResolvedService {
  service: EmergencyService;
  source: CountrySource;
}

const DEVICE_OVERRIDE_KEY = 'kinote_device_country';

/** Country picked by hand for this phone ("I'm in…"), kept on this device only. */
export const getDeviceCountryOverride = (): string | null => {
  try {
    return localStorage.getItem(DEVICE_OVERRIDE_KEY);
  } catch {
    return null;
  }
};

export const COUNTRY_CHANGE_EVENT = 'kinote:emergency-country';

export const setDeviceCountryOverride = (country: string | null) => {
  try {
    if (country) localStorage.setItem(DEVICE_OVERRIDE_KEY, country);
    else localStorage.removeItem(DEVICE_OVERRIDE_KEY);
  } catch {
    // ignore
  }
  // Let every open screen pick up the change
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(COUNTRY_CHANGE_EVENT));
};

/** The number THIS phone should dial: chosen country, else detected device country, else 112. */
export const resolveCallerService = (): ResolvedService => {
  const chosen = getDeviceCountryOverride();
  if (chosen && EMERGENCY_SERVICES[chosen]) return { service: EMERGENCY_SERVICES[chosen], source: 'chosen' };
  const device = detectDeviceCountry();
  if (device) return { service: EMERGENCY_SERVICES[device], source: 'device' };
  return { service: DEFAULT_SERVICE, source: 'default' };
};

/** Where the monitored person is: saved country on their address, else country named in it, else their phone's code. */
export const resolvePatientService = (input: {
  countryCode?: string | null;
  address?: string | null;
  phones?: (string | null | undefined)[];
}): ResolvedService | null => {
  if (input.countryCode && EMERGENCY_SERVICES[input.countryCode]) {
    return { service: EMERGENCY_SERVICES[input.countryCode], source: 'chosen' };
  }
  const fromAddress = countryFromAddress(input.address);
  if (fromAddress) return { service: EMERGENCY_SERVICES[fromAddress], source: 'address' };
  for (const phone of input.phones ?? []) {
    const fromPhone = countryFromPhone(phone);
    if (fromPhone) return { service: EMERGENCY_SERVICES[fromPhone], source: 'phone' };
  }
  return null;
};

// ---------------------------------------------------------------------------
// Other helpers
// ---------------------------------------------------------------------------

// Opens Google Maps searching for hospitals near the saved address, or near the phone's location.
export const nearestHospitalsUrl = (address?: string): string => {
  const near = address && address.trim() ? `hospital near ${address.trim()}` : 'hospital near me';
  return `https://www.google.com/maps/search/${encodeURIComponent(near)}`;
};
