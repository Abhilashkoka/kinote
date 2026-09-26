import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Smartphone, 
  Fingerprint, 
  KeyRound, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  User, 
  Heart, 
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Check,
  Stethoscope,
  Shield,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { DEMO_USERS } from '../utils/mockPatients';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  initialRole?: UserRole;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Mode: Sign In vs Create New Account
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'biometric' | 'senior_pin'>('email');
  
  // Existing Sign-in Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 234-8901');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [seniorPin, setSeniorPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // New User Registration Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('family_caregiver');
  const [patientMonitoredName, setPatientMonitoredName] = useState('');

  // Registered custom users saved in localStorage
  const [savedCustomUsers, setSavedCustomUsers] = useState<AuthUser[]>([]);
  
  // Loading & status states
  const [isVerifying, setIsVerifying] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load registered users on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('kinote_registered_users');
      if (stored) {
        setSavedCustomUsers(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Password credentials (stored separately from the user profile, as salted SHA-256 hashes).
  // NOTE: this is client-side only. Real accounts need server-side auth before launch.
  const CREDENTIALS_KEY = 'kinote_credentials';
  const DEMO_PASSWORD = 'demo1234';

  const hashPassword = async (email: string, password: string): Promise<string> => {
    const data = new TextEncoder().encode(`kinote:${email.toLowerCase()}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const loadCredentials = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const saveCredential = async (email: string, password: string) => {
    try {
      const creds = loadCredentials();
      creds[email.toLowerCase()] = await hashPassword(email, password);
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    } catch {
      // ignore
    }
  };

  // Helper to persist a new user
  const saveRegisteredUser = (user: AuthUser) => {
    try {
      const existing: AuthUser[] = JSON.parse(localStorage.getItem('kinote_registered_users') || '[]');
      const filtered = existing.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
      const updated = [user, ...filtered];
      localStorage.setItem('kinote_registered_users', JSON.stringify(updated));
      setSavedCustomUsers(updated);
    } catch {
      // ignore
    }
  };

  // Sign In with Email
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = signInEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    const foundCustom = savedCustomUsers.find(u => u.email.toLowerCase() === cleanEmail);
    const foundDemo = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    const creds = loadCredentials();
    const enteredHash = await hashPassword(cleanEmail, signInPassword);

    let passwordOk = false;
    if (foundCustom) {
      if (creds[cleanEmail]) {
        passwordOk = creds[cleanEmail] === enteredHash;
      } else {
        // Account created before passwords were stored: set this password on first sign-in.
        await saveCredential(cleanEmail, signInPassword);
        passwordOk = true;
      }
    } else if (foundDemo) {
      passwordOk = signInPassword === DEMO_PASSWORD;
    }

    setTimeout(() => {
      setIsVerifying(false);

      if (!foundCustom && !foundDemo) {
        setErrorMessage('No account found for this email. Tap "Create New Account" to sign up.');
        return;
      }
      if (!passwordOk) {
        setErrorMessage('Incorrect password. Please try again.');
        return;
      }

      onLoginSuccess({
        ...(foundCustom || foundDemo)!,
        lastLogin: 'Just now',
        authMethod: 'email',
      });
    }, 500);
  };

  // Register New User (Sign Up)
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Please choose a password with at least 6 characters.');
      return;
    }
    if (DEMO_USERS.some(u => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      setErrorMessage('This email belongs to a demo profile. Please use your own email.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage('Creating your KINOTE account & setting up secure health workspace...');

    setTimeout(() => {
      setIsVerifying(false);
      const freshUser: AuthUser = {
        id: `user_${Date.now()}`,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || '+1 (555) 789-0123',
        role: newRole,
        authMethod: 'email',
        lastLogin: 'Just now (Brand New Account)',
      };

      // Save user to registry
      saveRegisteredUser(freshUser);
      void saveCredential(freshUser.email, newPassword);

      // If they provided a loved one's name, save a customized patient profile in localStorage
      if (patientMonitoredName.trim()) {
        try {
          const existingPatients = JSON.parse(localStorage.getItem('kinote_patients_list') || '[]');
          const customPatient = {
            id: `patient-custom-${Date.now()}`,
            name: patientMonitoredName.trim(),
            relationship: 'Loved One',
            age: 78,
            gender: 'Monitored Family Member',
            roomOrUnit: 'Primary Residence',
            primaryCondition: 'Cardiovascular & Vitals Telemetry',
            avatarBg: 'bg-emerald-700',
            location: {
              id: 'loc_home',
              label: `${patientMonitoredName.trim()}'s Residence`,
              address: 'Private Residence, USA',
              coordinates: { lat: 37.7749, lng: -122.4194 },
              dispatchPreference: 'closest_hospital_er' as const,
              nearestPSAP: 'Local County 911 PSAP',
              accessNotes: 'Keycode in family vault',
            },
            vitals: {
              heartRate: 0,
              bloodPressureSystolic: 0,
              bloodPressureDiastolic: 0,
              spo2: 0,
              respiratoryRate: 0,
              skinTemperature: 0,
              glucoseLevel: 0,
              hrv: 0,
              stressLevel: 0,
              lastUpdated: 'Awaiting device sync',
              batteryLevel: 0,
              fallDetected: false,
              ecgStatus: 'normal_sinus' as const,
            },
            thresholds: {
              heartRate: { minCritical: 48, minWarning: 55, maxWarning: 105, maxCritical: 125 },
              bloodPressureSystolic: { minCritical: 88, minWarning: 95, maxWarning: 140, maxCritical: 165 },
              bloodPressureDiastolic: { minCritical: 55, minWarning: 60, maxWarning: 90, maxCritical: 105 },
              spo2: { minCritical: 90, minWarning: 93, maxWarning: 100, maxCritical: 100 },
              glucose: { minCritical: 65, minWarning: 75, maxWarning: 160, maxCritical: 200 },
              skinTemperature: { minCritical: 95.0, minWarning: 96.5, maxWarning: 99.8, maxCritical: 101.5 },
              wearableSyncProtocol: 'continuous_realtime' as const,
              requireEmergencyChime: true,
              autoEscalateToEMSAfterSeconds: 90,
            },
            medications: [],
            doseLogs: [],
            devices: [],
            emergencyContacts: [
              {
                id: `cont-${Date.now()}`,
                name: freshUser.name,
                relation: 'Primary Caregiver',
                phone: freshUser.phone,
                email: freshUser.email,
                priorityOrder: 1,
                notifyOnWarning: true,
                notifyOnCritical: true,
                receiveAIVoiceCall: true,
              }
            ],
          };
          localStorage.setItem('kinote_patients_list', JSON.stringify([customPatient, ...existingPatients]));
        } catch {
          // ignore
        }
      }

      onLoginSuccess(freshUser);
    }, 850);
  };

  // Phone OTP Flow
  const handleSendOtp = () => {
    setOtpSent(true);
    setErrorMessage(null);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsVerifying(false);
      const cleanPhone = phoneNumber.trim();
      const matched = savedCustomUsers.find(u => u.phone === cleanPhone) || DEMO_USERS[0];
      onLoginSuccess({
        ...matched,
        authMethod: 'phone_otp',
        phone: cleanPhone,
        lastLogin: 'Just now',
      });
    }, 800);
  };

  // Biometric WebAuthn Face/Touch ID Simulation
  const handleBiometricAuth = async () => {
    setBiometricScanning(true);
    setErrorMessage(null);

    setTimeout(() => {
      setBiometricScanning(false);
      const targetUser = savedCustomUsers[0] || DEMO_USERS[0];
      onLoginSuccess({
        ...targetUser,
        authMethod: 'biometric',
        lastLogin: 'Just now (Face ID Passkey)',
      });
    }, 1100);
  };

  // Senior 4-Digit PIN
  const handlePinPress = (num: string) => {
    if (seniorPin.length < 4) {
      const newPin = seniorPin + num;
      setSeniorPin(newPin);
      if (newPin.length === 4) {
        setIsVerifying(true);
        setTimeout(() => {
          setIsVerifying(false);
          const seniorUser = savedCustomUsers.find(u => u.role === 'senior_patient') || DEMO_USERS[1];
          onLoginSuccess({
            ...seniorUser,
            authMethod: 'senior_pin',
            lastLogin: 'Just now (Senior Safe PIN)',
          });
        }, 600);
      }
    }
  };

  const handlePinBackspace = () => {
    setSeniorPin((p) => p.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambience Gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card Container */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* App Branding Header */}
        <div className="p-6 sm:p-7 bg-gradient-to-b from-slate-850 to-slate-900 border-b border-slate-800 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-900/40 mb-3 ring-4 ring-teal-500/20">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>KINOTE</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 uppercase tracking-widest">
              Health Cloud
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Wearable Family Telemetry &amp; AI Emergency Voice Dispatch
          </p>
        </div>

        {/* PRIMARY TOGGLE: Create New Account vs Sign In */}
        <div className="p-3 bg-slate-950 border-b border-slate-800">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In (Existing)</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 1: CREATE NEW ACCOUNT (Sign Up)                     */}
        {/* ======================================================== */}
        {authMode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-teal-950/30 border border-teal-500/20 text-xs text-teal-200/90 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-300">Set Up Your New KINOTE Profile</p>
                <p className="text-[11px] text-teal-200/80 leading-relaxed mt-0.5">
                  Enter your details to create a personal account. You won't be signed in as any old or demo account.
                </p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Your Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Archana Challa"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>Your Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. archanachalla@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Choose Your Account Role *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRole('family_caregiver')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newRole === 'family_caregiver'
                      ? 'bg-teal-950/60 border-teal-500 text-teal-300 ring-1 ring-teal-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Family Caregiver</span>
                    {newRole === 'family_caregiver' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Monitor vitals, medication alerts &amp; receive AI emergency calls
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNewRole('senior_patient')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newRole === 'senior_patient'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Senior / Loved One</span>
                    {newRole === 'senior_patient' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Senior SafeMode with big buttons, simple voice check &amp; SOS
                  </p>
                </button>
              </div>
            </div>

            {/* Optional Monitored Loved One Name (for Caregivers) */}
            {newRole === 'family_caregiver' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Name of Loved One / Senior to Monitor (Optional)</span>
                  <span className="text-[10px] text-teal-400 font-normal">Can add anytime</span>
                </label>
                <input
                  type="text"
                  value={patientMonitoredName}
                  onChange={(e) => setPatientMonitoredName(e.target.value)}
                  placeholder="e.g. Mom, Dad, or Mary"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                />
              </div>
            )}

            {/* Phone & Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Mobile Phone</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password / PIN</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-teal-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isVerifying ? (
                <span>Registering Your Account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Start KINOTE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: SIGN IN (Existing Accounts)                      */}
        {/* ======================================================== */}
        {authMode === 'signin' && (
          <div className="space-y-4">
            {/* Sub-tabs for Sign In Methods */}
            <div className="px-6 pt-4">
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    authMethod === 'email' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('phone'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    authMethod === 'phone' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[11px]">SMS OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('biometric'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    authMethod === 'biometric' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Passkey</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('senior_pin'); setErrorMessage(null); }}
                  className={`py-2 px-1 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                    authMethod === 'senior_pin' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="text-[11px]">PIN</span>
                </button>
              </div>
            </div>

            {/* Email Sign In */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSignIn} className="px-6 pb-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button type="button" className="text-[11px] text-teal-400 hover:underline">
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white font-bold text-xs shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isVerifying ? <span>Verifying...</span> : <span>Sign In to KINOTE</span>}
                </button>
              </form>
            )}

            {/* Phone SMS OTP */}
            {authMethod === 'phone' && (
              <form onSubmit={handleVerifyOtp} className="px-6 pb-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 234-8901"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border border-slate-700"
                    >
                      {otpSent ? 'Resend' : 'Send Code'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Enter 6-Digit SMS Code</span>
                      <span className="text-[10px] text-teal-400 font-mono">Any 6 digits</span>
                    </label>
                    <div className="flex justify-between gap-1.5">
                      {otpCode.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          className="w-11 h-12 text-center text-lg font-bold bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-teal-500 transition-colors"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? <span>Verifying...</span> : <span>Confirm SMS &amp; Sign In</span>}
                </button>
              </form>
            )}

            {/* Biometric Passkey */}
            {authMethod === 'biometric' && (
              <div className="px-6 pb-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Fingerprint className={`w-8 h-8 ${biometricScanning ? 'animate-pulse text-teal-300' : ''}`} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Biometric Passkey</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Apple Face ID, Touch ID, or Android Biometric</p>
                </div>
                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={biometricScanning}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{biometricScanning ? 'Scanning...' : 'Authenticate'}</span>
                </button>
              </div>
            )}

            {/* Senior PIN */}
            {authMethod === 'senior_pin' && (
              <div className="px-6 pb-6 space-y-3 text-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Senior Fast-PIN</span>
                  <h3 className="text-sm font-bold text-white">Enter 4-Digit PIN</h3>
                </div>
                <div className="flex items-center justify-center gap-2 py-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        seniorPin.length > idx ? 'bg-amber-400 border-amber-400 scale-110' : 'border-slate-700 bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinPress(digit)}
                      className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-base font-bold text-white transition-colors cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSeniorPin('')}
                    className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePinPress('0')}
                    className="h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-base font-bold text-white cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 cursor-pointer"
                  >
                    ⌫
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Custom Users (if any have been registered on this device) */}
        {savedCustomUsers.length > 0 && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <UserCheck className="w-3 h-3" />
              <span>Registered Accounts on this Device:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {savedCustomUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onLoginSuccess(user)}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-600/40 text-left transition-colors cursor-pointer flex items-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-white leading-tight">{user.name}</span>
                    <span className="block text-[9px] text-teal-300 font-mono leading-tight">{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1-Click Demo Profiles Footer (Collapsed/Optional) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/60">
          <details className="group">
            <summary className="text-[11px] font-semibold text-slate-500 hover:text-slate-400 cursor-pointer flex items-center justify-between select-none">
              <span>Looking for default test profiles? (email sign-in password: demo1234)</span>
              <span className="text-teal-400 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={() => onLoginSuccess(DEMO_USERS[0])}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">David Miller</span>
                <span className="block text-[9px] text-teal-400">Caregiver</span>
              </button>
              <button
                type="button"
                onClick={() => onLoginSuccess(DEMO_USERS[1])}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">Eleanor</span>
                <span className="block text-[9px] text-amber-400">Senior Safe</span>
              </button>
              <button
                type="button"
                onClick={() => onLoginSuccess(DEMO_USERS[2])}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">Robert</span>
                <span className="block text-[9px] text-blue-400">Senior Safe</span>
              </button>
              <button
                type="button"
                onClick={() => onLoginSuccess(DEMO_USERS[3])}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition-all cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-white">Dr. Thorne</span>
                <span className="block text-[9px] text-cyan-400">Attending MD</span>
              </button>
            </div>
          </details>
        </div>

      </div>
    </div>
  );
}
