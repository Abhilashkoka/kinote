# KINOTE cloud setup

This turns on **Link phones** (a caregiver and a parent link their phones) and **real alerts** (an SOS on the parent's phone texts and calls every linked caregiver).

Without these steps the app still works on a single device, as before.

## 1. Create the Supabase project (about 10 minutes)

1. Sign up at supabase.com and create a project. Pick the **Mumbai (ap-south-1)** region.
2. Open **SQL Editor**, paste the contents of `supabase/migrations/20260927000000_family_links_and_alerts.sql`, and click **Run**.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public key**.
4. Add both keys to the app:
   - **Locally:** create a `.env` file with:
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```
   - **Vercel / AI Studio:** add the same two variables in the project's environment settings.

## 2. Turn on SMS sign-in

1. In Supabase, go to **Authentication → Providers → Phone** and enable it.
2. Pick an SMS provider from the list (for example Twilio, Vonage or Textlocal) and paste its keys.
3. For testing before SMS is live, add your number under **Test phone numbers** with a fixed code, such as 123456.

## 3. Real calls and SMS to caregivers

1. Install the Supabase CLI, then deploy the function:
   ```
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy escalate-alert --no-verify-jwt
   ```
2. Set the secrets. Use `TELEPHONY_PROVIDER=none` first; it logs attempts without calling anyone.
   ```
   supabase secrets set WEBHOOK_SECRET=<long-random-string> TELEPHONY_PROVIDER=none
   ```
3. Create the trigger: go to **Database → Webhooks → Create**.
   - **Table:** `alerts`
   - **Events:** Insert
   - **Type:** Supabase Edge Function → `escalate-alert`
   - **HTTP header:** `x-webhook-secret: <same string as above>`
4. Test it: press SOS on a linked parent account. Rows appear in the `alert_events` table.
5. Go live with Exotel (India):
   ```
   supabase secrets set TELEPHONY_PROVIDER=exotel EXOTEL_SID=... EXOTEL_API_KEY=... EXOTEL_API_TOKEN=... \
     EXOTEL_CALLER_ID=<your ExoPhone> EXOTEL_FLOW_URL=http://my.exotel.com/<sid>/exoml/start_voice/<app_id> \
     EXOTEL_DLT_ENTITY_ID=... EXOTEL_DLT_TEMPLATE_ID=...
   ```
   - In Exotel, build a call flow that plays the alert message. Use its URL as `EXOTEL_FLOW_URL`.
   - SMS in India needs DLT registration. The approved template must match the text in `escalate-alert` (`KINOTE ALERT: ...`).
   - If your account is on the Mumbai cluster, set `EXOTEL_SUBDOMAIN=api.in.exotel.com`.

   To use Twilio instead:
   ```
   supabase secrets set TELEPHONY_PROVIDER=twilio TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM_NUMBER=+1...
   ```

## How it works

| Step | What happens |
|---|---|
| Caregiver taps **Link phones → Create code** | A 6-letter code is created. It works once and expires after 48 hours. |
| Parent enters the code | The server links the two accounts. Either side can unlink. |
| Parent presses SOS | An alert row is saved. Linked caregivers see it instantly under **Live alerts**. |
| Webhook runs `escalate-alert` | Every linked caregiver with a phone number gets an SMS. Critical alerts also get a voice call. Each attempt is logged in `alert_events`. |
| Caregiver taps **I'm on it** | The alert is marked acknowledged for everyone. |

Access rules are enforced in the database with row level security. A person only ever sees themselves, the people they're linked with, and those people's alerts.

## Not included yet

- **Retry and escalation:** there is no retry if a caregiver doesn't answer. That needs call-status webhooks from the telephony provider.
- **Push notifications:** Firebase Cloud Messaging. This comes with the native app.
- **Automatic ambulance dispatch:** needs a partner with an API. Until then, the app offers **Call 112** and **Nearest hospitals**, both one tap.
- **Watch data:** reading Health Connect or Apple Health needs the native app (Capacitor).
