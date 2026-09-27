import { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  PhoneCall, 
  ArrowUpRight,
  Clock,
  Activity,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { MembershipDetails, MembershipPlanType } from '../types';
import { detectCardBrand, passesLuhn } from '../utils/newAccount';

const BRAND_LABEL: Record<MembershipDetails['paymentMethod']['brand'], string> = {
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  amex: 'AMEX',
};

interface MembershipBillingProps {
  membership: MembershipDetails;
  onUpdatePlan: (newPlan: MembershipPlanType) => void;
  onSimulateGracePeriod: () => void;
  onResetStatus: () => void;
  onUpdateCard?: (card: MembershipDetails['paymentMethod']) => void;
  patientCount: number;
  patientNames?: string[];
  cardholderName?: string;
}

export default function MembershipBilling({
  membership,
  onUpdatePlan,
  onSimulateGracePeriod,
  onResetStatus,
  onUpdateCard,
  patientCount,
  patientNames = [],
  cardholderName = '',
}: MembershipBillingProps) {
  const [selectedPlanModal, setSelectedPlanModal] = useState<MembershipPlanType | null>(null);
  const [showCardUpdateModal, setShowCardUpdateModal] = useState(false);
  const cardLast4 = membership.paymentMethod.last4;
  const cardBrandLabel = BRAND_LABEL[membership.paymentMethod.brand] || 'CARD';
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);

  const closeCardModal = () => {
    setShowCardUpdateModal(false);
    setCardNumber('');
    setCardExpiry('');
    setCardCvc('');
    setCardError(null);
  };

  const handleSaveCard = () => {
    const digits = cardNumber.replace(/\D/g, '');
    const brand = detectCardBrand(digits);
    if (!brand) {
      setCardError('Enter a Visa, Mastercard or American Express card number.');
      return;
    }
    const expectedLength = brand === 'amex' ? 15 : 16;
    if (digits.length !== expectedLength || !passesLuhn(digits)) {
      setCardError('That card number is not valid. Check the digits and try again.');
      return;
    }
    const expiryMatch = cardExpiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
    const month = expiryMatch ? Number(expiryMatch[1]) : 0;
    const year = expiryMatch ? 2000 + Number(expiryMatch[2]) : 0;
    const now = new Date();
    const expired = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (!expiryMatch || month < 1 || month > 12 || expired) {
      setCardError('Enter a future expiry date as MM/YY.');
      return;
    }
    const cvcDigits = cardCvc.replace(/\D/g, '');
    if (cvcDigits.length !== (brand === 'amex' ? 4 : 3)) {
      setCardError(brand === 'amex' ? 'Enter the 4-digit code on the front of the card.' : 'Enter the 3-digit code on the back of the card.');
      return;
    }
    onUpdateCard?.({ brand, last4: digits.slice(-4), expMonth: month, expYear: year });
    closeCardModal();
  };
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadInvoice = (invId: string) => {
    setDownloadSuccess(invId);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Billing Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent pointer-events-none rounded-bl-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200">
                {membership.planName}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                membership.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
              }`}>
                {membership.status === 'active' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Subscription</span>
                  </>
                ) : membership.status === 'trial' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Free Trial</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Grace Period (Payment Pending)</span>
                  </>
                )}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Billed {membership.billingCycle === 'monthly' ? 'Monthly' : 'Annually'}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {membership.priceFormatted}
            </h2>
            <p className="text-xs text-slate-600 max-w-xl">
              {membership.status === 'trial' ? (
                <>Your free trial ends on <strong className="text-slate-900">{membership.renewalDate}</strong> ({membership.daysRemaining} days left). {cardLast4 ? <>Billing will use your card ending {cardLast4}.</> : 'No card on file yet.'}</>
              ) : (
                <>Next scheduled renewal is on <strong className="text-slate-900">{membership.renewalDate}</strong> ({membership.daysRemaining} days remaining). {cardLast4 ? <>Automatic backup billing to {cardBrandLabel} •••• {cardLast4}.</> : 'No card on file yet.'}</>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {membership.status === 'grace_period' ? (
              <button
                onClick={onResetStatus}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Clear Grace Period &amp; Settle</span>
              </button>
            ) : (
              <button
                onClick={onSimulateGracePeriod}
                className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Test how the platform handles payment failure without risking senior emergency dispatch"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Simulate Grace Period Warning</span>
              </button>
            )}

            <button
              onClick={() => setShowCardUpdateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-teal-300" />
              <span>Payment Details</span>
            </button>
          </div>
        </div>

        {/* Grace Period Medical Safeguard Callout */}
        {membership.status === 'grace_period' && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-950">Patient Safety Safeguard Active:</span>
              <p className="leading-relaxed">
                Even though automatic billing payment failed on your card, KINOTE medical continuity protocols keep 
                <strong> AI Emergency Voice Dispatch</strong> and <strong>Vitals Telemetry Quorum</strong> 100% operational 
                for a 7-day grace window. Please update your card on file to avoid monitoring disruption.
              </p>
            </div>
          </div>
        )}

        {/* Capacity Meter: Monitored Seniors per Plan */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Monitored Seniors Limit
              </span>
              <span className="font-mono font-bold text-slate-900">
                {patientCount} of {membership.maxSeniors} Used
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-600 rounded-full transition-all" 
                style={{ width: `${(patientCount / membership.maxSeniors) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              {patientNames.length > 0 ? patientNames.join(' & ') : 'No one added yet'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                AI Emergency Voice Calling
              </span>
              <span className="font-mono font-bold text-slate-900">
                {membership.features.aiVoiceMinutesUsed} / {membership.features.aiVoiceMinutesTotal} min
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full transition-all" 
                style={{ width: `${(membership.features.aiVoiceMinutesUsed / membership.features.aiVoiceMinutesTotal) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 pt-0.5">
              {membership.features.aiVoiceMinutesTotal - membership.features.aiVoiceMinutesUsed} minutes remaining this cycle.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Regulatory &amp; Telemetry
              </span>
              <span className="font-semibold text-emerald-700">Enterprise HIPAA</span>
            </div>
            <p className="text-[11px] text-slate-600 pt-1 leading-snug">
              256-bit AES encryption, SHA-256 audit hashing, BAA compliant data isolation.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Tiers & Comparison Grid */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Membership Tiers &amp; Capacity Mapping</h3>
          <p className="text-xs text-slate-500">
            Each plan defines how many senior profiles can be actively monitored, wearable streaming limits, and automated AI dispatch channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan 1: Family Basic */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            membership.planType === 'family_basic'
              ? 'bg-teal-50/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Family Basic</h4>
                {membership.planType === 'family_basic' && (
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                    Current Plan
                  </span>
                )}
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">$15</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <p className="text-xs text-slate-600">Essential vital telemetry tracking for a single elderly family member.</p>

              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>1 Monitored Senior</strong> Profile</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Standard Wearable Vitals Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Caregiver Push &amp; SMS Alerts</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="w-3.5 h-3.5 text-center leading-none text-slate-300">✕</span>
                  <span>AI Voice Check-in Calls</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpdatePlan('family_basic')}
              disabled={membership.planType === 'family_basic'}
              className="mt-5 w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:bg-slate-100 text-slate-800 disabled:text-slate-400 font-bold text-xs transition-colors cursor-pointer"
            >
              {membership.planType === 'family_basic' ? 'Current Plan' : 'Downgrade to Basic'}
            </button>
          </div>

          {/* Plan 2: Caregiver Plus (CURRENT) */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
            membership.planType === 'caregiver_plus'
              ? 'bg-teal-50/50 border-teal-600 ring-2 ring-teal-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <div className="absolute -top-3 right-4 bg-teal-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Most Popular Family Choice
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Caregiver Plus</h4>
                {membership.planType === 'caregiver_plus' && (
                  <span className="px-2 py-0.5 rounded bg-teal-200 text-teal-900 font-bold text-[10px]">
                    Current Plan
                  </span>
                )}
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">$29</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <p className="text-xs text-slate-600">Full AI emergency triage voice dispatch for multiple aging parents.</p>

              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Up to 3 Monitored Seniors</strong> (Mom &amp; Dad)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>AI Voice Check-in Calls</strong> (120 min/mo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>30-Day Recharts Adherence Trends</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Up to 5 Caregiver Accounts</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpdatePlan('caregiver_plus')}
              disabled={membership.planType === 'caregiver_plus'}
              className="mt-5 w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-teal-900/10 text-white disabled:text-teal-900 font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              {membership.planType === 'caregiver_plus' ? 'Active Plan' : 'Select Plus'}
            </button>
          </div>

          {/* Plan 3: Clinical Concierge */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            membership.planType === 'clinical_concierge'
              ? 'bg-teal-50/50 border-teal-500 ring-2 ring-teal-500/20 shadow-md'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Clinical Concierge</h4>
                {membership.planType === 'clinical_concierge' && (
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                    Current Plan
                  </span>
                )}
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">$59</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <p className="text-xs text-slate-600">Enterprise E911 direct bridge &amp; dedicated cellular fallback.</p>

              <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>Unlimited Monitored Seniors</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span><strong>24/7 E911 PSAP Telemetry Bridge</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Cellular eSIM Failover Telemetry</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Unlimited AI Voice Minutes</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpdatePlan('clinical_concierge')}
              disabled={membership.planType === 'clinical_concierge'}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-xs transition-colors cursor-pointer"
            >
              {membership.planType === 'clinical_concierge' ? 'Active Plan' : 'Upgrade to Concierge'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Method & Invoices Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Payment Method on File</h4>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
              Default
            </span>
          </div>

          {cardLast4 ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">KINOTE Medical Pay</span>
              <span className="text-sm font-mono font-bold">{cardBrandLabel}</span>
            </div>
            <div className="text-sm font-mono tracking-widest pt-2">
              •••• •••• •••• {cardLast4}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Cardholder: {cardholderName || 'Account holder'}</span>
              <span>Expires: {String(membership.paymentMethod.expMonth).padStart(2, '0')}/{String(membership.paymentMethod.expYear).slice(-2)}</span>
            </div>
          </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
              No card on file yet.
            </div>
          )}

          <button
            onClick={() => setShowCardUpdateModal(true)}
            className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {cardLast4 ? 'Update Card or Billing Address' : 'Add a Card'}
          </button>
        </div>

        {/* Invoice & Receipts History */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Billing History &amp; HIPAA Invoices</h4>
            <span className="text-xs text-slate-400">{membership.invoices.length} transactions</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
            {membership.invoices.length === 0 && (
              <div className="p-4 text-slate-500 bg-white">No invoices yet. Your first invoice appears after the trial ends.</div>
            )}
            {membership.invoices.map((inv) => (
              <div key={inv.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{inv.id.toUpperCase()}</span>
                    <span className="text-[11px] text-slate-500">{inv.date} • Subscription Renewal</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-slate-900">{inv.amount}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Paid
                  </span>
                  <button
                    onClick={() => handleDownloadInvoice(inv.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Download PDF Receipt"
                  >
                    {downloadSuccess === inv.id ? (
                      <span className="text-[10px] text-emerald-700 font-bold">Downloaded</span>
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simple Update Card Modal */}
      {showCardUpdateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900">{cardLast4 ? 'Update Payment Card' : 'Add a Card'}</h3>
            <p className="text-xs text-slate-500">
              Only the card type, last 4 digits and expiry date are saved. The full number and security code are never stored. No payment is taken in this version.
            </p>

            <div className="space-y-2">
              <label htmlFor="card-number" className="text-xs font-semibold text-slate-700">Card Number</label>
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={cardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
                  setCardError(null);
                }}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="card-expiry" className="text-xs font-semibold text-slate-700">Expiry</label>
                <input
                  id="card-expiry"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={cardExpiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                    setCardError(null);
                  }}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label htmlFor="card-cvc" className="text-xs font-semibold text-slate-700">CVC</label>
                <input
                  id="card-cvc"
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={cardCvc}
                  onChange={(e) => {
                    setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setCardError(null);
                  }}
                  placeholder="CVC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {cardError && <p className="text-[11px] text-rose-600">{cardError}</p>}

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleSaveCard}
                className="flex-1 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Save Card
              </button>
              <button
                onClick={closeCardModal}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
