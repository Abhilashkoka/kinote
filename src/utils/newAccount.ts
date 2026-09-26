import { AuditLogEntry, AuthUser, MembershipDetails } from '../types';

const TRIAL_DAYS = 14;

// Starting plan for a brand-new account: a free trial with no card, no invoices and no usage.
export const createNewAccountMembership = (): MembershipDetails => {
  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  return {
    planType: 'family_basic',
    planName: 'KINOTE Family Basic',
    status: 'trial',
    renewalDate: trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    daysRemaining: TRIAL_DAYS,
    billingCycle: 'monthly',
    priceFormatted: 'Free trial',
    maxSeniors: 1,
    currentSeniorsCount: 1,
    features: {
      aiVoiceMinutesTotal: 30,
      aiVoiceMinutesUsed: 0,
      cellularEsimActive: false,
      rechartsAnalytics30Day: true,
      multiCaregiverSharing: false,
      emsDirectBridge247: false,
      unlimitedWearablesSync: true,
    },
    paymentMethod: { brand: 'visa', last4: '', expMonth: 0, expYear: 0 },
    invoices: [],
  };
};

// Name of the loved one entered at sign-up, kept until their profile is created.
export const lovedOneNameKey = (userId: string): string => `kinote_loved_one_name_${userId}`;

export const saveLovedOneName = (userId: string, name: string) => {
  try {
    if (name.trim()) localStorage.setItem(lovedOneNameKey(userId), name.trim());
  } catch {
    // ignore storage errors
  }
};

export const readLovedOneName = (userId: string): string => {
  try {
    return localStorage.getItem(lovedOneNameKey(userId)) || '';
  } catch {
    return '';
  }
};

export type CardBrand = MembershipDetails['paymentMethod']['brand'];

// Only Visa, Mastercard and Amex are supported by the billing model.
export const detectCardBrand = (digits: string): CardBrand | null => {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return null;
};

// Standard Luhn checksum used by all card numbers.
export const passesLuhn = (digits: string): boolean => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return digits.length > 0 && sum % 10 === 0;
};

export const membershipStorageKey = (user: AuthUser | null, isDemo: boolean): string =>
  !user || isDemo ? 'kinote_membership' : `kinote_membership_${user.id}`;

// A real account's audit trail starts with a single sign-in entry instead of sample history.
export const createNewAccountAuditLogs = (user: AuthUser): AuditLogEntry[] => [
  {
    id: `aud_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    actor: user.email,
    actorRole: user.role,
    action: 'SESSION_STARTED',
    resource: 'account',
    details: `${user.name} signed in`,
    severity: 'INFO',
    ipAddress: 'this device',
    sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
  },
];
