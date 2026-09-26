import { useState, useEffect } from 'react';
import { 
  Heart, 
  Sliders, 
  Watch, 
  ShieldCheck, 
  PhoneCall, 
  User, 
  Bell, 
  Check, 
  ShieldAlert, 
  Sparkles,
  Phone,
  Smartphone,
  Monitor,
  Bot,
  MapPin,
  Flame,
  BatteryCharging,
  Wifi,
  WifiOff,
  Cpu,
  LogOut,
  Menu,
  X,
  CreditCard,
  FileText,
  Activity,
  ChevronDown,
  Trash2,
  UserPlus,
  Radio
} from 'lucide-react';
import { 
  AuditLogEntry, 
  EmergencyContact, 
  MetricThresholds, 
  PatientLocation, 
  UserRole, 
  VitalsReading, 
  WearableDevice, 
  AIVoiceCallLog,
  MedicationItem,
  MedicationDoseLog,
  MedicationDoseStatus,
  MissedDoseNotification,
  AuthUser,
  MembershipDetails,
  MembershipPlanType,
  PatientProfile
} from './types';
import { 
  INITIAL_AUDIT_LOGS, 
  INITIAL_CALL_LOGS, 
  INITIAL_CONTACTS, 
  INITIAL_DEVICES, 
  INITIAL_THRESHOLDS, 
  INITIAL_VITALS, 
  PATIENT_LOCATIONS,
  INITIAL_MEDICATIONS,
  INITIAL_DOSE_LOGS
} from './utils/mockData';
import { 
  INITIAL_PATIENTS, 
  INITIAL_MEMBERSHIP, 
  DEMO_USERS,
  ROBERT_THRESHOLDS 
} from './utils/mockPatients';
import SeniorSafeView from './components/SeniorSafeView';
import CaregiverDashboard from './components/CaregiverDashboard';
import ThresholdsSettings from './components/ThresholdsSettings';
import DevicesManager from './components/DevicesManager';
import ComplianceAndAudit from './components/ComplianceAndAudit';
import AIVoiceCallModal from './components/AIVoiceCallModal';
import KinoteAIAssistant from './components/KinoteAIAssistant';
import MissedDosePushAlert from './components/MissedDosePushAlert';
import LoginScreen from './components/LoginScreen';
import MembershipBilling from './components/MembershipBilling';
import PatientSwitcher from './components/PatientSwitcher';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AccountDeletionModal } from './components/AccountDeletionModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { MobileTesterModal } from './components/MobileTesterModal';
import { DevicePairingModal } from './components/DevicePairingModal';
import { CleanLiveTestingModal } from './components/CleanLiveTestingModal';
import { playEmergencyChime, speakText } from './utils/speech';
import { EMPTY_LOCATION, sanitizeCustomPatient, PatientWithLocations } from './utils/location';
import { createNewAccountMembership, createNewAccountAuditLogs, membershipStorageKey, readLovedOneName } from './utils/newAccount';

// Check if a user is a pre-canned demo account
export const isDemoUser = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return (
    user.id === 'user_david_miller' ||
    user.id === 'user_eleanor_miller' ||
    user.id === 'user_robert_miller' ||
    user.id === 'user_dr_thorne' ||
    user.email.endsWith('@kinotehealth.org')
  );
};

// Generate an isolated, clean patient profile for a newly signed-up user
export const createDefaultCustomPatient = (user: AuthUser): PatientWithLocations => {
  const lovedOneName = readLovedOneName(user.id);
  const customSeniorName = user.role === 'senior_patient' 
    ? user.name 
    : lovedOneName || `${user.name.split(' ')[0]}'s Family Member`;

  return {
    id: `patient_${user.id}`,
    name: customSeniorName,
    relationship: user.role === 'senior_patient' ? 'Self' : 'Loved One',
    age: user.role === 'senior_patient' ? 72 : 76,
    gender: 'Family Member',
    roomOrUnit: 'Primary Residence',
    primaryCondition: 'Continuous Biometric Monitoring',
    avatarBg: 'from-teal-600 to-emerald-700',
    location: EMPTY_LOCATION,
    savedLocations: [],
    devices: [], // Zero devices initially! Asks the user to pair their wearable
    vitals: {
      timestamp: 'Awaiting device sync',
      heartRate: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      spo2: 0,
      respiratoryRate: 0,
      temperature: 0,
      glucose: 0,
      fallDetected: false,
    },
    thresholds: INITIAL_THRESHOLDS,
    medications: [],
    doseLogs: [],
    emergencyContacts: [
      {
        id: `contact_${Date.now()}`,
        name: user.name,
        relation: 'Primary Caregiver',
        phone: user.phone || '+1 (555) 000-0000',
        email: user.email,
        priorityOrder: 1,
        notifyOnWarning: true,
        notifyOnCritical: true,
        receiveAIVoiceCall: true,
      }
    ]
  };
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'senior' | 'caregiver' | 'ai_assistant' | 'thresholds' | 'devices' | 'compliance' | 'membership'>('caregiver');
  const [currentRole, setCurrentRole] = useState<UserRole>('family_caregiver');

  // User Authentication & Session State (Defaults to null so new visitors & published links always open on Login Screen)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('kinote_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep session if it's an explicit custom user and not the auto-loaded demo profile
        if (parsed && parsed.id && parsed.id !== 'user_david_miller' && parsed.email !== 'david.miller@example.com') {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Membership & Billing Subscription State
  const [membership, setMembership] = useState<MembershipDetails>(() => {
    try {
      const isCustom = !!currentUser && !isDemoUser(currentUser);
      const saved = localStorage.getItem(membershipStorageKey(currentUser, !isCustom));
      if (saved) return JSON.parse(saved);
      return isCustom ? createNewAccountMembership() : INITIAL_MEMBERSHIP;
    } catch {
      return INITIAL_MEMBERSHIP;
    }
  });

  // Multi-Patient Monitoring Circle (Scopes to custom profile for custom users, or demo list for demo users)
  const [patients, setPatients] = useState<PatientProfile[]>(() => {
    try {
      if (currentUser && !isDemoUser(currentUser)) {
        const savedCustom = localStorage.getItem('kinote_patient_' + currentUser.id);
        if (savedCustom) {
          return [sanitizeCustomPatient(JSON.parse(savedCustom))];
        }
        const created = createDefaultCustomPatient(currentUser);
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(created));
        return [created];
      }
      const saved = localStorage.getItem('kinote_patients_list');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [activePatientId, setActivePatientId] = useState<string>(() => {
    if (currentUser && !isDemoUser(currentUser)) {
      return `patient_${currentUser.id}`;
    }
    return 'patient-eleanor';
  });

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const patientName = activePatient.name;
  
  // Core application state mapped to active patient
  const [vitals, setVitals] = useState<VitalsReading>(activePatient.vitals);
  const [thresholds, setThresholds] = useState<MetricThresholds>(activePatient.thresholds);
  const [devices, setDevices] = useState<WearableDevice[]>(activePatient.devices);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(activePatient.emergencyContacts);
  const [callLogs, setCallLogs] = useState<AIVoiceCallLog[]>(() => {
    if (currentUser && !isDemoUser(currentUser)) return [];
    return INITIAL_CALL_LOGS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    currentUser && !isDemoUser(currentUser) ? createNewAccountAuditLogs(currentUser) : INITIAL_AUDIT_LOGS
  );
  
  // Location Profiles (Q6: adult child decides by location)
  const [patientLocationsList, setPatientLocationsList] = useState<PatientLocation[]>(() =>
    currentUser && !isDemoUser(currentUser) ? ((activePatient as PatientWithLocations).savedLocations || []) : PATIENT_LOCATIONS
  );
  const [currentLocation, setCurrentLocation] = useState<PatientLocation>(
    activePatient.location || (currentUser && !isDemoUser(currentUser) ? EMPTY_LOCATION : PATIENT_LOCATIONS[0])
  );

  // Modals & Voice Calling
  const [isVoiceCallModalOpen, setIsVoiceCallModalOpen] = useState(false);
  const [isDevicePairModalOpen, setIsDevicePairModalOpen] = useState(false);
  const [activeVoiceCallReason, setActiveVoiceCallReason] = useState<string>('Biometric Threshold Spike');
  
  // Push Notification Tray Simulation & Missed Dose Alert System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeMissedDoseAlert, setActiveMissedDoseAlert] = useState<MissedDoseNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<MissedDoseNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAccountDeletionModalOpen, setIsAccountDeletionModalOpen] = useState(false);
  const [isCleanLiveModalOpen, setIsCleanLiveModalOpen] = useState(false);
  const [isMobileTesterOpen, setIsMobileTesterOpen] = useState(false);

  // Medication Management & Adherence State (shared with Caregiver & AI Assistant)
  const [medications, setMedications] = useState<MedicationItem[]>(activePatient.medications || INITIAL_MEDICATIONS);
  const [doseLogs, setDoseLogs] = useState<MedicationDoseLog[]>(activePatient.doseLogs || INITIAL_DOSE_LOGS);

  // Offline-First & On-Device AI Resilience State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [simulateOfflineMode, setSimulateOfflineMode] = useState<boolean>(false);
  const effectiveOnline = isOnline && !simulateOfflineMode;

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('🟢 Internet Connection Active: Telemetry cloud sync online.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚡ Offline Mode Detected: On-Device AI & Emergency Fallback active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Switch Monitored Patient (Multi-Senior Isolation)
  const handleSelectPatient = (patientId: string) => {
    setActivePatientId(patientId);
    const target = patients.find((p) => p.id === patientId);
    if (target) {
      setVitals(target.vitals);
      setThresholds(target.thresholds);
      setMedications(target.medications);
      setDoseLogs(target.doseLogs);
      setDevices(target.devices);
      setCurrentLocation(target.location);
      setEmergencyContacts(target.emergencyContacts);
      showToast(`Switched active monitoring focus to ${target.name} (${target.relationship})`);
    }
  };

  const handleAddNewPatient = (newPatient: PatientProfile) => {
    setPatients((prev) => {
      const updated = [...prev, newPatient];
      try {
        localStorage.setItem('kinote_patients_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    handleSelectPatient(newPatient.id);
    showToast(`Added ${newPatient.name} to family monitoring circle.`);
  };

  // Device Pairing Handler
  const handleDevicePaired = (newDevice: WearableDevice, initialVitals: Partial<VitalsReading>) => {
    const updatedDevices = [newDevice, ...devices.filter((d) => d.id !== newDevice.id)];
    setDevices(updatedDevices);
    
    const updatedVitals: VitalsReading = {
      ...vitals,
      ...initialVitals,
      timestamp: 'Just now',
    };
    setVitals(updatedVitals);

    const updatedPatient: PatientProfile = {
      ...activePatient,
      devices: updatedDevices,
      vitals: updatedVitals,
    };
    setPatients((prev) => prev.map((p) => p.id === activePatient.id ? updatedPatient : p));

    if (currentUser) {
      try {
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(updatedPatient));
      } catch {}
    }

    showToast(`🎉 ${newDevice.name} connected! Streaming continuous live vitals.`);
  };

  // Device Removal / Disconnect Handler
  const handleRemoveDevice = (deviceId: string) => {
    const targetDev = devices.find((d) => d.id === deviceId);
    const updatedDevices = devices.filter((d) => d.id !== deviceId);
    setDevices(updatedDevices);

    // If no devices remain, reset vitals to clean un-streamed state
    let updatedVitals: VitalsReading = { ...vitals };
    if (updatedDevices.length === 0) {
      updatedVitals = {
        timestamp: 'Awaiting device sync',
        heartRate: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        spo2: 0,
        respiratoryRate: 0,
        temperature: 0,
        glucose: 0,
        fallDetected: false,
      };
      setVitals(updatedVitals);
    }

    const updatedPatient: PatientProfile = {
      ...activePatient,
      devices: updatedDevices,
      vitals: updatedVitals,
    };
    setPatients((prev) => prev.map((p) => p.id === activePatient.id ? updatedPatient : p));

    if (currentUser) {
      try {
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(updatedPatient));
      } catch {}
    }

    showToast(`Removed ${targetDev?.name || 'device'} from monitoring circle.`);
  };

  // Unpair all devices for active patient (Patient-level clean reset)
  const handleRemoveAllDevices = () => {
    setDevices([]);
    const updatedVitals: VitalsReading = {
      timestamp: 'Awaiting device sync',
      heartRate: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      spo2: 0,
      respiratoryRate: 0,
      temperature: 0,
      glucose: 0,
      fallDetected: false,
    };
    setVitals(updatedVitals);

    const updatedPatient: PatientProfile = {
      ...activePatient,
      devices: [],
      vitals: updatedVitals,
    };
    setPatients((prev) => prev.map((p) => p.id === activePatient.id ? updatedPatient : p));

    if (currentUser) {
      try {
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(updatedPatient));
      } catch {}
    }

    const auditEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: currentUser?.email || 'patient_self',
      actorRole: currentUser?.role || 'senior_patient',
      action: 'ALL_WEARABLES_UNPAIRED',
      resource: `patient.${activePatient.id}.wearables`,
      details: `All wearable devices unpaired for ${activePatient.name}. Telemetry returned to blank standby.`,
      severity: 'INFO',
      ipAddress: '10.0.8.21',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    showToast(`All devices unpaired for ${activePatient.name}. Live telemetry set to standby.`);
  };

  // Purge all demo/sample data from database & storage, reset to 100% clean live testing mode
  const handlePurgeAllDemoDataAndStartLive = () => {
    // 1. Wipe mock data caches from localStorage
    try {
      localStorage.removeItem('kinote_patients_list');
      localStorage.removeItem('kinote_demo_loaded');
      localStorage.removeItem('kinote_call_logs');
      localStorage.removeItem('kinote_medications');
      localStorage.removeItem('kinote_dose_logs');
    } catch {}

    // 2. Prepare blank live-standby vitals (zero fake numbers)
    const blankVitals: VitalsReading = {
      timestamp: 'Awaiting device sync',
      heartRate: 0,
      bloodPressureSystolic: 0,
      bloodPressureDiastolic: 0,
      spo2: 0,
      respiratoryRate: 0,
      temperature: 0,
      glucose: 0,
      fallDetected: false,
    };

    // 3. Create or convert active patient into a clean live testing profile
    const livePatientName = currentUser ? currentUser.name : activePatient.name;
    const cleanPatient: PatientWithLocations = {
      id: currentUser ? `patient_${currentUser.id}` : `patient_live_${Date.now()}`,
      name: livePatientName,
      relationship: currentUser?.role === 'senior_patient' ? 'Self' : 'Monitored Senior',
      age: 74,
      gender: 'Family Member',
      roomOrUnit: 'Primary Residence',
      primaryCondition: 'Live Continuous Biometric Stream',
      avatarBg: 'from-teal-700 to-slate-900',
      location: EMPTY_LOCATION,
      savedLocations: [],
      devices: [], // Zero devices initially
      vitals: blankVitals,
      thresholds: INITIAL_THRESHOLDS,
      medications: [],
      doseLogs: [],
      emergencyContacts: [
        {
          id: `contact_${Date.now()}`,
          name: currentUser?.name || 'Primary Caregiver',
          relation: 'Emergency Family Contact',
          phone: currentUser?.phone || '+1 (555) 012-3456',
          email: currentUser?.email || 'caregiver@example.com',
          priorityOrder: 1,
          notifyOnWarning: true,
          notifyOnCritical: true,
          receiveAIVoiceCall: true,
        }
      ]
    };

    // Save clean patient profile to localStorage
    try {
      if (currentUser) {
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(cleanPatient));
      }
      localStorage.setItem('kinote_patients_list', JSON.stringify([cleanPatient]));
    } catch {}

    // 4. Update React state immediately
    setPatients([cleanPatient]);
    setActivePatientId(cleanPatient.id);
    setVitals(blankVitals);
    setDevices([]);
    setEmergencyContacts(cleanPatient.emergencyContacts);
    setMedications([]);
    setDoseLogs([]);
    setCallLogs([]);
    setThresholds(INITIAL_THRESHOLDS);

    // 5. Audit log this database purge
    const auditEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: currentUser?.email || 'admin_user',
      actorRole: currentUser?.role || 'system_admin',
      action: 'DATABASE_DEMO_DATA_PURGED',
      resource: 'database.all_patient_fixtures',
      details: 'All sample demo data, pre-canned patient profiles, and mock telemetry permanently cleared. Workspace reset to 100% clean live testing mode.',
      severity: 'INFO',
      ipAddress: '10.0.8.21',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    showToast('✨ All demo data deleted! Database reset to 100% clean live testing.');
    
    // Automatically launch device pairing wizard for live watch setup
    setTimeout(() => {
      setIsDevicePairModalOpen(true);
    }, 600);
  };

  // Sample Demo Profile Loader (to allow test driving full historical features without losing custom data)
  const handleLoadDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    handleSelectPatient('patient-eleanor');
    setCallLogs(INITIAL_CALL_LOGS);
    setMedications(INITIAL_MEDICATIONS);
    setDoseLogs(INITIAL_DOSE_LOGS);
    showToast('🧪 Loaded sample demo profile (Eleanor Miller) to explore features.');
  };

  // User Auth Handlers
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    try {
      localStorage.setItem('kinote_auth_user', JSON.stringify(user));
    } catch {}

    const isDemo = isDemoUser(user);

    if (!isDemo) {
      // Custom / Newly Registered User
      const storedPatientStr = localStorage.getItem('kinote_patient_' + user.id);
      let targetPatient: PatientProfile;
      if (storedPatientStr) {
        targetPatient = sanitizeCustomPatient(JSON.parse(storedPatientStr));
      } else {
        targetPatient = createDefaultCustomPatient(user);
        try {
          localStorage.setItem('kinote_patient_' + user.id, JSON.stringify(targetPatient));
        } catch {}
      }

      setPatients([targetPatient]);
      setActivePatientId(targetPatient.id);
      setVitals(targetPatient.vitals);
      setThresholds(targetPatient.thresholds);
      setDevices(targetPatient.devices);
      setEmergencyContacts(targetPatient.emergencyContacts);
      setMedications(targetPatient.medications || []);
      setDoseLogs(targetPatient.doseLogs || []);
      setCallLogs([]);
      setCurrentLocation(targetPatient.location || EMPTY_LOCATION);
      setPatientLocationsList((targetPatient as PatientWithLocations).savedLocations || []);
      setAuditLogs(createNewAccountAuditLogs(user));
      try {
        const savedMembership = localStorage.getItem(membershipStorageKey(user, false));
        setMembership(savedMembership ? JSON.parse(savedMembership) : createNewAccountMembership());
      } catch {
        setMembership(createNewAccountMembership());
      }

      if (user.role === 'senior_patient') {
        setActiveTab('senior');
      } else {
        setActiveTab('caregiver');
      }

      // If user has no paired wearables yet, automatically open the Device Pairing Wizard!
      if (targetPatient.devices.length === 0) {
        setIsDevicePairModalOpen(true);
      }
    } else {
      // Demo User (David Miller, Eleanor, Robert, or Dr. Thorne)
      setPatients(INITIAL_PATIENTS);
      setPatientLocationsList(PATIENT_LOCATIONS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      try {
        const savedMembership = localStorage.getItem(membershipStorageKey(user, true));
        setMembership(savedMembership ? JSON.parse(savedMembership) : INITIAL_MEMBERSHIP);
      } catch {
        setMembership(INITIAL_MEMBERSHIP);
      }
      if (user.id === 'user_eleanor_miller' || user.name.toLowerCase().includes('eleanor')) {
        handleSelectPatient('patient-eleanor');
        setActiveTab('senior');
      } else if (user.id === 'user_robert_miller' || user.name.toLowerCase().includes('robert')) {
        handleSelectPatient('patient-robert');
        setActiveTab('senior');
      } else {
        handleSelectPatient('patient-eleanor');
        setActiveTab('caregiver');
      }
    }

    showToast(`Signed in as ${user.name} (${user.role.replace(/_/g, ' ')})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('kinote_auth_user');
    } catch {}
    showToast('Signed out of session.');
  };

  const handleConfirmAccountPurge = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    setCurrentUser(null);
    showToast('🗑️ Account, senior profiles, and biometric logs permanently erased.');
  };

  // Membership & Billing Handlers
  const handleUpdatePlan = (newPlan: MembershipPlanType) => {
    setMembership((prev) => {
      const planName = newPlan === 'family_basic' ? 'KINOTE Family Basic' : newPlan === 'caregiver_plus' ? 'KINOTE Caregiver Plus' : 'KINOTE Clinical Concierge';
      const priceFormatted = newPlan === 'family_basic' ? '$15 / month' : newPlan === 'caregiver_plus' ? '$29 / month' : '$59 / month';
      const maxSeniors = newPlan === 'family_basic' ? 1 : newPlan === 'caregiver_plus' ? 3 : 999;
      const updated: MembershipDetails = {
        ...prev,
        planType: newPlan,
        planName,
        priceFormatted,
        maxSeniors,
        status: 'active',
      };
      try {
        localStorage.setItem(membershipStorageKey(currentUser, isDemoUser(currentUser)), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Plan updated to ${newPlan.replace(/_/g, ' ').toUpperCase()}`);
  };

  const handleSimulateGracePeriod = () => {
    setMembership((prev) => {
      const updated: MembershipDetails = { ...prev, status: 'grace_period' };
      try {
        localStorage.setItem(membershipStorageKey(currentUser, isDemoUser(currentUser)), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Simulated Billing Alert: 7-day medical grace period active. Telemetry remains live.');
  };

  // Save card details for billing: only brand, last 4 digits and expiry are kept (never the full number or CVC)
  const handleUpdateCard = (card: MembershipDetails['paymentMethod']) => {
    setMembership((prev) => {
      const updated: MembershipDetails = { ...prev, paymentMethod: card };
      try {
        localStorage.setItem(membershipStorageKey(currentUser, isDemoUser(currentUser)), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Card ending ${card.last4} saved.`);
  };

  const handleResetMembershipStatus = () => {
    setMembership((prev) => {
      const updated: MembershipDetails = { ...prev, status: 'active' };
      try {
        localStorage.setItem(membershipStorageKey(currentUser, isDemoUser(currentUser)), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Payment settled: Subscription restored to active standing.');
  };

  // One-tap action: Notify Senior via Kinote AI Voice system
  const handleNotifySeniorFromAlert = (notif: MissedDoseNotification) => {
    const voiceReason = `Missed Medication Alert: ${notif.patientName} missed scheduled dose of ${notif.medicationName} (${notif.dosage}) scheduled for ${notif.scheduledTime}. Calling senior to verify safety and prompt medication adherence.`;
    setActiveVoiceCallReason(voiceReason);
    setIsVoiceCallModalOpen(true);
    setActiveMissedDoseAlert(null); // Close floating popup once call initiated
    showToast(`Connecting Kinote AI Voice check-in call to ${notif.patientName}...`);

    // Audit log
    const auditEntry: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: currentUser?.email || 'caregiver',
      actorRole: 'family_caregiver',
      action: 'AI_VOICE_MEDICATION_REMINDER_TRIGGERED',
      resource: `patient.${activePatient.id}.call.${notif.medicationId}`,
      details: `One-tap 'Notify Senior' action triggered from push notification for ${notif.medicationName}. AI Voice call bridged.`,
      severity: 'INFO',
      ipAddress: '10.0.8.21',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);
  };

  // Medication Adherence Action Handlers
  const handleLogDose = (medicationId: string, status: MedicationDoseStatus, skipReason?: string) => {
    const med = medications.find((m) => m.id === medicationId);
    const medName = med?.name || 'Prescribed Medication';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Specifically alert caregivers with push notification when a 'Missed' dose is logged
    if (status === 'missed') {
      const newNotification: MissedDoseNotification = {
        id: `notif-${Date.now()}`,
        timestamp: 'Just now',
        patientName,
        medicationId,
        medicationName: medName,
        dosage: med?.dosage || 'Prescribed Dose',
        scheduledTime: med?.scheduledTimes?.[0] || nowTime,
        reason: skipReason || 'Dose unacknowledged after 45-min grace window elapsed',
        severity: 'high',
        channels: ['push', 'sms', 'chime'],
        acknowledged: false,
      };

      setActiveMissedDoseAlert(newNotification);
      setNotificationHistory((prev) => [newNotification, ...prev]);
      playEmergencyChime();

      // Log to HIPAA Audit Trail
      const auditEntry: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: 'kinote.dispenser.telemetry',
        actorRole: 'system_admin',
        action: 'MISSED_MEDICATION_PUSH_DISPATCH',
        resource: `patient.${activePatient.id}.medication.${medicationId}`,
        details: `Missed dose logged for ${medName} (${med?.dosage}). Push notification dispatched to ${currentUser?.name || 'the caregiver'}. One-tap AI voice check-in enabled.`,
        severity: 'WARNING',
        ipAddress: '10.0.8.21',
        sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };
      setAuditLogs((prevLogs) => [auditEntry, ...prevLogs]);
    }

    setDoseLogs((prev) => {
      const existingIdx = prev.findIndex((d) => d.medicationId === medicationId && d.scheduledDate === '2026-09-25');
      let updated: MedicationDoseLog[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          status,
          loggedAt: nowTime,
          loggedBy: 'caregiver',
          skipReason,
        };
      } else {
        const newDose: MedicationDoseLog = {
          id: `dose-${Date.now()}`,
          medicationId,
          medicationName: medName,
          dosage: med?.dosage || '',
          scheduledTime: nowTime,
          scheduledDate: '2026-09-25',
          status,
          loggedAt: nowTime,
          loggedBy: 'caregiver',
          skipReason,
        };
        updated = [newDose, ...prev];
      }
      try {
        localStorage.setItem('kinote_dose_logs', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleAddMedication = (newMed: Omit<MedicationItem, 'id' | 'createdAt'>) => {
    const fullMed: MedicationItem = {
      ...newMed,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMedications((prev) => {
      const updated = [...prev, fullMed];
      try {
        localStorage.setItem('kinote_medications', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  };

  const handleUpdateMedicationReminders = (
    medicationId: string, 
    reminderTimes: string[], 
    channels: MedicationItem['reminders']['notificationChannels']
  ) => {
    setMedications((prev) => {
      const updated = prev.map((m) => {
        if (m.id === medicationId) {
          return {
            ...m,
            scheduledTimes: reminderTimes,
            reminders: {
              ...m.reminders,
              reminderTimes,
              notificationChannels: channels,
            },
          };
        }
        return m;
      });
      try {
        localStorage.setItem('kinote_medications', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Subtle real-time heart rate variation (resting micro-jitter)
  useEffect(() => {
    const interval = setInterval(() => {
      setVitals((prev) => {
        // If not streaming or in extreme simulation, don't jitter
        if (prev.heartRate === 0 || prev.heartRate > 125 || prev.heartRate < 45) return prev;
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
        return {
          ...prev,
          heartRate: Math.max(58, Math.min(84, prev.heartRate + delta)),
          timestamp: 'Just now',
        };
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle vitals simulation scenarios
  const handleSimulateVitals = (scenario: 'normal' | 'tachycardia' | 'hypoxia' | 'hypertension' | 'fall') => {
    let newVitals: VitalsReading;
    let reason = '';

    if (scenario === 'normal') {
      newVitals = {
        ...INITIAL_VITALS,
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 78,
        spo2: 98,
        fallDetected: false,
      };
      showToast('Telemetry restored to normal baseline.');
    } else if (scenario === 'tachycardia') {
      newVitals = {
        ...vitals,
        heartRate: 142,
        bloodPressureSystolic: 148,
        bloodPressureDiastolic: 92,
        fallDetected: false,
      };
      reason = 'Acute Tachycardia Detected: Heart Rate 142 BPM (Exceeds critical limit)';
      showToast('CRITICAL PUSH NOTIFICATION: Tachycardia spike detected from Apple Watch.');
      playEmergencyChime();
    } else if (scenario === 'hypoxia') {
      newVitals = {
        ...vitals,
        heartRate: 108,
        spo2: 86,
        respiratoryRate: 24,
        fallDetected: false,
      };
      reason = 'Severe Hypoxia: SpO2 dropped to 86% with labored respiration';
      showToast('CRITICAL PUSH NOTIFICATION: Severe Hypoxia SpO2 < 88% detected.');
      playEmergencyChime();
    } else if (scenario === 'hypertension') {
      newVitals = {
        ...vitals,
        bloodPressureSystolic: 188,
        bloodPressureDiastolic: 118,
        heartRate: 94,
        fallDetected: false,
      };
      reason = 'Hypertensive Crisis: BP 188/118 mmHg measured via Omron Cuff';
      showToast('CRITICAL PUSH NOTIFICATION: Hypertensive crisis threshold breached.');
      playEmergencyChime();
    } else {
      newVitals = {
        ...vitals,
        heartRate: 118,
        fallDetected: true,
      };
      reason = 'Multi-sensor Impact: High-G fall followed by 15s motionless reading';
      showToast('EMERGENCY: Fall detected on floor accelerometer (Sensor Quorum).');
      playEmergencyChime();
    }

    setVitals(newVitals);

    // If critical and auto-dispatch is enabled, launch KINOTE AI Voice Call (Opt A -> Opt C -> Opt B)
    if (scenario !== 'normal' && thresholds.voiceCallAutoDispatch) {
      setActiveVoiceCallReason(reason);
      setIsVoiceCallModalOpen(true);

      // Record to audit log
      const newAudit: AuditLogEntry = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        actor: 'kinote.telemetry.engine',
        actorRole: 'system_admin',
        action: 'CRITICAL_VITALS_BREACH',
        resource: `patient.${activePatient.id}.biometrics`,
        details: `${reason} · Location: ${currentLocation.label}`,
        severity: 'CRITICAL',
        ipAddress: '10.0.8.21',
        sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };
      setAuditLogs((prev) => [newAudit, ...prev]);
    }
  };

  const handleLaunchAIVoiceCall = (reason: string) => {
    setActiveVoiceCallReason(reason);
    setIsVoiceCallModalOpen(true);
  };

  const handleCallResolved = (newLog: AIVoiceCallLog) => {
    setCallLogs((prev) => [newLog, ...prev]);
    showToast(`KINOTE Emergency Voice Call session logged to HIPAA encrypted ledger.`);

    const newAudit: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: 'kinote.ai_voice_dispatch',
      actorRole: 'system_admin',
      action: 'AI_VOICE_CALL_CONCLUDED',
      resource: 'voice.emergency_session',
      details: `Call with ${newLog.recipientName} (${newLog.callStatus}). Stage reached: ${newLog.stageReached}. Dispatched EMS: ${newLog.dispatchDispatched}`,
      severity: newLog.dispatchDispatched ? 'CRITICAL' : 'INFO',
      ipAddress: '10.0.12.9',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const handleSaveThresholds = (newThresholds: MetricThresholds) => {
    setThresholds(newThresholds);
    setPatients((prev) => {
      const updated = prev.map((p) => (p.id === activePatientId ? { ...p, thresholds: newThresholds } : p));
      try {
        localStorage.setItem('kinote_patients_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const newAudit: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: currentUser?.email || 'caregiver',
      actorRole: currentUser?.role || 'family_caregiver',
      action: 'THRESHOLDS_RECONFIGURED',
      resource: `patient.${activePatientId}.thresholds`,
      details: `Custom ranges updated for ${activePatient.name}: Max HR ${newThresholds.heartRate.maxCritical} BPM, Max BP ${newThresholds.bloodPressureSystolic.maxCritical} mmHg, Sync Protocol: ${newThresholds.wearableSyncProtocol}`,
      severity: 'INFO',
      ipAddress: '198.51.100.42',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
    showToast(`KINOTE Thresholds & Sync rules updated for ${activePatient.name}.`);
  };

  const handleResetThresholds = () => {
    const defaultForPatient = activePatientId === 'patient-robert' ? ROBERT_THRESHOLDS : INITIAL_THRESHOLDS;
    setThresholds(defaultForPatient);
    setPatients((prev) => {
      const updated = prev.map((p) => (p.id === activePatientId ? { ...p, thresholds: defaultForPatient } : p));
      try {
        localStorage.setItem('kinote_patients_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast(`Thresholds for ${activePatient.name} restored to baseline clinical defaults.`);
  };

  const handleToggleDeviceConnect = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, connected: !d.connected, lastSync: 'Just now' } : d))
    );
  };

  const handleAddDevice = (newDev: WearableDevice) => {
    setDevices((prev) => [newDev, ...prev]);
    showToast(`Device paired: ${newDev.name} (${newDev.brand}). Universal Ingestion active.`);
  };

  const handleSyncAllDevices = () => {
    setDevices((prev) => prev.map((d) => ({ ...d, lastSync: 'Just now' })));
    showToast('All 5 wearable monitors synchronized.');
  };

  // Save the active location (and the list of saved locations) on the patient for real accounts
  const persistPatientLocation = (loc: PatientLocation, list: PatientLocation[]) => {
    const updatedPatient: PatientWithLocations = { ...activePatient, location: loc, savedLocations: list };
    setPatients((prev) => prev.map((p) => (p.id === activePatient.id ? updatedPatient : p)));
    if (currentUser && !isDemoUser(currentUser)) {
      try {
        localStorage.setItem('kinote_patient_' + currentUser.id, JSON.stringify(updatedPatient));
      } catch {}
    }
  };

  const handleAddLocation = (loc: PatientLocation) => {
    const list = [...patientLocationsList.filter((l) => l.label !== loc.label), loc];
    setPatientLocationsList(list);
    setCurrentLocation(loc);
    persistPatientLocation(loc, list);
    showToast(`Location added: ${loc.label}`);
  };

  const handleSelectLocation = (loc: PatientLocation) => {
    setCurrentLocation(loc);
    persistPatientLocation(loc, patientLocationsList);
    showToast(`Dispatch location set to: ${loc.label} (${loc.dispatchPreference.replace(/_/g, ' ').toUpperCase()})`);
    
    const newAudit: AuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      actor: currentUser?.email || 'caregiver',
      actorRole: 'family_caregiver',
      action: 'LOCATION_ROUTER_UPDATED',
      resource: 'patient.location',
      details: `Switched location to ${loc.label} · PSAP: ${loc.nearestPSAP}`,
      severity: 'INFO',
      ipAddress: '198.51.100.42',
      sha256Hash: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  // Render main tab view content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'senior':
        return (
          <SeniorSafeView
            vitals={vitals}
            patientName={patientName}
            onTriggerSOS={() => handleLaunchAIVoiceCall('Senior SafeMode Emergency SOS Triggered')}
            onStartAIVoiceCheckin={() => handleLaunchAIVoiceCall('Senior Manual Voice Wellness Check-in')}
            primaryContactName={emergencyContacts[0]?.name || 'David Miller (Son)'}
            primaryContactPhone={emergencyContacts[0]?.phone || '+1 (555) 234-8901'}
            medications={medications}
            doseLogs={doseLogs}
            onLogDose={handleLogDose}
            devices={devices}
            onRemoveDevice={handleRemoveDevice}
            onRemoveAllDevices={handleRemoveAllDevices}
            onOpenPairModal={() => setIsDevicePairModalOpen(true)}
          />
        );
      case 'caregiver':
        return (
          <CaregiverDashboard
            vitals={vitals}
            thresholds={thresholds}
            devices={devices}
            emergencyContacts={emergencyContacts}
            callLogs={callLogs}
            patientLocation={currentLocation}
            patientLocationsList={patientLocationsList}
            onSelectPatientLocation={handleSelectLocation}
            onAddPatientLocation={handleAddLocation}
            patientName={patientName}
            onSimulateVitals={handleSimulateVitals}
            onInitiateAIVoiceCall={handleLaunchAIVoiceCall}
            onUpdateContacts={(c) => setEmergencyContacts(c)}
            onOpenAIAssistant={() => setActiveTab('ai_assistant')}
            medications={medications}
            doseLogs={doseLogs}
            onLogDose={handleLogDose}
            onAddMedication={handleAddMedication}
            onUpdateMedicationReminders={handleUpdateMedicationReminders}
            onOpenPairModal={() => setIsDevicePairModalOpen(true)}
            onLoadDemoData={handleLoadDemoData}
            onPurgeDemoData={() => setIsCleanLiveModalOpen(true)}
            isCustomUser={!isDemoUser(currentUser)}
            onRemoveDevice={handleRemoveDevice}
            onRemoveAllDevices={handleRemoveAllDevices}
          />
        );
      case 'ai_assistant':
        return (
          <KinoteAIAssistant
            vitals={vitals}
            thresholds={thresholds}
            devices={devices}
            callLogs={callLogs}
            patientLocation={currentLocation}
            patientName={patientName}
            medications={medications}
            doseLogs={doseLogs}
          />
        );
      case 'thresholds':
        return (
          <ThresholdsSettings
            thresholds={thresholds}
            onSave={handleSaveThresholds}
            onReset={handleResetThresholds}
            patientName={activePatient.name}
            patientRelationship={activePatient.relationship}
            activePatientId={activePatientId}
            patientsList={patients.map((p) => ({ id: p.id, name: p.name, relationship: p.relationship }))}
            onSelectPatient={handleSelectPatient}
          />
        );
      case 'devices':
        return (
          <DevicesManager
            devices={devices}
            onToggleDeviceConnect={handleToggleDeviceConnect}
            onAddDevice={handleAddDevice}
            onSyncAll={handleSyncAllDevices}
            onRealVitalsUpdate={(v) => {
              setVitals((prev) => ({ ...prev, ...v }));
              showToast(`⚡ Real-time vital received from smartwatch: HR ${v.heartRate} BPM`);
            }}
            onRemoveDevice={handleRemoveDevice}
          />
        );
      case 'compliance':
        return (
          <ComplianceAndAudit
            auditLogs={auditLogs}
            currentRole={currentRole}
            onRoleChange={(r) => {
              setCurrentRole(r);
              showToast(`Active role switched to: ${r}`);
            }}
            onOpenPrivacyPolicy={() => setIsPrivacyModalOpen(true)}
            onOpenAccountDeletion={() => setIsAccountDeletionModalOpen(true)}
          />
        );
      case 'membership':
        return (
          <MembershipBilling
            membership={membership}
            onUpdatePlan={handleUpdatePlan}
            onSimulateGracePeriod={handleSimulateGracePeriod}
            onResetStatus={handleResetMembershipStatus}
            onUpdateCard={handleUpdateCard}
            patientCount={patients.length}
            patientNames={patients.map((p) => p.name)}
            cardholderName={currentUser?.name || ''}
          />
        );
      default:
        return null;
    }
  };

  // If user is not authenticated, display the Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} initialRole={currentRole} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-teal-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {/* 
        TOP BAR CONTRACT:
        Left: Brand logo ("KINOTE") + Senior Switcher
        Center (Desktop): Navigation links
        Right: Live Call button, User Account, Sign Out, Menu button (3-lines)
        Always fitted within the viewport width with zero horizontal side scroll!
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full max-w-full">
        {/* Main Header Row: Brand Logo + Primary Actions (Fitted for mobile & desktop) */}
        <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Zone 1: Brand wordmark (and Patient Switcher on desktop/tablet) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('caregiver');
              }}
              className="text-lg sm:text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5 sm:gap-2 hover:opacity-90 transition-opacity shrink-0"
              title="KINOTE Family Health & Emergency Dispatch"
            >
              <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white text-xs sm:text-base shadow-xs shrink-0">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              </span>
              <span className="tracking-tight text-slate-900 font-black">KINOTE</span>
            </a>

            {/* Desktop / Tablet Patient Switcher (Positioned beside logo) */}
            <div className="hidden sm:block">
              <PatientSwitcher
                patients={patients}
                activePatientId={activePatientId}
                onSelectPatient={handleSelectPatient}
                membership={membership}
                onAddNewPatient={handleAddNewPatient}
              />
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop only) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('caregiver')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'caregiver' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              Caregiver Hub
            </button>
            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`transition-colors hover:text-slate-900 flex items-center gap-1.5 ${
                activeTab === 'ai_assistant' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-teal-600" />
              <span>Kinote AI Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab('senior')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'senior' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              Senior SafeMode
            </button>
            <button
              onClick={() => setActiveTab('thresholds')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'thresholds' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              Custom Thresholds
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'devices' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              Wearables Ecosystem
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`transition-colors hover:text-slate-900 ${
                activeTab === 'compliance' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              HIPAA &amp; Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('membership')}
              className={`transition-colors hover:text-slate-900 flex items-center gap-1.5 ${
                activeTab === 'membership' ? 'text-teal-700 font-bold underline underline-offset-8 decoration-2' : ''
              }`}
            >
              <span>Membership &amp; Billing</span>
              {membership.status === 'grace_period' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Actions (Live Call, User Account, Sign Out, Menu Button) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Offline-First & On-Device AI Status Badge (Desktop & Tablet) */}
            <button
              onClick={() => {
                const next = !simulateOfflineMode;
                setSimulateOfflineMode(next);
                showToast(next ? '⚡ Offline Mode Simulated: On-Device AI, Local BLE & Emergency SafeMode remain active.' : '🟢 Internet Connection Active: Telemetry synced.');
              }}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                effectiveOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
                  : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              }`}
              title="Click to toggle offline mode simulation and verify local on-device operation"
            >
              {effectiveOnline ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden xl:inline">On-Device AI</span>
                  <span className="text-[10px] text-emerald-600 font-mono">(Live)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="hidden xl:inline">Offline Mode</span>
                  <span className="text-[10px] text-amber-800 font-mono font-bold">(Local AI)</span>
                </>
              )}
            </button>

            {/* Notification Center Tray Bell (Desktop & Tablet) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
                className="relative p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                title="Missed Medication & Push Notification Tray"
              >
                <Bell className="w-4 h-4" />
                {(activeMissedDoseAlert || notificationHistory.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {notificationHistory.length || 1}
                  </span>
                )}
              </button>

              {/* Notification Center Dropdown */}
              {isNotificationCenterOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold">Caregiver Push Notifications</span>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      {notificationHistory.length} alerts
                    </span>
                  </div>

                  <div className="p-2 max-h-80 overflow-y-auto space-y-2">
                    {notificationHistory.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                        <p>No push notification alerts logged yet.</p>
                        <button
                          onClick={() => {
                            handleLogDose('med-atorvastatin', 'missed', 'Simulated missed dose alert from notification tray');
                            setIsNotificationCenterOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-semibold border border-rose-200 hover:bg-rose-100 transition-colors text-xs cursor-pointer"
                        >
                          ⚡ Simulate Missed Dose Alert
                        </button>
                      </div>
                    ) : (
                      notificationHistory.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <span>Missed Dose: {notif.medicationName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{notif.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {notif.patientName} missed {notif.dosage} scheduled for {notif.scheduledTime}.
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                            <button
                              onClick={() => {
                                handleNotifySeniorFromAlert(notif);
                                setIsNotificationCenterOpen(false);
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Notify Senior (AI Voice)</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <button
                      onClick={() => {
                        handleLogDose('med-atorvastatin', 'missed', 'Simulated missed dose alert: unacknowledged 45-min grace');
                        setIsNotificationCenterOpen(false);
                      }}
                      className="text-rose-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Test Missed Alert</span>
                    </button>
                    <button
                      onClick={() => setIsNotificationCenterOpen(false)}
                      className="text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Phone Test QR Button */}
            <button
              onClick={() => setIsMobileTesterOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/90 border border-teal-200 text-teal-800 text-xs font-bold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
              title="Scan QR Code to open on your smartphone"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="hidden sm:inline">Test on Mobile</span>
            </button>

            {/* Live Call Button (Visible on all screens) */}
            <button
              onClick={() => handleLaunchAIVoiceCall('Caregiver Voice Triage Test')}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
              title="Initiate Live AI Voice Call"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-300 shrink-0 animate-pulse" />
              <span className="text-[11px] sm:text-xs">Live Call</span>
            </button>

            {/* User Account with Dropdown (Sign Out attached to user's name) */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/90 border border-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                title={`Account: ${currentUser.name} (${currentUser.role}) - Tap to open options`}
                aria-expanded={isUserDropdownOpen}
              >
                <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold max-w-[65px] xs:max-w-[85px] sm:max-w-none truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Menu with Sign Out Button */}
              {isUserDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40 bg-slate-950/20 sm:bg-transparent"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />

                  {/* Dropdown panel */}
                  <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 p-2.5 space-y-2.5">
                    {/* User Profile Card */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-teal-700 font-semibold capitalize truncate">{currentUser.role.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-200/60 font-mono">
                        {currentUser.email}
                      </p>
                    </div>

                    {/* Test on Mobile Phone (QR Code) */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsMobileTesterOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-teal-200"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>Test on Mobile Phone (QR)</span>
                    </button>

                    {/* In-App PWA Install */}
                    <PWAInstallPrompt className="w-full justify-center" />

                    {/* Delete Demo Data & Reset to 100% Live Testing */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsCleanLiveModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer border border-teal-300"
                    >
                      <Radio className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>Delete Demo Data (Live Only)</span>
                    </button>

                    {/* Privacy Policy & Play Store Data Safety */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsPrivacyModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>Privacy &amp; Data Safety</span>
                    </button>

                    {/* Google Play Mandatory Account & Data Deletion */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setIsAccountDeletionModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-700 hover:text-rose-800 text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer border border-dashed border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Delete Account &amp; Data</span>
                    </button>

                    {/* Sign In as New User / Register Account */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Sign In as New User</span>
                    </button>

                    {/* Attached Sign Out Button inside dropdown */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs border border-rose-200/80"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Desktop-only quick Sign Out Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors items-center gap-1 cursor-pointer shadow-2xs shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600 shrink-0" />
              <span className="text-xs">Sign Out</span>
            </button>

            {/* Mobile 3-Lines (Hamburger) Toggle Button (Visible only on mobile / small screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-2xs shrink-0 relative"
              aria-label="Toggle navigation menu"
              title={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
              )}
              {notificationHistory.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dedicated Patient Switcher Bar (Visible only on small screens) */}
        <div className="sm:hidden px-3 py-1.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Senior:
            </span>
            <PatientSwitcher
              patients={patients}
              activePatientId={activePatientId}
              onSelectPatient={handleSelectPatient}
              membership={membership}
              onAddNewPatient={handleAddNewPatient}
            />
          </div>
          <div className="text-[10px] font-mono text-teal-800 font-semibold shrink-0 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
            {activePatient.vitals.heartRate} BPM · {activePatient.vitals.bloodPressureSystolic}/{activePatient.vitals.bloodPressureDiastolic}
          </div>
        </div>
      </header>

      {/* Collapsible Mobile Navigation Menu (3-lines drawer, only for mobile view) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 shadow-xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu &amp; Navigation
            </span>
            <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/60">
              Focus: {activePatient.name}
            </span>
          </div>

          {/* Mobile Utility Bar: Offline Mode Toggle + Notifications */}
          <div className="flex items-center gap-2 pt-1 pb-2 border-b border-slate-100 flex-wrap">
            <button
              onClick={() => {
                const next = !simulateOfflineMode;
                setSimulateOfflineMode(next);
                showToast(next ? '⚡ Offline Mode Simulated: On-Device AI active.' : '🟢 Internet Connection Active: Telemetry synced.');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                effectiveOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {effectiveOnline ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>On-Device AI (Live)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Offline Mode (Local AI)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsNotificationCenterOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-200 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span>Alerts ({notificationHistory.length})</span>
            </button>
          </div>

          {/* Mobile Phone Test QR Button */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsMobileTesterOpen(true);
            }}
            className="w-full px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-teal-200 shadow-2xs"
          >
            <Smartphone className="w-4 h-4 text-teal-700" />
            <span>📱 Test on Mobile Phone (QR Code & Direct Link)</span>
          </button>

          {/* In-App PWA Install Banner */}
          <PWAInstallPrompt variant="banner" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-sm font-medium">
            <button
              onClick={() => {
                setActiveTab('caregiver');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'caregiver'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span>Caregiver Hub</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ai_assistant');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'ai_assistant'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 text-teal-500" />
              <span>Kinote AI Assistant</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('senior');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'senior'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Senior SafeMode</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('thresholds');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'thresholds'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Custom Thresholds</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('devices');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Watch className="w-4 h-4 shrink-0" />
              <span>Wearables Ecosystem</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('compliance');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'compliance'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>HIPAA &amp; Audit Trail</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('membership');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'membership'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Membership &amp; Billing</span>
              </div>
              {membership.status === 'grace_period' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Privacy & Erasure shortcuts in mobile menu */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsCleanLiveModalOpen(true);
              }}
              className="text-teal-700 hover:text-teal-800 font-bold underline underline-offset-2 cursor-pointer flex items-center gap-1"
            >
              <Radio className="w-3.5 h-3.5 text-teal-600" />
              <span>Live Mode Only</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPrivacyModalOpen(true);
              }}
              className="text-slate-600 hover:text-slate-800 font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAccountDeletionModalOpen(true);
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Data</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Signed in as <strong className="text-slate-800">{currentUser.name}</strong></span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New User</span>
              </button>
              <span>·</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification System: Missed Medication Alert with One-Tap 'Notify Senior' */}
      <MissedDosePushAlert
        notification={activeMissedDoseAlert}
        onDismiss={() => setActiveMissedDoseAlert(null)}
        onNotifySenior={handleNotifySeniorFromAlert}
        onViewSchedule={() => {
          setActiveTab('caregiver');
        }}
      />

      {/* Floating System Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl text-xs font-medium flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 max-w-md">
          <Bell className="w-4 h-4 text-teal-400 shrink-0 animate-bounce" />
          <span className="leading-snug">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold ml-auto text-base">
            &times;
          </button>
        </div>
      )}

      {/* Offline Mode Active Notification Banner */}
      {!effectiveOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold shadow-xs">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                Offline-First Resilience Active: Running 100% on-device AI inference, local BLE wearable gateway, and Senior SafeMode without cloud connection.
              </span>
            </div>
            <button
              onClick={() => setSimulateOfflineMode(false)}
              className="ml-auto underline cursor-pointer hover:text-white shrink-0"
            >
              Resume Cloud Sync
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Application Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6">
        {/* Render Active Tab */}
        {renderTabContent()}
      </main>

      {/* AI Emergency Voice Call Modal with 3-Stage Cascading Triage */}
      <AIVoiceCallModal
        isOpen={isVoiceCallModalOpen}
        onClose={() => setIsVoiceCallModalOpen(false)}
        patientName={patientName}
        triggerReason={activeVoiceCallReason}
        currentVitalsSummary={`HR: ${vitals.heartRate} BPM, BP: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}, SpO2: ${vitals.spo2}%`}
        patientLocation={currentLocation}
        onCallResolved={handleCallResolved}
      />

      {/* Privacy Policy & Health Disclaimers Modal (Google Play Compliance) */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onRequestDeleteAccount={() => setIsAccountDeletionModalOpen(true)}
      />

      {/* Account & Telemetry Data Deletion Modal (Google Play 2023+ Mandatory Requirement) */}
      {currentUser && (
        <AccountDeletionModal
          isOpen={isAccountDeletionModalOpen}
          onClose={() => setIsAccountDeletionModalOpen(false)}
          currentUser={currentUser}
          onConfirmPurge={handleConfirmAccountPurge}
        />
      )}

      {/* Clean Live Testing & Demo Purge Modal */}
      <CleanLiveTestingModal
        isOpen={isCleanLiveModalOpen}
        onClose={() => setIsCleanLiveModalOpen(false)}
        onPurgeAndStartLive={handlePurgeAllDemoDataAndStartLive}
        activePatientName={patientName}
      />

      {/* Mobile Phone QR & Direct URL Tester Modal */}
      <MobileTesterModal
        isOpen={isMobileTesterOpen}
        onClose={() => setIsMobileTesterOpen(false)}
      />

      {/* Device Setup & Wearable Pairing Modal */}
      <DevicePairingModal
        isOpen={isDevicePairModalOpen}
        onClose={() => setIsDevicePairModalOpen(false)}
        userName={currentUser?.name || 'User'}
        onDevicePaired={handleDevicePaired}
        onLoadDemoData={handleLoadDemoData}
      />

      {/* Google Play Store Compliant Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">© 2026 KINOTE Health Technologies · AES-256 Cloud KMS Envelope Encryption</p>
            <p className="text-[11px] text-slate-400">Notice: KINOTE is a wellness caregiving tool, not an FDA-cleared diagnostic device or 911 dispatch replacement.</p>
          </div>
          <div className="flex items-center gap-3.5 flex-wrap justify-center text-xs">
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Privacy Policy &amp; Data Safety
            </button>
            <span>·</span>
            <button
              onClick={() => setIsAccountDeletionModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 cursor-pointer"
            >
              Account Deletion
            </button>
            <span>·</span>
            <span className="text-slate-400 font-mono">HIPAA &amp; GDPR Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
