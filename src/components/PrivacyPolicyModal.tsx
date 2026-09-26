import React from 'react';
import { 
  ShieldAlert, 
  Lock, 
  MapPin, 
  Activity, 
  Trash2, 
  X, 
  FileText, 
  AlertTriangle,
  Server,
  PhoneCall,
  UserCheck
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeleteAccount: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onRequestDeleteAccount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600/30 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">KINOTE Privacy Policy &amp; Data Safety</h2>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-mono">
                  Play Store Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">Effective Date: September 2026 • Version 2.4.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* Critical Medical & Emergency Disclaimer (Google Play Requirement) */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300/80 text-amber-950 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>MANDATORY HEALTH &amp; EMERGENCY DISCLAIMER</span>
            </div>
            <p className="text-xs leading-relaxed">
              <strong>KINOTE is not an FDA-cleared medical device</strong> and is not intended to diagnose, treat, cure, or prevent any illness, disease, cardiac event, or clinical condition. Telemetry metrics (Heart Rate, Blood Pressure, SpO2, and Fall Detection) are collected from commercial consumer wearables for informational family caregiving and wellness coordination only.
            </p>
            <p className="text-xs font-semibold text-rose-800">
              ⚠️ In case of a suspected acute medical emergency, chest pain, stroke, or severe injury, immediately dial 911 or your local emergency dispatch service. KINOTE does not replace professional 911 emergency services.
            </p>
          </div>

          {/* 1. Biometric & Vital Telemetry Data */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>1. Health &amp; Biometric Telemetry Collection</span>
            </h3>
            <p className="text-xs text-slate-600">
              KINOTE connects with paired Bluetooth Low Energy (BLE) and wearable platforms (Apple Watch, Oura, Garmin, Omron). We collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li><strong>Continuous Heart Rate (BPM) &amp; Pulse Waveform</strong>: To identify personalized high/low tachycardia or bradycardia threshold breaches.</li>
              <li><strong>Blood Oxygen Saturation (SpO2 %)</strong>: Real-time telemetry to alert caregivers of hypoxemia drops below safe thresholds.</li>
              <li><strong>Blood Pressure (Systolic / Diastolic mmHg)</strong>: Intermittent cuff readings for hypertensive crisis monitoring.</li>
              <li><strong>Accelerometer &amp; Fall Detection Signals</strong>: Sudden impact metrics to trigger the SafeMode SOS cascade.</li>
              <li><strong>Medication Adherence Logs</strong>: Timestamped schedules and dose acknowledgments to combat missed medications.</li>
            </ul>
          </section>

          {/* 2. Location Tracking & Senior Geofencing */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-700" />
              <span>2. Emergency GPS Location Data</span>
            </h3>
            <p className="text-xs text-slate-600">
              Senior coordinates are gathered strictly to display current location on the Caregiver Hub map and provide emergency responders or family circle members with precise location context during an automated AI voice call or panic button event. Location data is never sold, brokered, or used for advertising purposes.
            </p>
          </section>

          {/* 3. Emergency Contacts & AI Voice Calls */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-teal-700" />
              <span>3. Emergency Contacts &amp; AI Voice Triage Dispatch</span>
            </h3>
            <p className="text-xs text-slate-600">
              When an SOS panic event or critical biometric spike is detected, KINOTE initiates automated voice triage calls. We store contact telephone numbers and triage call transcripts to maintain a transparent, auditable care history for family members.
            </p>
          </section>

          {/* 4. Encryption & Security Standards */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>4. Data Security &amp; Encryption Standards</span>
            </h3>
            <p className="text-xs text-slate-600">
              All telemetry in transit is encrypted using TLS 1.3 / HTTPS. All stored baselines and audit logs are encrypted using AES-256 with role-based access control (RBAC). In Offline Mode, vital evaluation executes entirely on-device without cloud transmission.
            </p>
          </section>

          {/* 5. Google Play Data Safety Compliance Overview */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Google Play Console Data Safety Declarations
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Data Encrypted in Transit</span>
                <span className="text-teal-700 font-semibold">✓ Yes (HTTPS / TLS 1.3)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Data Deletion Mechanism</span>
                <span className="text-teal-700 font-semibold">✓ Yes (In-app one-click purge)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Third-Party Data Sharing</span>
                <span className="text-slate-600">None (Zero advertising/brokerage)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="font-bold text-slate-900 block">Health &amp; Fitness Category</span>
                <span className="text-slate-600">Caregiving &amp; Vitals Coordination</span>
              </div>
            </div>
          </div>

          {/* 6. Account & Data Deletion Rights */}
          <section className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 font-bold">
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Right to Erasure &amp; Account Deletion (Google Play Mandatory)</span>
            </div>
            <p className="text-xs text-rose-950">
              In accordance with Google Play's 2023+ Account Deletion requirement, HIPAA Security Rule, and GDPR, you have the full right to delete your caregiver account and permanently erase all associated senior profiles, biometric telemetry, medication logs, and emergency contacts.
            </p>
            <button
              onClick={() => {
                onClose();
                onRequestDeleteAccount();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Initiate Account &amp; Data Deletion</span>
            </button>
          </section>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">Contact DPO: privacy@kinotehealth.org</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
          >
            I Understand &amp; Agree
          </button>
        </div>

      </div>
    </div>
  );
};
