// Keeps the app's patients in step with the cloud (Supabase) while the phone is signed in to cloud sync.
//
// - On sign-in (and whenever a linked phone saves), patients are loaded from the cloud. Cloud wins.
// - Local edits are saved back a moment after they happen, one transaction per patient.
// - Vital signs are stored as history, at most once a minute per patient.
// Without cloud sync set up, nothing here runs and the app keeps using this browser's storage only.

import { useEffect, useRef, useState } from 'react';
import type { PatientProfile, VitalsReading } from '../types';
import {
  CloudPatientRow,
  addCloudReading,
  isBackendEnabled,
  loadCloudPatients,
  onCloudUserChange,
  savePatientToCloud,
  subscribeToPatientChanges,
} from './backend';
import { INITIAL_THRESHOLDS, INITIAL_VITALS } from './mockData';

// --- Status shown in the Link phones panel ---------------------------------------

export interface CloudSyncStatus {
  state: 'off' | 'idle' | 'saving' | 'error';
  lastSavedAt: string | null;
  error: string | null;
}

let status: CloudSyncStatus = { state: 'off', lastSavedAt: null, error: null };
const listeners = new Set<(s: CloudSyncStatus) => void>();
const setStatus = (next: Partial<CloudSyncStatus>) => {
  status = { ...status, ...next };
  listeners.forEach((l) => l(status));
};

export const useCloudSyncStatus = (): CloudSyncStatus => {
  const [s, setS] = useState(status);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
};

// --- Mapping between the app's patient and the cloud row -------------------------

const SHARED_PREFIX = 'cloud-';

// Cloud ids of the patients this phone owns, learned from saves and loads.
const cloudIdByLocal = new Map<string, string>();

// JSON with sorted keys, so the same data always gives the same text.
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stable((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
};

// What counts as "changed": everything except live readings and fast-moving device telemetry.
const fingerprint = (p: PatientProfile): string =>
  stable({
    name: p.name,
    relationship: p.relationship,
    age: p.age,
    gender: p.gender,
    roomOrUnit: p.roomOrUnit,
    primaryCondition: p.primaryCondition,
    avatarBg: p.avatarBg,
    location: p.location,
    thresholds: p.thresholds,
    contacts: p.emergencyContacts,
    medications: p.medications,
    doseLogs: p.doseLogs,
    devices: (p.devices || []).map((d) => ({ id: d.id, name: d.name, brand: d.brand, category: d.category, connected: d.connected, macAddress: d.macAddress })),
  });

const toPayload = (p: PatientProfile, vitals?: VitalsReading): Record<string, unknown> => ({
  ...(p.id.startsWith(SHARED_PREFIX) ? { cloud_id: p.id.slice(SHARED_PREFIX.length) } : { local_id: p.id }),
  full_name: p.name,
  relationship: p.relationship,
  age: Number.isFinite(p.age) ? p.age : null,
  gender: p.gender,
  room_or_unit: p.roomOrUnit,
  primary_condition: p.primaryCondition,
  avatar_bg: p.avatarBg,
  location: p.location ?? null,
  latest_vitals: vitals ?? p.vitals ?? null,
  thresholds: p.thresholds,
  contacts: p.emergencyContacts || [],
  medications: p.medications || [],
  devices: p.devices || [],
  dose_logs: p.doseLogs || [],
});

const dataOf = <T,>(rows: { data: unknown }[] | null | undefined): T[] => (rows || []).map((r) => r.data as T);

// Cloud versions win, in the order this phone already shows them; new cloud items go at the end.
// keepLocalExtras: keep local items the cloud did not send (dose history is paged, so absence isn't deletion).
const mergeById = <T extends { id: string }>(local: T[] | undefined, cloud: T[], keepLocalExtras = false): T[] => {
  const cloudById = new Map(cloud.map((c) => [c.id, c]));
  const localIds = new Set((local || []).map((l) => l.id));
  const ordered = (local || []).flatMap((l) => (cloudById.has(l.id) ? [cloudById.get(l.id) as T] : keepLocalExtras ? [l] : []));
  return [...ordered, ...cloud.filter((c) => !localIds.has(c.id))];
};

const fromRow = (row: CloudPatientRow, me: string, local: PatientProfile | undefined): PatientProfile => {
  const thresholdsRow = Array.isArray(row.thresholds) ? row.thresholds[0] : row.thresholds;
  const cloudContacts = dataOf<PatientProfile['emergencyContacts'][number]>(row.emergency_contacts).sort(
    (a, b) => (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99),
  );

  return {
    ...(local as PatientProfile),
    id: row.owner_id === me ? row.local_id : `${SHARED_PREFIX}${row.id}`,
    name: row.full_name,
    relationship: row.relationship,
    age: row.age ?? local?.age ?? 0,
    gender: row.gender,
    roomOrUnit: row.room_or_unit,
    primaryCondition: row.primary_condition,
    avatarBg: row.avatar_bg || local?.avatarBg || 'bg-teal-500',
    location: (row.location as unknown as PatientProfile['location']) ?? local?.location,
    vitals: local?.vitals ?? ((row.latest_vitals as unknown as VitalsReading) || INITIAL_VITALS),
    thresholds: (thresholdsRow?.limits as PatientProfile['thresholds']) ?? local?.thresholds ?? INITIAL_THRESHOLDS,
    emergencyContacts: mergeById(local?.emergencyContacts, cloudContacts),
    medications: mergeById(local?.medications, dataOf(row.medications)),
    devices: mergeById(local?.devices, dataOf(row.devices)),
    doseLogs: mergeById(local?.doseLogs, dataOf(row.dose_logs), true),
  };
};

// --- The hook App uses -------------------------------------------------------------

interface CloudPatientSyncOptions {
  /** Changes when the app's own signed-in user changes, to reload the cloud copy. */
  userKey: string;
  /** Patients as the app sees them now (the active one with its live edits applied). */
  patients: PatientProfile[];
  activePatientId: string;
  activeVitals: VitalsReading;
  /** Called with the merged list after loading from the cloud. */
  onPulled: (patients: PatientProfile[]) => void;
}

export const useCloudPatientSync = ({ userKey, patients, activePatientId, activeVitals, onPulled }: CloudPatientSyncOptions) => {
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [pulledOnce, setPulledOnce] = useState(false);
  const synced = useRef(new Map<string, string>()); // patient id -> fingerprint last saved/loaded
  const patientsRef = useRef(patients);
  patientsRef.current = patients;
  const onPulledRef = useRef(onPulled);
  onPulledRef.current = onPulled;
  const vitalsRef = useRef(activeVitals);
  vitalsRef.current = activeVitals;
  const activeIdRef = useRef(activePatientId);
  activeIdRef.current = activePatientId;

  useEffect(() => (isBackendEnabled() ? onCloudUserChange(setCloudUserId) : undefined), []);

  useEffect(() => {
    setStatus({ state: cloudUserId ? 'idle' : 'off', error: null });
  }, [cloudUserId]);

  // Load from the cloud on sign-in, on app-user change, and whenever a linked phone saves.
  useEffect(() => {
    if (!cloudUserId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pull = async () => {
      try {
        const rows = await loadCloudPatients();
        if (cancelled) return;
        const current = patientsRef.current;
        const merged = [...current];
        let changed = false;
        for (const row of rows) {
          const id = row.owner_id === cloudUserId ? row.local_id : `${SHARED_PREFIX}${row.id}`;
          if (row.owner_id === cloudUserId) cloudIdByLocal.set(row.local_id, row.id);
          const index = merged.findIndex((p) => p.id === id);
          // The app's own data for a patient it has never saved is not in the cloud yet: leave it alone.
          const next = fromRow(row, cloudUserId, index >= 0 ? merged[index] : undefined);
          const print = fingerprint(next);
          synced.current.set(id, print);
          if (index >= 0) {
            if (fingerprint(merged[index]) !== print) {
              merged[index] = next;
              changed = true;
            }
          } else {
            merged.push(next);
            changed = true;
          }
        }
        if (changed) onPulledRef.current(merged);
        setPulledOnce(true);
      } catch (e) {
        setStatus({ state: 'error', error: e instanceof Error ? e.message : String(e) });
        setPulledOnce(true);
      }
    };

    setPulledOnce(false);
    void pull();
    const unsubscribe = subscribeToPatientChanges(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void pull(), 800);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [cloudUserId, userKey]);

  // Save local changes a moment after they happen (only after the first load, so the cloud copy wins).
  useEffect(() => {
    if (!cloudUserId || !pulledOnce) return;
    const dirty = patients.filter((p) => synced.current.get(p.id) !== fingerprint(p));
    if (!dirty.length) return;
    const timer = setTimeout(async () => {
      setStatus({ state: 'saving' });
      try {
        for (const p of dirty) {
          const print = fingerprint(p);
          const cloudId = await savePatientToCloud(toPayload(p, p.id === activeIdRef.current ? vitalsRef.current : undefined));
          if (!p.id.startsWith(SHARED_PREFIX)) cloudIdByLocal.set(p.id, cloudId);
          synced.current.set(p.id, print);
        }
        setStatus({ state: 'idle', lastSavedAt: new Date().toISOString(), error: null });
      } catch (e) {
        setStatus({ state: 'error', error: e instanceof Error ? e.message : String(e) });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [patients, cloudUserId, pulledOnce]);

  // Vital-sign history: one reading a minute for the patient on screen, when there is a real reading.
  useEffect(() => {
    if (!cloudUserId) return;
    let lastSent = '';
    const tick = () => {
      const id = activeIdRef.current;
      const v = vitalsRef.current;
      if (!v || !v.heartRate || synced.current.get(id) === undefined) return;
      const cloudId = id.startsWith(SHARED_PREFIX) ? id.slice(SHARED_PREFIX.length) : cloudIdByLocal.get(id);
      if (!cloudId) return;
      const key = `${id}|${v.timestamp}|${v.heartRate}|${v.spo2}|${v.bloodPressureSystolic}`;
      if (key === lastSent) return;
      lastSent = key;
      void addCloudReading(cloudId, v).catch(() => undefined);
    };
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [cloudUserId]);
};
