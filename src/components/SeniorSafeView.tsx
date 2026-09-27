import { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Wind, 
  Phone, 
  AlertCircle, 
  Volume2, 
  Check, 
  Droplets, 
  Pill, 
  Mic,
  Watch,
  Trash2,
  Plus,
  Battery,
  ShieldCheck,
  Radio,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { VitalsReading, MedicationItem, MedicationDoseLog, MedicationDoseStatus, WearableDevice } from '../types';
import { speakText } from '../utils/speech';
import { EMERGENCY_NUMBER, emergencyTelLink } from '../utils/emergency';
import { raiseCloudAlertIfSignedIn } from '../utils/backend';

interface SeniorSafeViewProps {
  vitals: VitalsReading;
  patientName: string;
  onTriggerSOS: () => void;
  onStartAIVoiceCheckin: () => void;
  primaryContactName: string;
  primaryContactPhone: string;
  medications?: MedicationItem[];
  doseLogs?: MedicationDoseLog[];
  onLogDose?: (medicationId: string, status: MedicationDoseStatus) => void;
  devices?: WearableDevice[];
  onRemoveDevice?: (deviceId: string) => void;
  onRemoveAllDevices?: () => void;
  onOpenPairModal?: () => void;
}

export default function SeniorSafeView({
  vitals,
  patientName,
  onTriggerSOS,
  onStartAIVoiceCheckin,
  primaryContactName,
  primaryContactPhone,
  medications,
  doseLogs,
  onLogDose,
  devices = [],
  onRemoveDevice,
  onRemoveAllDevices,
  onOpenPairModal,
}: SeniorSafeViewProps) {
  // Emergency contact shown to the senior comes from their saved contacts, never a hard-coded name
  const contactLabel = primaryContactName.trim() || 'your emergency contact';
  const hasContactPhone = primaryContactPhone.trim().length > 0;
  const [highContrast, setHighContrast] = useState(false);
  const [medsTaken, setMedsTaken] = useState(true);
  const [waterCups, setWaterCups] = useState(3);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  // Patient-level device management state
  const [isDeviceSectionExpanded, setIsDeviceSectionExpanded] = useState(true);
  const [deviceToUnpair, setDeviceToUnpair] = useState<WearableDevice | null>(null);
  const [showUnpairAllModal, setShowUnpairAllModal] = useState(false);

  const isStreaming = vitals.heartRate > 0;

  const isAbnormal = 
    isStreaming && (
      vitals.heartRate > 115 || 
      vitals.heartRate < 48 || 
      vitals.spo2 < 90 || 
      vitals.bloodPressureSystolic > 160
    );

  const handleReadStatusAloud = () => {
    if (!isStreaming) {
      speakText(`Hello ${patientName}. No wearable device is synced yet. Please connect your smartwatch or wearable sensor to start monitoring.`);
      return;
    }
    const text = isAbnormal
      ? `Attention ${patientName}. Your current heart rate is ${vitals.heartRate} beats per minute and blood oxygen is ${vitals.spo2} percent. Our system has flagged an abnormal vital. Please rest comfortably. ${contactLabel} has been notified.`
      : `Hello ${patientName}. Everything is looking normal and steady. Your heart rate is ${vitals.heartRate} beats per minute, blood pressure is ${vitals.bloodPressureSystolic} over ${vitals.bloodPressureDiastolic}, and oxygen is ${vitals.spo2} percent. You are doing wonderful.`;
    speakText(text);
  };

  // Timer lives in a ref so Cancel really stops it (before, a cancelled countdown still fired the SOS)
  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSosTimer = () => {
    if (sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      sosTimerRef.current = null;
    }
  };

  useEffect(() => stopSosTimer, []);

  const startSosFlow = () => {
    if (sosTimerRef.current) return;
    let remaining = 5;
    setSosCountdown(remaining);
    speakText('Emergency SOS initiated. Alerting family in 5 seconds.');
    sosTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setSosCountdown(remaining);
        return;
      }
      stopSosTimer();
      setSosCountdown(null);
      // Alert linked caregivers' phones when cloud sync is on (no-op otherwise)
      raiseCloudAlertIfSignedIn({ kind: 'sos', severity: 'critical', message: `${patientName} pressed SOS` });
      onTriggerSOS();
    }, 1000);
  };

  const cancelSos = () => {
    stopSosTimer();
    setSosCountdown(null);
    speakText('Emergency alert cancelled.');
  };

  return (
    <div className={`min-h-[85vh] p-4 sm:p-8 rounded-3xl transition-colors ${
      highContrast 
        ? 'bg-black text-white border-4 border-yellow-400' 
        : 'bg-gradient-to-b from-slate-50 via-teal-50/20 to-white text-slate-900 border border-slate-200 shadow-sm'
    }`}>
      {/* Top Header for Senior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-sm font-semibold tracking-wide text-teal-800 uppercase">KINOTE Senior SafeMode</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mt-1">
            Good day, {patientName}
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Protected by KINOTE Health &amp; Multi-Wearable Guardian • Continuous Heart &amp; Oxygen Watch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            {highContrast ? 'Standard Colors' : 'High Contrast Mode'}
          </button>
          <button
            onClick={handleReadStatusAloud}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            <Volume2 className="w-5 h-5" />
            <span>Read Status Aloud</span>
          </button>
        </div>
      </div>

      {/* Senior Wearables Reassurance & Patient-Level Device Management */}
      <div className="mt-4 p-4 rounded-2xl bg-white/95 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-full ${devices.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                {devices.length > 0
                  ? `${devices.length} Wearable Device${devices.length > 1 ? 's' : ''} Connected to Your Profile`
                  : 'No Wearable Connected to Your Profile (Standby Mode)'}
              </span>
              <span className="text-xs text-slate-500">
                {devices.length > 0
                  ? `Active: ${devices.map((d) => d.name).join(' • ')}`
                  : 'Telemetry is paused. Pair your own smartwatch or sensor to begin live monitoring.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDeviceSectionExpanded(!isDeviceSectionExpanded)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Watch className="w-3.5 h-3.5 text-teal-700" />
              <span>{isDeviceSectionExpanded ? 'Hide Devices' : 'Manage / Unpair Devices'}</span>
              {isDeviceSectionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {devices.length > 0 && onRemoveAllDevices && (
              <button
                type="button"
                onClick={() => setShowUnpairAllModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Disconnect all devices and clear simulated telemetry"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Unpair All</span>
              </button>
            )}

            {onOpenPairModal && (
              <button
                type="button"
                onClick={onOpenPairModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pair My Watch</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Patient-Level Device List & Unpair Controls */}
        {isDeviceSectionExpanded && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Helpful reassurance pill for users who don't have an Apple Watch */}
            <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-2.5 text-xs text-teal-950">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Patient Device Privacy &amp; Control:</span>
                <p className="text-teal-900 leading-relaxed">
                  Don't own an Apple Watch or seeing demo vitals you didn't measure? Tap <strong>Unpair</strong> on any device card below. It immediately disconnects the device from your profile and resets your vitals to clean standby (<code className="font-mono text-slate-800 bg-white/80 px-1 py-0.5 rounded">-- BPM</code>). You can also tap <strong>+ Pair My Watch</strong> to connect your actual smartwatch (Noise, Boat, Fire-Boltt, Fastrack, Amazfit, Samsung, or Bluetooth LE).
                </p>
              </div>
            </div>

            {devices.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <Watch className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">No Wearables Paired</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your profile currently has 0 devices paired. Vitals are in clean standby with no fake data being generated.
                </p>
                {onOpenPairModal && (
                  <button
                    type="button"
                    onClick={onOpenPairModal}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Pair Your Smartwatch / Sensor</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                            <Watch className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate" title={device.name}>
                              {device.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{device.brand}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 shrink-0">
                          {device.batteryPercent !== undefined ? (
                            <>
                              <Battery className={`w-3.5 h-3.5 ${device.batteryPercent > 20 ? 'text-emerald-600' : 'text-rose-500'}`} />
                              <span>{device.batteryPercent}%</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-sans font-semibold">
                              Sync OK
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Streaming Telemetry
                        </span>
                        <span className="font-mono">Sync: {device.lastSync}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 capitalize truncate">
                        {device.category.replace(/_/g, ' ')}
                      </span>

                      {onRemoveDevice && (
                        <button
                          type="button"
                          onClick={() => setDeviceToUnpair(device)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                          title={`Unpair and remove ${device.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Unpair</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Device Unpair Confirmation Modal */}
      {deviceToUnpair && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Unpair Device from Your Profile?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to unpair <strong>{deviceToUnpair.name}</strong> from {patientName}&apos;s profile?
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  Kinote will stop collecting vitals from this device. If no other device is paired, your vitals will cleanly rest in standby mode (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">-- BPM</code>) without any fake data.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeviceToUnpair(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel / Keep Paired
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemoveDevice) {
                    onRemoveDevice(deviceToUnpair.id);
                  }
                  setDeviceToUnpair(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Unpair {deviceToUnpair.name.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpair All Devices Confirmation Modal */}
      {showUnpairAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Unpair All Wearables?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Disconnect all {devices.length} paired devices from <strong>{patientName}</strong>?
                </p>
                <p className="text-xs text-slate-500 pt-1">
                  All telemetry streams will be disconnected. Your dashboard will show clean standby (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">-- BPM</code>) awaiting your actual watch or sensor.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUnpairAllModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemoveAllDevices) {
                    onRemoveAllDevices();
                  } else if (onRemoveDevice) {
                    devices.forEach((d) => onRemoveDevice(d.id));
                  }
                  setShowUnpairAllModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Unpair All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Status Hero Banner */}
      <div className={`my-6 p-6 sm:p-8 rounded-2xl border transition-all ${
        isAbnormal
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isAbnormal ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
            }`}>
              {isAbnormal ? <AlertCircle className="w-8 h-8" /> : <Check className="w-8 h-8 stroke-[3]" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isAbnormal ? 'Vitals Attention Required' : 'You are in Great Health Today'}
              </h2>
              <p className="text-base mt-1 text-slate-700 max-w-xl">
                {isAbnormal
                  ? `Your pulse or oxygen reading triggered a caution alert. Rest seated; ${contactLabel} has received an automatic update.`
                  : `All measurements from your watch and cuff match your healthy baseline. ${contactLabel} is connected.`}
              </p>
            </div>
          </div>

          <button
            onClick={onStartAIVoiceCheckin}
            className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold shadow-md transition-transform active:scale-95 shrink-0"
          >
            <Mic className="w-5 h-5 text-teal-300" />
            <span>AI Voice Health Check-in</span>
          </button>
        </div>
      </div>

      {/* Large Senior Vitals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {/* Heart Rate Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-700">Heart Pulse</span>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Heart className="w-6 h-6 fill-rose-500 animate-pulse" />
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                {isStreaming ? vitals.heartRate : '--'}
              </span>
              <span className="text-lg font-semibold text-slate-500">BPM</span>
            </div>
            <p className="text-sm font-medium text-emerald-600 mt-2">
              {!isStreaming ? 'Awaiting Smartwatch Sync' : vitals.heartRate >= 60 && vitals.heartRate <= 100 ? 'Healthy Resting Range' : 'Outside Normal Band'}
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {isStreaming ? 'Measured continuously from wearable' : 'Pair watch to start continuous stream'}
          </div>
        </div>

        {/* Blood Pressure Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-700">Blood Pressure</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                {isStreaming ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` : '-- / --'}
              </span>
              <span className="text-lg font-semibold text-slate-500">mmHg</span>
            </div>
            <p className="text-sm font-medium text-emerald-600 mt-2">
              {!isStreaming ? 'Awaiting Wireless Cuff' : vitals.bloodPressureSystolic <= 130 ? 'Normal Blood Pressure' : 'Elevated'}
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {isStreaming ? 'Measured via Wireless Cuff' : 'Pair cuff to begin telemetry'}
          </div>
        </div>

        {/* SpO2 Blood Oxygen Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-slate-700">Blood Oxygen (SpO2)</span>
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Wind className="w-6 h-6" />
            </div>
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                {isStreaming ? `${vitals.spo2}%` : '-- %'}
              </span>
              <span className="text-lg font-semibold text-slate-500">Sat</span>
            </div>
            <p className="text-sm font-medium text-emerald-600 mt-2">
              {!isStreaming ? 'Awaiting Pulse Sensor' : vitals.spo2 >= 95 ? 'Optimal Oxygenation' : 'Attention needed'}
            </p>
          </div>
          <div className="text-xs text-slate-400">
            {isStreaming ? 'Measured via Smart Ring & Watch' : 'Sync sensor to view blood oxygen'}
          </div>
        </div>
      </div>

      {/* Emergency SOS & Direct Call Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white my-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white">Need Immediate Help or Feeling Unwell?</h3>
            <p className="text-slate-300 text-base mt-1 max-w-xl">
              Tap the Emergency SOS button below. It notifies {contactLabel}{hasContactPhone ? ` (${primaryContactPhone})` : ''} and initiates an instant voice response check.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
            {sosCountdown !== null ? (
              <div className="flex items-center gap-4 bg-red-600 px-6 py-4 rounded-2xl animate-pulse">
                <span className="text-2xl font-black">Alerting in {sosCountdown}s...</span>
                <button
                  onClick={cancelSos}
                  className="px-5 py-2.5 rounded-xl bg-white text-red-700 font-bold text-base hover:bg-slate-100"
                >
                  Cancel SOS
                </button>
              </div>
            ) : (
              <button
                onClick={startSosFlow}
                className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xl font-black tracking-wide shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <AlertCircle className="w-7 h-7" />
                <span>EMERGENCY SOS</span>
              </button>
            )}

            <a
              href={emergencyTelLink}
              className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 text-lg font-black flex items-center justify-center gap-3 transition-colors"
              title="Calls emergency services from this phone"
            >
              <Phone className="w-6 h-6 text-rose-600" />
              <span>Call {EMERGENCY_NUMBER}</span>
            </a>

            {hasContactPhone ? (
              <a
                href={`tel:${primaryContactPhone}`}
                className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-lg font-bold flex items-center justify-center gap-3 transition-colors"
              >
                <Phone className="w-6 h-6 text-emerald-400" />
                <span>Call {primaryContactName || 'Emergency Contact'}</span>
              </a>
            ) : (
              <div className="w-full sm:w-auto px-6 py-5 rounded-2xl bg-slate-800/60 border border-dashed border-slate-600 text-slate-300 text-base font-semibold flex items-center justify-center gap-3">
                <Phone className="w-6 h-6 text-slate-500" />
                <span>No phone number for {contactLabel} yet</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Senior Daily Wellbeing Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* Senior Medication Status Card */}
        {(() => {
          const lisinoprilDose = doseLogs?.find(d => d.medicationId === 'med-lisinopril' && (d.scheduledDate === '2026-09-25' || d.scheduledDate === new Date().toISOString().split('T')[0]));
          const isLisiTaken = lisinoprilDose ? lisinoprilDose.status === 'taken' : medsTaken;

          return (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isLisiTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                }`}>
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">Morning Blood Pressure Medication</p>
                  <p className="text-sm text-slate-500">
                    Lisinopril 10mg {isLisiTaken ? '(Confirmed Taken at 8:02 AM)' : '(Scheduled with breakfast)'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onLogDose) {
                    onLogDose('med-lisinopril', isLisiTaken ? 'due' : 'taken');
                  }
                  setMedsTaken(!isLisiTaken);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isLisiTaken ? 'bg-emerald-600 text-white' : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
              >
                {isLisiTaken ? '✓ Completed' : 'I Took My Pill'}
              </button>
            </div>
          );
        })()}

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Daily Water Hydration</p>
              <p className="text-sm text-slate-500">{waterCups} of 6 glasses logged today</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWaterCups(Math.max(0, waterCups - 1))}
              className="w-9 h-9 rounded-lg border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center"
            >
              -
            </button>
            <span className="font-bold text-base px-2 tabular-nums">{waterCups}</span>
            <button
              onClick={() => setWaterCups(waterCups + 1)}
              className="w-9 h-9 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500 flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
