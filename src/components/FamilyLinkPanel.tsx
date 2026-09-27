import { useEffect, useState } from 'react';
import { Link2, Smartphone, KeyRound, Copy, Check, X, Bell, Unlink, LogOut, Cloud, Share2 } from 'lucide-react';
import {
  isBackendEnabled,
  sendSignInCode,
  verifySignInCode,
  getCloudUserId,
  signOutCloud,
  createInvite,
  acceptInvite,
  listLinkedPeople,
  unlink,
  recentAlerts,
  acknowledgeAlert,
  subscribeToAlerts,
  CloudAlert,
  CloudRole,
  CloudProfile,
  CloudLink,
} from '../utils/backend';
import { useCloudSyncStatus } from '../utils/cloudSync';

interface FamilyLinkPanelProps {
  onClose: () => void;
  /** The person on screen: an invite code links whoever accepts it to this patient's data. */
  patient?: { id: string; name: string };
}

type Linked = { link: CloudLink; person: CloudProfile; theyAre: 'caregiver' | 'senior' };

const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-teal-500';
const primaryBtn = 'whitespace-nowrap px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-xs font-bold cursor-pointer';
const ghostBtn = 'px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold cursor-pointer';

export default function FamilyLinkPanel({ onClose, patient }: FamilyLinkPanelProps) {
  const sync = useCloudSyncStatus();
  const enabled = isBackendEnabled();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign-in
  const [name, setName] = useState('');
  const [role, setRole] = useState<CloudRole>('family_caregiver');
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');

  // Linking
  const [inviteFor, setInviteFor] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acceptCode, setAcceptCode] = useState('');
  const [linked, setLinked] = useState<Linked[]>([]);
  const [alerts, setAlerts] = useState<CloudAlert[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    const [people, latest] = await Promise.all([listLinkedPeople(), recentAlerts()]);
    setLinked(people);
    setAlerts(latest);
  };

  useEffect(() => {
    if (!enabled) return;
    getCloudUserId()
      .then((id) => setUserId(id))
      .catch(() => setUserId(null))
      .finally(() => setChecking(false));
  }, [enabled]);

  useEffect(() => {
    if (!userId) return;
    void refresh().catch(() => undefined);
    return subscribeToAlerts((a) => setAlerts((prev) => [a, ...prev.filter((p) => p.id !== a.id)].slice(0, 10)));
  }, [userId]);

  const nameFor = (seniorId: string) =>
    seniorId === userId ? 'You' : linked.find((l) => l.person.id === seniorId)?.person.full_name || 'Family member';

  const inviteMessage = inviteCode
    ? `Join me on KINOTE so I get alerts if you need help. Open the app, tap "Link phones" and enter code ${inviteCode}.`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-teal-700" />
            <span>Link family phones</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        {notice && <p className="text-[11px] text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">{notice}</p>}

        {/* Not configured yet */}
        {!enabled && (
          <div className="space-y-2 text-xs text-slate-600">
            <p className="flex items-start gap-2">
              <Cloud className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                Cloud sync isn't switched on yet. Once it is, a caregiver and a parent can link their phones here, and an SOS
                on the parent's phone alerts every linked caregiver by call and SMS.
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Setup: add <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> (see docs/BACKEND_SETUP.md).
            </p>
          </div>
        )}

        {enabled && checking && <p className="text-xs text-slate-500">Checking sign-in…</p>}

        {/* Sign in with SMS code */}
        {enabled && !checking && !userId && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">Sign in with your mobile number. We'll text you a 6-digit code.</p>
            {!codeSent ? (
              <>
                <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  {(['family_caregiver', 'senior_patient'] as CloudRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                        role === r ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {r === 'family_caregiver' ? 'I am a caregiver' : 'I am the parent / senior'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="cloud-phone"
                    type="tel"
                    className={`${inputClass} pl-8`}
                    placeholder="Mobile number, e.g. 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button
                  className={`${primaryBtn} w-full`}
                  disabled={busy || !phone.trim()}
                  onClick={() =>
                    run(async () => {
                      await sendSignInCode(phone, { full_name: name.trim(), role });
                      setCodeSent(true);
                    })
                  }
                >
                  {busy ? 'Sending…' : 'Send code'}
                </button>
              </>
            ) : (
              <>
                <input
                  id="cloud-code"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputClass} tracking-[0.4em] text-center font-mono text-base`}
                  placeholder="••••••"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                />
                <div className="flex gap-2">
                  <button className={ghostBtn} onClick={() => setCodeSent(false)}>
                    Change number
                  </button>
                  <button
                    className={`${primaryBtn} flex-1`}
                    disabled={busy || smsCode.length < 6}
                    onClick={() =>
                      run(async () => {
                        await verifySignInCode(phone, smsCode);
                        setUserId(await getCloudUserId());
                      })
                    }
                  >
                    {busy ? 'Checking…' : 'Verify & sign in'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Signed in */}
        {enabled && userId && (
          <div className="space-y-4 text-xs">
            <p
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] ${
                sync.state === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              {sync.state === 'error'
                ? `Health data not synced: ${sync.error}`
                : sync.state === 'saving'
                  ? 'Saving health data…'
                  : sync.lastSavedAt
                    ? `Health data synced · ${new Date(sync.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Health data syncs with linked phones'}
            </p>
            {/* Invite (caregiver side) */}
            <section className="space-y-2">
              <p className="font-bold text-slate-800">Invite {patient ? patient.name : 'a parent / loved one'}</p>
              {patient && (
                <p className="text-[11px] text-slate-500">
                  Whoever accepts this code joins as {patient.name} and sees {patient.name}'s health data.
                </p>
              )}
              {!inviteCode ? (
                <div className="flex gap-2">
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="Their mobile (optional)"
                    value={inviteFor}
                    onChange={(e) => setInviteFor(e.target.value)}
                  />
                  <button
                    className={primaryBtn}
                    disabled={busy}
                    onClick={() => run(async () => setInviteCode(await createInvite(inviteFor, patient?.id)))}
                  >
                    Create code
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
                  <p className="text-[11px] text-teal-800">Share this code. It works once and expires in 48 hours.</p>
                  <p className="font-mono text-2xl font-black tracking-[0.3em] text-teal-900 text-center">{inviteCode}</p>
                  <div className="flex gap-2">
                    <button
                      className={`${ghostBtn} flex-1 flex items-center justify-center gap-1.5`}
                      onClick={() => {
                        void navigator.clipboard?.writeText(inviteMessage).catch(() => undefined);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy message'}</span>
                    </button>
                    <a
                      className={`${ghostBtn} flex-1 flex items-center justify-center gap-1.5 text-emerald-700`}
                      href={`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}
            </section>

            {/* Accept (parent side) */}
            <section className="space-y-2">
              <p className="font-bold text-slate-800">Got a code?</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className={`${inputClass} pl-8 uppercase font-mono tracking-widest`}
                    placeholder="ABC234"
                    maxLength={6}
                    value={acceptCode}
                    onChange={(e) => setAcceptCode(e.target.value.toUpperCase())}
                  />
                </div>
                <button
                  className={primaryBtn}
                  disabled={busy || acceptCode.trim().length < 6}
                  onClick={() =>
                    run(async () => {
                      await acceptInvite(acceptCode);
                      setAcceptCode('');
                      setNotice('Linked. Your caregiver will now get your SOS alerts.');
                      await refresh();
                    })
                  }
                >
                  Link
                </button>
              </div>
            </section>

            {/* Linked people */}
            <section className="space-y-2">
              <p className="font-bold text-slate-800">Linked ({linked.length})</p>
              {linked.length === 0 ? (
                <p className="text-slate-500">No one linked yet.</p>
              ) : (
                linked.map(({ link, person, theyAre }) => (
                  <div key={link.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-semibold text-slate-900">{person.full_name || 'Unnamed'}</p>
                      <p className="text-[11px] text-slate-500">
                        {theyAre === 'senior' ? 'You look after them' : 'Looks after you'} · {person.phone || 'no number'}
                      </p>
                    </div>
                    <button
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Unlink"
                      aria-label={`Unlink ${person.full_name}`}
                      onClick={() => run(async () => { await unlink(link.id); await refresh(); })}
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </section>

            {/* Live alerts */}
            <section className="space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-500" />
                <span>Live alerts</span>
              </p>
              {alerts.length === 0 ? (
                <p className="text-slate-500">No alerts. New ones appear here instantly.</p>
              ) : (
                alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2.5 rounded-xl border ${a.status === 'open' ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">
                        {nameFor(a.senior_id)} · {a.kind.replace('_', ' ').toUpperCase()}
                      </p>
                      <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{a.message}</p>
                    {a.status === 'open' && (
                      <button
                        className="mt-1.5 text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                        onClick={() =>
                          run(async () => {
                            await acknowledgeAlert(a.id);
                            setAlerts((prev) => prev.map((p) => (p.id === a.id ? { ...p, status: 'acknowledged' } : p)));
                          })
                        }
                      >
                        I'm on it
                      </button>
                    )}
                  </div>
                ))
              )}
            </section>

            <button
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              onClick={() => run(async () => { await signOutCloud(); setUserId(null); })}
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out of cloud sync</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
