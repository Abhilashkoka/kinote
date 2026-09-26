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
