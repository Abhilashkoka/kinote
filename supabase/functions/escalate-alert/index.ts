// KINOTE escalate-alert: runs when a new row lands in public.alerts
// (Supabase Database Webhook -> this Edge Function).
//
// For every caregiver linked to the senior it sends an SMS and places a voice call
// through Exotel or Twilio, and logs each attempt in public.alert_events.
//
// Required secrets (supabase secrets set ...):
//   WEBHOOK_SECRET          shared secret, also set as the "x-webhook-secret" header on the webhook
//   TELEPHONY_PROVIDER      "exotel" | "twilio" | "none"   (none = log only, for testing)
// Exotel:
//   EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_CALLER_ID (your ExoPhone)
//   EXOTEL_SUBDOMAIN        default "api.exotel.com" (use "api.in.exotel.com" for the Mumbai cluster)
//   EXOTEL_FLOW_URL         call flow URL that plays the alert, e.g. http://my.exotel.com/<sid>/exoml/start_voice/<app_id>
//   EXOTEL_DLT_ENTITY_ID, EXOTEL_DLT_TEMPLATE_ID   (India DLT, needed for SMS)
// Twilio:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.

import { createClient } from 'npm:@supabase/supabase-js@2';

type AlertRow = {
  id: string;
  senior_id: string;
  kind: string;
  severity: string;
  message: string;
  location: { label?: string; address?: string } | null;
};

type SendResult = { ok: boolean; detail: unknown };

const env = (key: string, fallback = '') => Deno.env.get(key) ?? fallback;

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

async function exotelRequest(path: string, params: Record<string, string>): Promise<SendResult> {
  const sid = env('EXOTEL_SID');
  const url = `https://${env('EXOTEL_SUBDOMAIN', 'api.exotel.com')}/v1/Accounts/${sid}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${env('EXOTEL_API_KEY')}:${env('EXOTEL_API_TOKEN')}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const text = await res.text();
  return { ok: res.ok, detail: { status: res.status, body: text.slice(0, 500) } };
}

async function twilioRequest(path: string, params: Record<string, string>): Promise<SendResult> {
  const sid = env('TWILIO_ACCOUNT_SID');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${sid}:${env('TWILIO_AUTH_TOKEN')}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const text = await res.text();
  return { ok: res.ok, detail: { status: res.status, body: text.slice(0, 500) } };
}

async function sendSms(to: string, body: string): Promise<SendResult> {
  switch (env('TELEPHONY_PROVIDER', 'none')) {
    case 'exotel': {
      const params: Record<string, string> = { From: env('EXOTEL_CALLER_ID'), To: to, Body: body };
      if (env('EXOTEL_DLT_ENTITY_ID')) params.DltEntityId = env('EXOTEL_DLT_ENTITY_ID');
      if (env('EXOTEL_DLT_TEMPLATE_ID')) params.DltTemplateId = env('EXOTEL_DLT_TEMPLATE_ID');
      return exotelRequest('Sms/send.json', params);
    }
    case 'twilio':
      return twilioRequest('Messages.json', { From: env('TWILIO_FROM_NUMBER'), To: to, Body: body });
    default:
      return { ok: true, detail: { dryRun: true, to, body } };
  }
}

async function placeCall(to: string, spokenMessage: string): Promise<SendResult> {
  switch (env('TELEPHONY_PROVIDER', 'none')) {
    case 'exotel':
      // Exotel calls `From` first, then runs the call flow (which should play the alert).
      return exotelRequest('Calls/connect.json', {
        From: to,
        CallerId: env('EXOTEL_CALLER_ID'),
        Url: env('EXOTEL_FLOW_URL'),
        CallType: 'trans',
        TimeOut: '30',
        CustomField: spokenMessage.slice(0, 200),
      });
    case 'twilio': {
      const say = `<Say voice="alice">${escapeXml(spokenMessage)}</Say><Pause length="1"/>`;
      return twilioRequest('Calls.json', {
        From: env('TWILIO_FROM_NUMBER'),
        To: to,
        Twiml: `<Response>${say}${say}</Response>`,
        Timeout: '30',
      });
    }
    default:
      return { ok: true, detail: { dryRun: true, to, spokenMessage } };
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = env('WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const alert: AlertRow | undefined = payload?.record;
  if (!alert?.id || payload?.type !== 'INSERT') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const { data: senior } = await db.from('profiles').select('full_name, phone').eq('id', alert.senior_id).single();
  const { data: links } = await db.from('care_links').select('caregiver_id').eq('senior_id', alert.senior_id);
  const caregiverIds = (links ?? []).map((l) => l.caregiver_id);
  const { data: caregivers } = caregiverIds.length
    ? await db.from('profiles').select('id, full_name, phone').in('id', caregiverIds)
    : { data: [] as { id: string; full_name: string; phone: string | null }[] };

  const who = senior?.full_name || 'Your family member';
  const where = alert.location?.address ? ` Location: ${alert.location.address}.` : '';
  const what = alert.message || alert.kind.toUpperCase();
  const sms = `KINOTE ALERT: ${who} needs attention. ${what}.${where} Open KINOTE to respond.`;
  const spoken = `This is a KINOTE emergency alert. ${who} needs attention. ${what}.${where} Please check on them now.`;

  const events: { alert_id: string; channel: string; recipient: string; outcome: string; detail: unknown }[] = [];

  for (const cg of caregivers ?? []) {
    if (!cg.phone) {
      events.push({ alert_id: alert.id, channel: 'sms', recipient: cg.id, outcome: 'skipped_no_phone', detail: null });
      continue;
    }
    const [smsResult, callResult] = await Promise.all([
      sendSms(cg.phone, sms),
      alert.severity === 'critical' ? placeCall(cg.phone, spoken) : Promise.resolve(null),
    ]);
    events.push({
      alert_id: alert.id,
      channel: 'sms',
      recipient: cg.phone,
      outcome: smsResult.ok ? 'sent' : 'failed',
      detail: smsResult.detail,
    });
    if (callResult) {
      events.push({
        alert_id: alert.id,
        channel: 'call',
        recipient: cg.phone,
        outcome: callResult.ok ? 'placed' : 'failed',
        detail: callResult.detail,
      });
    }
  }

  if (events.length) await db.from('alert_events').insert(events);

  return new Response(
    JSON.stringify({ alert: alert.id, caregivers: caregivers?.length ?? 0, attempts: events.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
