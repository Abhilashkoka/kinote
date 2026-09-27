// KINOTE cloud backend (Supabase): phone sign-in, caregiver <-> senior linking and live alerts.
//
// Turned on only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set. Without them the app
// keeps working exactly as before (single device, local storage), and nothing here is loaded.

import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

export const isBackendEnabled = (): boolean => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let clientPromise: Promise<SupabaseClient> | null = null;

// Loaded on demand so the Supabase library is not in the main bundle for local-only builds.
const getClient = (): Promise<SupabaseClient> => {
  if (!isBackendEnabled()) return Promise.reject(new Error('Cloud sync is not set up yet.'));
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, storageKey: 'kinote_cloud_session' } }),
    );
  }
  return clientPromise;
};

export type CloudRole = 'family_caregiver' | 'senior_patient';

export interface CloudProfile {
  id: string;
  full_name: string;
  phone: string | null;
  role: CloudRole;
}

export interface CloudLink {
  id: string;
  caregiver_id: string;
  senior_id: string;
  created_at: string;
}

export interface CloudAlert {
  id: string;
  senior_id: string;
  kind: 'sos' | 'vitals' | 'fall' | 'missed_dose' | 'escalation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  location: { label?: string; address?: string } | null;
  status: 'open' | 'acknowledged' | 'resolved';
  created_at: string;
}

// Turns "98765 43210" or "098765-43210" into "+919876543210". Defaults to India (+91).
export const normalizePhone = (raw: string, defaultCountryCode = '91'): string => {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+${defaultCountryCode}${digits.slice(1)}`;
  return `+${digits}`;
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// --- Sign-in (SMS code) -----------------------------------------------------

export const sendSignInCode = async (phone: string, profile?: { full_name: string; role: CloudRole }) => {
  const db = await getClient();
  const { error } = await db.auth.signInWithOtp({ phone: normalizePhone(phone), options: { data: profile } });
  fail(error);
};

export const verifySignInCode = async (phone: string, code: string) => {
  const db = await getClient();
  const { error } = await db.auth.verifyOtp({ phone: normalizePhone(phone), token: code.trim(), type: 'sms' });
  fail(error);
};

export const getCloudUserId = async (): Promise<string | null> => {
  if (!isBackendEnabled()) return null;
  const db = await getClient();
  const { data } = await db.auth.getSession();
  return data.session?.user.id ?? null;
};

export const signOutCloud = async () => {
  const db = await getClient();
  await db.auth.signOut();
};

export const updateMyProfile = async (fields: Partial<Pick<CloudProfile, 'full_name' | 'role'>>) => {
  const db = await getClient();
  const id = await getCloudUserId();
  if (!id) throw new Error('Sign in first.');
  const { error } = await db.from('profiles').update(fields).eq('id', id);
  fail(error);
};

// --- Linking ----------------------------------------------------------------

export const createInvite = async (seniorPhone?: string): Promise<string> => {
  const db = await getClient();
  const { data, error } = await db.rpc('create_invite', {
    p_senior_phone: seniorPhone ? normalizePhone(seniorPhone) : null,
  });
  fail(error);
  return data as string;
};

export const acceptInvite = async (code: string) => {
  const db = await getClient();
  const { error } = await db.rpc('accept_invite', { p_code: code });
  fail(error);
};

// Everyone linked to me, with their profile and which side of the link they are on.
export const listLinkedPeople = async (): Promise<{ link: CloudLink; person: CloudProfile; theyAre: 'caregiver' | 'senior' }[]> => {
  const db = await getClient();
  const me = await getCloudUserId();
  if (!me) return [];
  const { data: links, error } = await db.from('care_links').select('*');
  fail(error);
  const otherIds = (links ?? []).map((l: CloudLink) => (l.caregiver_id === me ? l.senior_id : l.caregiver_id));
  if (!otherIds.length) return [];
  const { data: people, error: peopleError } = await db.from('profiles').select('id, full_name, phone, role').in('id', otherIds);
  fail(peopleError);
  return (links ?? []).flatMap((link: CloudLink) => {
    const otherId = link.caregiver_id === me ? link.senior_id : link.caregiver_id;
    const person = (people ?? []).find((p: CloudProfile) => p.id === otherId);
    return person ? [{ link, person, theyAre: link.caregiver_id === me ? ('senior' as const) : ('caregiver' as const) }] : [];
  });
};

export const unlink = async (linkId: string) => {
  const db = await getClient();
  const { error } = await db.from('care_links').delete().eq('id', linkId);
  fail(error);
};

// --- Alerts -----------------------------------------------------------------

// Raises an alert for a senior (defaults to me). The escalate-alert function then calls/texts caregivers.
export const raiseCloudAlert = async (alert: {
  kind: CloudAlert['kind'];
  severity?: CloudAlert['severity'];
  message: string;
  location?: CloudAlert['location'];
  seniorId?: string;
}) => {
  const db = await getClient();
  const me = await getCloudUserId();
  if (!me) throw new Error('Sign in to cloud sync first.');
  const { error } = await db.from('alerts').insert({
    senior_id: alert.seniorId ?? me,
    raised_by: me,
    kind: alert.kind,
    severity: alert.severity ?? 'critical',
    message: alert.message,
    location: alert.location ?? null,
  });
  fail(error);
};

// Fire-and-forget version for SOS buttons: never blocks or breaks the local flow.
export const raiseCloudAlertIfSignedIn = (alert: Parameters<typeof raiseCloudAlert>[0]) => {
  if (!isBackendEnabled()) return;
  void getCloudUserId()
    .then((id) => (id ? raiseCloudAlert(alert) : undefined))
    .catch(() => undefined);
};

export const recentAlerts = async (limit = 10): Promise<CloudAlert[]> => {
  const db = await getClient();
  const { data, error } = await db.from('alerts').select('*').order('created_at', { ascending: false }).limit(limit);
  fail(error);
  return (data ?? []) as CloudAlert[];
};

export const acknowledgeAlert = async (alertId: string) => {
  const db = await getClient();
  const me = await getCloudUserId();
  const { error } = await db
    .from('alerts')
    .update({ status: 'acknowledged', acknowledged_by: me, acknowledged_at: new Date().toISOString() })
    .eq('id', alertId);
  fail(error);
};

// Live feed of new alerts for everyone I can see. Returns an unsubscribe function.
export const subscribeToAlerts = (onAlert: (alert: CloudAlert) => void): (() => void) => {
  let channel: RealtimeChannel | null = null;
  let cancelled = false;
  void getClient().then((db) => {
    if (cancelled) return;
    channel = db
      .channel('kinote-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) =>
        onAlert(payload.new as CloudAlert),
      )
      .subscribe();
  });
  return () => {
    cancelled = true;
    if (channel) void getClient().then((db) => db.removeChannel(channel as RealtimeChannel));
  };
};
