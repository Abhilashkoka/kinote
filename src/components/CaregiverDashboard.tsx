import { useState } from 'react';
import { 
  Heart, 
  Activity, 
  Wind, 
  PhoneCall, 
  ShieldAlert, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Check, 
  Thermometer, 
  Droplet, 
  Sparkles,
  Phone,
  FileText,
  MapPin,
  Bot,
  Compass,
  ArrowRight,
  Scale,
  CircleDot,
  Watch,
  Layers,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { 
  EmergencyContact, 
  MetricThresholds, 
  PatientLocation, 
  VitalsReading, 
  WearableDevice, 
  AIVoiceCallLog,
  WearableCategory,
  MedicationItem,
  MedicationDoseLog,
  MedicationDoseStatus
} from '../types';
import VitalTrends from './VitalTrends';
import MedicationManagement from './MedicationManagement';
import MedicationAdherenceCharts from './MedicationAdherenceCharts';

interface CaregiverDashboardProps {
  vitals: VitalsReading;
  thresholds: MetricThresholds;
  devices: WearableDevice[];
  emergencyContacts: EmergencyContact[];
  callLogs: AIVoiceCallLog[];
  patientLocation: PatientLocation;
  patientLocationsList: PatientLocation[];
  onSelectPatientLocation: (loc: PatientLocation) => void;
  patientName: string;
  onSimulateVitals: (scenario: 'normal' | 'tachycardia' | 'hypoxia' | 'hypertension' | 'fall') => void;
  onInitiateAIVoiceCall: (triggerReason: string) => void;
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  onOpenAIAssistant: () => void;
  medications: MedicationItem[];
  doseLogs: MedicationDoseLog[];
  onLogDose: (medicationId: string, status: MedicationDoseStatus, skipReason?: string) => void;
  onAddMedication: (newMed: Omit<MedicationItem, 'id' | 'createdAt'>) => void;
  onUpdateMedicationReminders?: (medicationId: string, reminderTimes: string[], channels: MedicationItem['reminders']['notificationChannels']) => void;
  onOpenPairModal?: () => void;
  onLoadDemoData?: () => void;
  isCustomUser?: boolean;
  onRemoveDevice?: (deviceId: string) => void;
  onRemoveAllDevices?: () => void;
}

export default function CaregiverDashboard({
  vitals,
  thresholds,
  devices,
  emergencyContacts,
  callLogs,
  patientLocation,
  patientLocationsList,
  onSelectPatientLocation,
  patientName,
  onSimulateVitals,
  onInitiateAIVoiceCall,
  onUpdateContacts,
  onOpenAIAssistant,
  medications,
  doseLogs,
  onLogDose,
  onAddMedication,
  onUpdateMedicationReminders,
  onOpenPairModal,
  onLoadDemoData,
  isCustomUser,
  onRemoveDevice,
  onRemoveAllDevices,
}: CaregiverDashboardProps) {
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [selectedCallLog, setSelectedCallLog] = useState<AIVoiceCallLog | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeWearableTab, setActiveWearableTab] = useState<'all' | 'cgm' | 'smartwatch' | 'ring' | 'bp_cuff' | 'patch' | 'pulse_ox' | 'scale' | 'pendant'>('all');

  // Status checks against thresholds (only triggers when a device is paired and actively streaming)
  const isStreaming = devices.length > 0 && vitals.heartRate > 0;
  
  const isHrWarn = isStreaming && (vitals.heartRate > thresholds.heartRate.maxWarn || vitals.heartRate < thresholds.heartRate.minWarn);
  const isHrCrit = isStreaming && (vitals.heartRate > thresholds.heartRate.maxCritical || vitals.heartRate < thresholds.heartRate.minCritical);
  
  const isBpWarn = isStreaming && (vitals.bloodPressureSystolic > thresholds.bloodPressureSystolic.maxWarn);
  const isBpCrit = isStreaming && (vitals.bloodPressureSystolic > thresholds.bloodPressureSystolic.maxCritical);
  
  const isSpo2Warn = isStreaming && (vitals.spo2 < thresholds.spo2.minWarn);
  const isSpo2Crit = isStreaming && (vitals.spo2 < thresholds.spo2.minCritical);

  const isAnyCritical = isHrCrit || isBpCrit || isSpo2Crit || (isStreaming && vitals.fallDetected);

  const connectedDevicesCount = devices.filter((d) => d.connected).length;

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    const newContact: EmergencyContact = {
      id: `contact_${Date.now()}`,
      name: newContactName,
      relation: newContactRelation || 'Family Member',
      phone: newContactPhone,
      email: `${newContactName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      priorityOrder: emergencyContacts.length + 1,
      notifyOnWarning: true,
      notifyOnCritical: true,
      receiveAIVoiceCall: true,
    };
    onUpdateContacts([...emergencyContacts, newContact]);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  return (
    <div className="space-y-6">
      {/* Location-Aware Dispatch Bar (Q6: All options, adult child decides by location) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{patientName}'s Active Location:</span>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md">
                {patientLocation.label}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                · {patientLocation.address}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              EMS Route: <strong className="text-slate-800 uppercase">{patientLocation.dispatchPreference.replace(/_/g, ' ')}</strong> · PSAP: {patientLocation.nearestPSAP}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Switch Location &amp; Dispatch Mode
          </button>
          <button
            onClick={onOpenAIAssistant}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Ask Kinote AI Bot</span>
          </button>
        </div>
      </div>

      {/* Wearable Device Status & Pairing Prompt Banner */}
      {devices.length === 0 ? (
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-teal-700/50 flex flex-col md:flex-row md:items-center justify-between gap-5 animate-in fade-in">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
              <Watch className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-full border border-teal-400/30">
                  Ready to Sync
                </span>
                <span className="text-xs text-slate-300">No Wearable Connected</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                Sync a Wearable Device to Monitor Live Biometrics
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                No active watch connected. All telemetry cards remain in standby (<code className="font-mono bg-white/10 px-1 py-0.5 rounded">--</code>) until a device is paired. If your watch or sensor is unlisted, select <strong>Other / Custom Device</strong> or <strong>Scan Bluetooth</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {onLoadDemoData && (
              <button
                type="button"
                onClick={onLoadDemoData}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                title="Explore KINOTE features with a sample demo profile"
              >
                Sample Demo Data
              </button>
            )}
            {onOpenPairModal && (
              <button
                type="button"
                onClick={onOpenPairModal}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Radio className="w-4 h-4" />
                <span>Pair Wearable Device</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-2xl space-y-3 text-xs text-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-white text-xs block">
                  {devices.length} Wearable Device{devices.length > 1 ? 's' : ''} Connected to {patientName}
                </span>
                <span className="text-[11px] text-emerald-300/80 block mt-0.5">
                  Don't own an Apple Watch or seeing demo numbers? Click <strong>Unpair</strong> below to reset to standby (<code className="font-mono bg-emerald-900/60 px-1 py-0.2 rounded text-emerald-200">-- BPM</code>) with zero fake data.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {devices.length > 1 && onRemoveAllDevices && (
                <button
                  type="button"
                  onClick={onRemoveAllDevices}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Unpair all devices for this patient"
                >
                  Unpair All Devices
                </button>
              )}
              {onOpenPairModal && (
                <button
                  type="button"
                  onClick={onOpenPairModal}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                >
                  + Switch / Add Device
                </button>
              )}
            </div>
          </div>

          {/* List of each paired device with individual Unpair action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-500/20">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate" title={dev.name}>{dev.name}</p>
                  <p className="text-[10px] text-emerald-300/70 truncate">
                    {dev.brand} · Battery {dev.batteryPercent}% · Synced {dev.lastSync}
                  </p>
                </div>
                {onRemoveDevice && (
                  <button
                    type="button"
                    onClick={() => onRemoveDevice(dev.id)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/25 hover:bg-rose-500/40 text-rose-200 border border-rose-500/40 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                    title={`Unpair ${dev.name}`}
                  >
                    Unpair
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Scenario Toolbar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Biometric Telemetry Simulation Engine</span>
                <span className="text-[11px] font-normal text-slate-400">
                  (Test push alerts, triage cascade &amp; AI voice dispatch)
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Simulate abnormal wearable packets from {devices[0]?.name || `${patientName}'s paired device`}:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSimulateVitals('normal')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
            >
              ✓ Normal Baseline
            </button>
            <button
              onClick={() => onSimulateVitals('tachycardia')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 transition-colors"
            >
              ⚡ Tachycardia (142 BPM)
            </button>
            <button
              onClick={() => onSimulateVitals('hypoxia')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 transition-colors"
            >
              🚨 Low Oxygen (86% SpO2)
            </button>
            <button
              onClick={() => onSimulateVitals('hypertension')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/60 transition-colors"
            >
              ⚠️ BP Spike (188/118)
            </button>
            <button
              onClick={() => onSimulateVitals('fall')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 transition-colors"
            >
              💥 Fall Detected
            </button>
          </div>
        </div>
      </div>

      {/* Critical Status Alert Bar if triggered */}
      {isAnyCritical && (
        <div className="bg-red-600 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-white shrink-0" />
            <div>
              <h4 className="text-base font-black">CRITICAL VITALS ESCALATION TRIGGERED</h4>
              <p className="text-xs text-red-100 mt-0.5">
                {patientName}'s vitals breached critical boundaries. KINOTE AI Voice call dispatching with cascading triage.
              </p>
            </div>
          </div>
          <button
            onClick={() => onInitiateAIVoiceCall('Critical vitals threshold exceeded')}
            className="px-5 py-2.5 rounded-xl bg-white text-red-700 hover:bg-slate-100 text-xs font-black uppercase tracking-wider shadow-md transition-colors"
          >
            Launch Emergency Voice Bridge
          </button>
        </div>
      )}

      {/* Primary Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heart Rate */}
        <div className={`p-5 rounded-2xl border transition-all ${
          !isStreaming
            ? 'bg-slate-50/70 border-slate-200'
            : isHrCrit
            ? 'bg-rose-50 border-rose-300'
            : isHrWarn
            ? 'bg-amber-50 border-amber-300'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Heart Rate</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !isStreaming
                ? 'bg-slate-200 text-slate-500'
                : isHrCrit ? 'bg-rose-200 text-rose-700' : 'bg-rose-50 text-rose-600'
            }`}>
              <Heart className={`w-4 h-4 ${isStreaming ? 'fill-rose-500 animate-pulse' : 'text-slate-400'}`} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${
              !isStreaming
                ? 'text-slate-400'
                : isHrCrit ? 'text-rose-700' : isHrWarn ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {isStreaming ? vitals.heartRate : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">BPM</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-500">
              {isStreaming ? `Threshold: < ${thresholds.heartRate.maxWarn} BPM` : 'Awaiting sensor'}
            </span>
            <span className={`font-semibold text-[10px] ${
              !isStreaming
                ? 'text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded'
                : isHrCrit ? 'text-rose-700' : isHrWarn ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {!isStreaming ? 'STANDBY' : isHrCrit ? 'CRITICAL' : isHrWarn ? 'WARNING' : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className={`p-5 rounded-2xl border transition-all ${
          !isStreaming
            ? 'bg-slate-50/70 border-slate-200'
            : isBpCrit
            ? 'bg-rose-50 border-rose-300'
            : isBpWarn
            ? 'bg-amber-50 border-amber-300'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Pressure</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !isStreaming
                ? 'bg-slate-200 text-slate-500'
                : isBpCrit ? 'bg-blue-200 text-blue-700' : 'bg-blue-50 text-blue-600'
            }`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`text-3xl font-extrabold tracking-tight tabular-nums ${
              !isStreaming
                ? 'text-slate-400'
                : isBpCrit ? 'text-rose-700' : isBpWarn ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {isStreaming ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` : '-- / --'}
            </span>
            <span className="text-xs font-semibold text-slate-500">mmHg</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-500">
              {isStreaming ? `Limit: < ${thresholds.bloodPressureSystolic.maxWarn}/88` : 'Awaiting cuff'}
            </span>
            <span className={`font-semibold text-[10px] ${
              !isStreaming
                ? 'text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded'
                : isBpCrit ? 'text-rose-700' : isBpWarn ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {!isStreaming ? 'STANDBY' : isBpCrit ? 'CRITICAL' : isBpWarn ? 'ELEVATED' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* SpO2 Oxygen */}
        <div className={`p-5 rounded-2xl border transition-all ${
          !isStreaming
            ? 'bg-slate-50/70 border-slate-200'
            : isSpo2Crit
            ? 'bg-rose-50 border-rose-300'
            : isSpo2Warn
            ? 'bg-amber-50 border-amber-300'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Blood Oxygen (SpO2)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !isStreaming
                ? 'bg-slate-200 text-slate-500'
                : isSpo2Crit ? 'bg-teal-200 text-teal-700' : 'bg-teal-50 text-teal-600'
            }`}>
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`text-4xl font-extrabold tracking-tight tabular-nums ${
              !isStreaming
                ? 'text-slate-400'
                : isSpo2Crit ? 'text-rose-700' : isSpo2Warn ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {isStreaming ? `${vitals.spo2}%` : '-- %'}
            </span>
            <span className="text-xs font-semibold text-slate-500">Sat</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-500">
              {isStreaming ? `Min safe: ${thresholds.spo2.minWarn}%` : 'Awaiting sensor'}
            </span>
            <span className={`font-semibold text-[10px] ${
              !isStreaming
                ? 'text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded'
                : isSpo2Crit ? 'text-rose-700' : isSpo2Warn ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {!isStreaming ? 'STANDBY' : isSpo2Crit ? 'HYPOXIA' : isSpo2Warn ? 'LOW' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Fall Detection & Temp */}
        <div className={`p-5 rounded-2xl border transition-all ${
          !isStreaming
            ? 'bg-slate-50/70 border-slate-200'
            : vitals.fallDetected
            ? 'bg-rose-100 border-rose-400'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fall &amp; Motion Status</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !isStreaming
                ? 'bg-slate-200 text-slate-500'
                : vitals.fallDetected ? 'bg-rose-600 text-white' : 'bg-purple-50 text-purple-600'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-xl sm:text-2xl font-black ${
              !isStreaming ? 'text-slate-400' : vitals.fallDetected ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {!isStreaming ? 'No Sensor Paired' : vitals.fallDetected ? 'FALL DETECTED!' : 'Stable / Motion Safe'}
            </span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-slate-400" />
              {isStreaming ? `${vitals.temperature}°F` : '-- °F'}
            </span>
            <span className="flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-slate-400" />
              {isStreaming ? `Glucose ${vitals.glucose} mg/dL` : 'CGM --'}
            </span>
          </div>
        </div>
      </div>

      {/* Paired Wearable Telemetry Streams */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900">
                Paired Wearable Telemetry Streams
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live biometric signals streamed exclusively from {patientName}'s verified paired hardware.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPairModal && (
              <button
                type="button"
                onClick={onOpenPairModal}
                className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pair Another Device</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty State when no devices are paired */}
        {devices.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No Wearable Devices Currently Paired</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                You have not paired any smartwatch, ring, or medical cuff. KINOTE will only stream telemetry from hardware you have explicitly connected.
              </p>
            </div>
            {onOpenPairModal && (
              <button
                type="button"
                onClick={onOpenPairModal}
                className="mt-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Pair Your Wearable Device Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => {
              const isSmartwatch = device.category === 'smartwatch';
              const isRing = device.category === 'ring';
              const isBp = device.category === 'blood_pressure_cuff';
              const isCgm = device.category === 'cgm_patch';

              return (
                <div
                  key={device.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400/60 transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          {isSmartwatch ? <Watch className="w-4 h-4" /> : isBp ? <Activity className="w-4 h-4" /> : isRing ? <CircleDot className="w-4 h-4" /> : isCgm ? <Droplet className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {device.name}
                          </span>
                          <span className="text-[10px] text-teal-700 block truncate">
                            {device.brand}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        device.connected ? 'text-emerald-700 bg-emerald-100/70' : 'text-slate-500 bg-slate-100'
                      }`}>
                        {device.connected ? 'Live' : 'Offline'}
                      </span>
                    </div>

                    {/* Primary metric display */}
                    <div className="mt-3 flex items-baseline gap-1.5">
                      {isSmartwatch && (
                        <>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {isStreaming ? vitals.heartRate : '--'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">BPM Pulse</span>
                        </>
                      )}
                      {isBp && (
                        <>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {isStreaming ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` : '-- / --'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">mmHg</span>
                        </>
                      )}
                      {isRing && (
                        <>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {isStreaming ? (vitals.smartRing?.nocturnalHrv || 44) : '--'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">ms (HRV)</span>
                        </>
                      )}
                      {isCgm && (
                        <>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {vitals.glucose || 104}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">mg/dL</span>
                        </>
                      )}
                      {!isSmartwatch && !isBp && !isRing && !isCgm && (
                        <>
                          <span className="text-2xl font-black text-slate-900 tabular-nums">
                            {isStreaming ? vitals.heartRate : '--'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">Signal Live</span>
                        </>
                      )}
                    </div>

                    {/* Metrics info breakdown */}
                    <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Battery Level:</span>
                        <span className="font-semibold text-slate-900">{device.batteryPercent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Sync:</span>
                        <span className="font-medium text-slate-700">{device.lastSync || 'Just now'}</span>
                      </div>
                      {device.macAddress && (
                        <div className="flex justify-between">
                          <span>Address:</span>
                          <span className="font-mono text-[10px] text-slate-400">{device.macAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {device.category.replace(/_/g, ' ')}
                    </span>
                    {onRemoveDevice && (
                      <button
                        type="button"
                        onClick={() => onRemoveDevice(device.id)}
                        className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline text-[11px]"
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vital Trends: 7-Day Historical Analytics (Heart Rate & SpO2) */}
      <VitalTrends 
        vitals={vitals} 
        thresholds={thresholds} 
        patientName={patientName} 
        onOpenWeeklyOverview={onOpenAIAssistant}
      />

      {/* Medication Management & Daily Reminders Adherence */}
      <MedicationManagement
        medications={medications}
        doseLogs={doseLogs}
        onLogDose={onLogDose}
        onAddMedication={onAddMedication}
        onUpdateMedicationReminders={onUpdateMedicationReminders}
        onAskAI={onOpenAIAssistant}
        patientName={patientName}
      />

      {/* 30-Day Medication Adherence Rates & Trends Visualizer (Recharts) */}
      <MedicationAdherenceCharts
        medications={medications}
        doseLogs={doseLogs}
        patientName={patientName}
        onAskAI={onOpenAIAssistant}
      />

      {/* Main Caregiver Controls: AI Voice Dispatch & Emergency Contact Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Voice Calling & Triage Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Emergency Voice Dispatch</h3>
                <p className="text-xs text-slate-500">Q1 Cascading Triage: Opt A ➔ Opt C ➔ Opt B</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Active</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            When vitals breach thresholds, the KINOTE AI voice agent calls {patientName} first (Opt A). If no response or distressed, it escalates to you (Opt C), then bridges to EMS (Opt B).
          </p>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <span>Target Patient:</span>
              <span className="font-semibold text-slate-900">{patientName} (+1 555-321-7788)</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Grace Period:</span>
              <span className="font-semibold text-slate-900">{thresholds.gracePeriodSeconds} seconds</span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span>Dispatch Destination:</span>
              <span className="font-semibold text-teal-800">{patientLocation.nearestPSAP}</span>
            </div>
          </div>

          <button
            onClick={() => onInitiateAIVoiceCall('Manual caregiver wellness check-in')}
            className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Initiate AI Emergency Voice Call Now</span>
          </button>

          {/* Recent Call Records */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent AI Call Logs</span>
              <span className="text-xs text-slate-400">{callLogs.length} logged</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedCallLog(log)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer text-xs space-y-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 line-clamp-1">{log.triggerReason}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Duration: {log.durationSeconds}s</span>
                    <span className={`font-semibold ${log.callStatus === 'completed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.callStatus === 'completed' ? 'Resolved Safe' : 'Escalated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Emergency Contact & Escalation Ladder */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Emergency Notification &amp; Escalation Tree</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Omnichannel cascading notification (Loud Push ➔ SMS ➔ AI Voice Call ➔ EMS).
              </p>
            </div>

            <button
              onClick={() => setShowAddContact(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Emergency Contact</span>
            </button>
          </div>

          {/* Contact Cards List */}
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{contact.name}</span>
                      <span className="text-xs text-slate-500">({contact.relation})</span>
                    </div>
                    <p className="text-xs font-mono text-slate-600 mt-0.5">{contact.phone} · {contact.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    contact.priorityOrder === 1 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Priority #{contact.priorityOrder}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {contact.receiveAIVoiceCall ? 'AI Call + Push + SMS' : 'Push Notification'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Device Sync & Network Health Status Bar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                <strong className="text-slate-900">{connectedDevicesCount} of {devices.length}</strong> Wearables streaming (HealthKit + Health Connect + BLE).
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Universal Gateway Stream: 1.0 Hz Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Switcher Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Select Senior Location &amp; EMS Route (Q6)</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500">
                As configured in Architecture Decision Q6, you can dynamically route emergency dispatches based on where {patientName} is currently staying:
              </p>

              <div className="space-y-2.5">
                {patientLocationsList.map((loc) => {
                  const isSelected = loc.label === patientLocation.label;
                  return (
                    <div
                      key={loc.label}
                      onClick={() => {
                        onSelectPatientLocation(loc);
                        setShowLocationModal(false);
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{loc.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>
                          <div className="mt-2 text-[11px] font-mono text-teal-800">
                            Protocol: <strong className="uppercase">{loc.dispatchPreference.replace(/_/g, ' ')}</strong> · PSAP: {loc.nearestPSAP}
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-teal-700 shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Emergency Contact</h3>
              <button
                onClick={() => setShowAddContact(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddContactSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Neighbor / Cardiologist / Sibling"
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Log Transcript Detail Modal */}
      {selectedCallLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">KINOTE AI Voice Call Detailed Record</h3>
              </div>
              <button
                onClick={() => setSelectedCallLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Recipient:</span>
                  <span className="font-semibold text-slate-900">{selectedCallLog.recipientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Call Timestamp:</span>
                  <span className="font-semibold text-slate-900">{selectedCallLog.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Duration:</span>
                  <span className="font-semibold text-slate-900">{selectedCallLog.durationSeconds} seconds</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Sentiment &amp; Status:</span>
                  <span className="font-semibold text-emerald-700 uppercase">{selectedCallLog.patientSentiment} ({selectedCallLog.callStatus})</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Complete Clinical Audio Transcription
                </span>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedCallLog.transcription}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCallLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

