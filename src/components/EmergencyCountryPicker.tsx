import { useEffect, useState } from 'react';
import {
  COUNTRY_CHANGE_EVENT,
  COUNTRY_OPTIONS,
  ResolvedService,
  resolveCallerService,
  setDeviceCountryOverride,
} from '../utils/emergency';

/** Emergency service for the phone this app is running on, with a way to correct the country. */
export const useCallerService = (): [ResolvedService, (country: string | null) => void] => {
  const [resolved, setResolved] = useState<ResolvedService>(() => resolveCallerService());
  useEffect(() => {
    const refresh = () => setResolved(resolveCallerService());
    window.addEventListener(COUNTRY_CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(COUNTRY_CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const choose = (country: string | null) => setDeviceCountryOverride(country);
  return [resolved, choose];
};

const SOURCE_LABEL: Record<ResolvedService['source'], string> = {
  chosen: 'set by you',
  address: 'from address',
  phone: 'from phone number',
  device: 'detected',
  default: 'not detected',
};

interface EmergencyCountryPickerProps {
  resolved: ResolvedService;
  onChange: (country: string | null) => void;
  tone?: 'dark' | 'light';
}

/** "I'm in: India (detected) ▾" — lets the person fix the country this phone dials for. */
export default function EmergencyCountryPicker({ resolved, onChange, tone = 'light' }: EmergencyCountryPickerProps) {
  const dark = tone === 'dark';
  return (
    <label className={`inline-flex items-center gap-1.5 text-[11px] ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
      <span>This phone is in</span>
      <select
        aria-label="Country this phone is in"
        value={resolved.source === 'default' ? '' : resolved.service.country}
        onChange={(e) => onChange(e.target.value || null)}
        className={`rounded-lg px-2 py-1 text-[11px] font-semibold cursor-pointer border ${
          dark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        <option value="">Auto-detect</option>
        {COUNTRY_OPTIONS.map((c) => (
          <option key={c.country} value={c.country}>
            {c.name}
          </option>
        ))}
      </select>
      <span className={dark ? 'text-slate-500' : 'text-slate-400'}>({SOURCE_LABEL[resolved.source]})</span>
    </label>
  );
}
