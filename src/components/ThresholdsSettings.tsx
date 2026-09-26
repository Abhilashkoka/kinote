import { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Wind, 
  ShieldAlert, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  Sliders, 
  PhoneCall, 
  Clock, 
  Cpu, 
  Sparkles,
  Bluetooth,
  Droplet,
  Thermometer,
  Layers,
  User
} from 'lucide-react';
import { MetricThresholds } from '../types';

interface ThresholdsSettingsProps {
  thresholds: MetricThresholds;
  onSave: (newThresholds: MetricThresholds) => void;
  onReset: () => void;
  patientName?: string;
  patientRelationship?: string;
  activePatientId?: string;
  patientsList?: { id: string; name: string; relationship: string }[];
  onSelectPatient?: (patientId: string) => void;
}

export default function ThresholdsSettings({
  thresholds: initialThresholds,
  onSave,
  onReset,
  patientName = 'Eleanor Miller',
  patientRelationship = 'Mother',
  activePatientId,
  patientsList,
  onSelectPatient,
}: ThresholdsSettingsProps) {
  const [thresholds, setThresholds] = useState<MetricThresholds>(initialThresholds);
  const [savedNotification, setSavedNotification] = useState(false);

  // Synchronize local editable state whenever the initialThresholds changes (e.g. switching users/seniors)
  useEffect(() => {
    setThresholds(initialThresholds);
  }, [initialThresholds]);

  const applyTemplate = (type: 'standard' | 'afib' | 'copd' | 'hypertension' | 'diabetes_cardio') => {
    if (type === 'standard') {
      setThresholds({
        ...thresholds,
        activeClinicalTemplate: 'standard',
        heartRate: { minWarn: 50, maxWarn: 100, minCritical: 42, maxCritical: 130, unit: 'BPM' },
        bloodPressureSystolic: { maxWarn: 135, maxCritical: 175, unit: 'mmHg' },
        bloodPressureDiastolic: { maxWarn: 88, maxCritical: 105, unit: 'mmHg' },
        bloodPressureMap: { minWarn: 70, maxWarn: 105, unit: 'mmHg' },
        spo2: { minWarn: 93, minCritical: 88, unit: '%' },
        respiratoryRate: { minWarn: 12, maxWarn: 22, minCritical: 8, maxCritical: 28, unit: 'breaths/min' },
        glucose: { urgentLow: 54, lowWarn: 70, highWarn: 180, severeHigh: 250, unit: 'mg/dL' },
        perfusionIndexMin: 1.0,
        thoracicBioimpedanceMinOhms: 32.0,
        coughRatePerHourMax: 6,
        skinTempDeviationMaxF: 2.2,
      });
    } else if (type === 'afib') {
      setThresholds({
        ...thresholds,
        activeClinicalTemplate: 'afib',
        heartRate: { minWarn: 55, maxWarn: 95, minCritical: 45, maxCritical: 120, unit: 'BPM' },
        bloodPressureSystolic: { maxWarn: 130, maxCritical: 165, unit: 'mmHg' },
        bloodPressureDiastolic: { maxWarn: 85, maxCritical: 100, unit: 'mmHg' },
        spo2: { minWarn: 94, minCritical: 90, unit: '%' },
      });
    } else if (type === 'copd') {
      setThresholds({
        ...thresholds,
        activeClinicalTemplate: 'copd',
        spo2: { minWarn: 91, minCritical: 85, unit: '%' },
        respiratoryRate: { minWarn: 10, maxWarn: 25, minCritical: 7, maxCritical: 32, unit: 'breaths/min' },
        heartRate: { minWarn: 55, maxWarn: 110, minCritical: 45, maxCritical: 135, unit: 'BPM' },
        coughRatePerHourMax: 4,
      });
    } else if (type === 'hypertension') {
      setThresholds({
        ...thresholds,
        activeClinicalTemplate: 'hypertension',
        bloodPressureSystolic: { maxWarn: 128, maxCritical: 160, unit: 'mmHg' },
        bloodPressureDiastolic: { maxWarn: 82, maxCritical: 98, unit: 'mmHg' },
        bloodPressureMap: { minWarn: 75, maxWarn: 102, unit: 'mmHg' },
      });
    } else if (type === 'diabetes_cardio') {
      setThresholds({
        ...thresholds,
        activeClinicalTemplate: 'diabetes_cardio',
        glucose: { urgentLow: 60, lowWarn: 75, highWarn: 160, severeHigh: 220, unit: 'mg/dL' },
        bloodPressureSystolic: { maxWarn: 130, maxCritical: 160, unit: 'mmHg' },
        bloodPressureDiastolic: { maxWarn: 80, maxCritical: 95, unit: 'mmHg' },
        perfusionIndexMin: 1.2,
      });
    }
  };

  const handleSave = () => {
    onSave(thresholds);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Presets (Q3: Option A Adaptive + Option C Templates) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-bold text-slate-900">Custom Vitals Thresholds &amp; Escalation Rules</h2>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <User className="w-3.5 h-3.5 text-teal-700" />
              <span>Active Threshold Target: <strong>{patientName}</strong> ({patientRelationship})</span>
            </span>
            {patientsList && onSelectPatient && patientsList.length > 1 && (
              <div className="flex items-center gap-1 text-xs bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium px-1">Switch:</span>
                {patientsList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectPatient(p.id)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      p.id === activePatientId
                        ? 'bg-white text-teal-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p.name.split(' ')[0]} ({p.relationship})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Presets (Q3):</span>
          <button
            onClick={() => applyTemplate('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              thresholds.activeClinicalTemplate === 'standard' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            General Senior
          </button>
          <button
            onClick={() => applyTemplate('afib')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              thresholds.activeClinicalTemplate === 'afib' ? 'bg-rose-700 text-white font-semibold' : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
            }`}
          >
            Cardiac Arrhythmia (Afib)
          </button>
          <button
            onClick={() => applyTemplate('copd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              thresholds.activeClinicalTemplate === 'copd' ? 'bg-teal-700 text-white font-semibold' : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
            }`}
          >
            COPD / Respiratory
          </button>
          <button
            onClick={() => applyTemplate('hypertension')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              thresholds.activeClinicalTemplate === 'hypertension' ? 'bg-blue-700 text-white font-semibold' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            Hypertension Guard
          </button>
          <button
            onClick={() => applyTemplate('diabetes_cardio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              thresholds.activeClinicalTemplate === 'diabetes_cardio' ? 'bg-amber-700 text-white font-semibold' : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            Diabetes &amp; Cardio
          </button>
        </div>
      </div>

      {/* Hardware Sync Protocol & Adaptive Baseline Bar (Q2 & Q3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Q2 Setting: Sync Protocol with BLE backup */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Wearable Ingestion Protocol (Q2)</p>
              <p className="text-[11px] text-slate-500">
                {thresholds.wearableSyncProtocol === 'hybrid_bridge'
                  ? 'Option A Primary: Universal Gateway (Apple HealthKit + Health Connect + Garmin)'
                  : 'Option B Backup: Direct BLE Medical-Only Lock (Cuffs & Rings)'}
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setThresholds({
                ...thresholds,
                wearableSyncProtocol: thresholds.wearableSyncProtocol === 'hybrid_bridge' ? 'direct_ble_medical' : 'hybrid_bridge',
              })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              thresholds.wearableSyncProtocol === 'direct_ble_medical'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-teal-50 text-teal-800 border border-teal-200'
            }`}
          >
            {thresholds.wearableSyncProtocol === 'direct_ble_medical' ? 'BLE Backup Active' : 'Switch to BLE Mode'}
          </button>
        </div>

        {/* Q3 Setting: Adaptive Circadian Baseline */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Adaptive Circadian Baseline (Q3)</p>
              <p className="text-[11px] text-slate-500">
                Learns Eleanor’s day vs. sleep rest patterns to filter false tachycardia spikes.
              </p>
            </div>
          </div>

          <input
            type="checkbox"
            checked={thresholds.adaptiveCircadianBaseline}
            onChange={(e) => setThresholds({ ...thresholds, adaptiveCircadianBaseline: e.target.checked })}
            className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {savedNotification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Threshold rules successfully saved and cryptographic audit event logged to SHA-256 ledger.</span>
        </div>
      )}

      {/* Threshold Sliders & Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heart Rate Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Heart Rate Safety Window</h3>
                <span className="text-xs text-slate-500">Unit: Beats Per Minute (BPM)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Safe: {thresholds.heartRate.minWarn} – {thresholds.heartRate.maxWarn} BPM
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">High Heart Rate Warning (Tachycardia Caution)</span>
                <span className="font-bold text-slate-900 tabular-nums">{thresholds.heartRate.maxWarn} BPM</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                value={thresholds.heartRate.maxWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    heartRate: { ...thresholds.heartRate, maxWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">High Heart Rate Critical (Emergency Dispatch Trigger)</span>
                <span className="font-bold text-red-600 tabular-nums">{thresholds.heartRate.maxCritical} BPM</span>
              </div>
              <input
                type="range"
                min="110"
                max="170"
                value={thresholds.heartRate.maxCritical}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    heartRate: { ...thresholds.heartRate, maxCritical: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-700">Low Heart Rate Critical (Bradycardia Emergency)</span>
                <span className="font-bold text-blue-600 tabular-nums">{thresholds.heartRate.minCritical} BPM</span>
              </div>
              <input
                type="range"
                min="35"
                max="55"
                value={thresholds.heartRate.minCritical}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    heartRate: { ...thresholds.heartRate, minCritical: Number(e.target.value) },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Blood Pressure Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Blood Pressure Limits</h3>
                <span className="text-xs text-slate-500">Unit: Millimeters of Mercury (mmHg)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Max Safe: &lt; 135/88
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">Systolic Caution (Upper Pressure Warning)</span>
                <span className="font-bold text-slate-900 tabular-nums">{thresholds.bloodPressureSystolic.maxWarn} mmHg</span>
              </div>
              <input
                type="range"
                min="120"
                max="160"
                value={thresholds.bloodPressureSystolic.maxWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    bloodPressureSystolic: { ...thresholds.bloodPressureSystolic, maxWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">Systolic Critical (Hypertensive Crisis Alert)</span>
                <span className="font-bold text-red-600 tabular-nums">{thresholds.bloodPressureSystolic.maxCritical} mmHg</span>
              </div>
              <input
                type="range"
                min="150"
                max="210"
                value={thresholds.bloodPressureSystolic.maxCritical}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    bloodPressureSystolic: { ...thresholds.bloodPressureSystolic, maxCritical: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">Diastolic Critical (Lower Pressure Crisis)</span>
                <span className="font-bold text-red-600 tabular-nums">{thresholds.bloodPressureDiastolic.maxCritical} mmHg</span>
              </div>
              <input
                type="range"
                min="90"
                max="130"
                value={thresholds.bloodPressureDiastolic.maxCritical}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    bloodPressureDiastolic: { ...thresholds.bloodPressureDiastolic, maxCritical: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* SpO2 Blood Oxygen */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Blood Oxygen (SpO2)</h3>
                <span className="text-xs text-slate-500">Unit: Percentage Saturation (%)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Target: 95% – 100%
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">Mild Hypoxia Warning</span>
                <span className="font-bold text-slate-900 tabular-nums">&lt; {thresholds.spo2.minWarn}%</span>
              </div>
              <input
                type="range"
                min="88"
                max="95"
                value={thresholds.spo2.minWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    spo2: { ...thresholds.spo2, minWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">Severe Hypoxia Critical (Auto-Call Dispatch)</span>
                <span className="font-bold text-red-600 tabular-nums">&lt; {thresholds.spo2.minCritical}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="92"
                value={thresholds.spo2.minCritical}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    spo2: { ...thresholds.spo2, minCritical: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* AI Voice & Fall Dispatch Rules (Q1 Triage Sequence) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Voice Dispatch &amp; Triage (Q1)</h3>
                <span className="text-xs text-slate-500">Sequence: Senior (Opt A) ➔ Caregiver (Opt C) ➔ EMS (Opt B)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="pr-4">
                <p className="text-sm font-semibold text-slate-900">Autonomous AI Voice Escalation</p>
                <p className="text-xs text-slate-500">Auto-dial senior with {thresholds.gracePeriodSeconds}s grace before family and EMS relay</p>
              </div>
              <input
                type="checkbox"
                checked={thresholds.voiceCallAutoDispatch}
                onChange={(e) => setThresholds({ ...thresholds, voiceCallAutoDispatch: e.target.checked })}
                className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="pr-4">
                <p className="text-sm font-semibold text-slate-900">Multi-Sensor Fall Quorum (Q9)</p>
                <p className="text-xs text-slate-500">Watch accelerometer impact + gyroscope stillness + HR response</p>
              </div>
              <input
                type="checkbox"
                checked={thresholds.fallDetectionEnabled}
                onChange={(e) => setThresholds({ ...thresholds, fallDetectionEnabled: e.target.checked })}
                className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Grace Period Before Caregiver Escalation
                </span>
                <span className="font-bold text-slate-900 tabular-nums">{thresholds.gracePeriodSeconds} seconds</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={thresholds.gracePeriodSeconds}
                onChange={(e) => setThresholds({ ...thresholds, gracePeriodSeconds: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CGM Continuous Glucose Alert Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Continuous Glucose (CGM) Limits</h3>
                <span className="text-xs text-slate-500">Unit: Milligrams per Deciliter (mg/dL)</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-amber-50 font-mono text-amber-800 font-semibold">
              Dexcom / Libre Direct
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700 font-bold">Urgent Low Critical Alarm (Hypoglycemia Emergency)</span>
                <span className="font-bold text-red-600 tabular-nums">&le; {thresholds.glucose.urgentLow} mg/dL</span>
              </div>
              <input
                type="range"
                min="45"
                max="65"
                value={thresholds.glucose.urgentLow}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    glucose: { ...thresholds.glucose, urgentLow: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">Low Warning Threshold</span>
                <span className="font-bold text-amber-700 tabular-nums">&le; {thresholds.glucose.lowWarn} mg/dL</span>
              </div>
              <input
                type="range"
                min="60"
                max="85"
                value={thresholds.glucose.lowWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    glucose: { ...thresholds.glucose, lowWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">High Glucose Warning (Target Ceiling)</span>
                <span className="font-bold text-slate-900 tabular-nums">&ge; {thresholds.glucose.highWarn} mg/dL</span>
              </div>
              <input
                type="range"
                min="140"
                max="220"
                step="5"
                value={thresholds.glucose.highWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    glucose: { ...thresholds.glucose, highWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700 font-bold">Severe Hyperglycemia Critical</span>
                <span className="font-bold text-red-600 tabular-nums">&ge; {thresholds.glucose.severeHigh} mg/dL</span>
              </div>
              <input
                type="range"
                min="200"
                max="320"
                step="10"
                value={thresholds.glucose.severeHigh}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    glucose: { ...thresholds.glucose, severeHigh: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Mean Arterial Pressure (MAP) Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Mean Arterial Pressure (MAP)</h3>
                <span className="text-xs text-slate-500">Calculated: [(2 &times; DBP) + SBP] / 3</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Safe: 70–105 mmHg
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-700">Minimum Safe MAP (Organ Hypoperfusion Alert)</span>
                <span className="font-bold text-blue-700 tabular-nums">{thresholds.bloodPressureMap.minWarn} mmHg</span>
              </div>
              <input
                type="range"
                min="60"
                max="80"
                value={thresholds.bloodPressureMap.minWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    bloodPressureMap: { ...thresholds.bloodPressureMap, minWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">Maximum MAP Warning</span>
                <span className="font-bold text-red-600 tabular-nums">{thresholds.bloodPressureMap.maxWarn} mmHg</span>
              </div>
              <input
                type="range"
                min="95"
                max="125"
                value={thresholds.bloodPressureMap.maxWarn}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    bloodPressureMap: { ...thresholds.bloodPressureMap, maxWarn: Number(e.target.value) },
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Medical Patch & Bioimpedance Safeguards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Medical Patch &amp; Bioimpedance</h3>
                <span className="text-xs text-slate-500">CHF Pulmonary Fluid &amp; Acoustic Cough</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Clinical Patch
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-red-700">Thoracic Bioimpedance Minimum (Pulmonary Edema Warning)</span>
                <span className="font-bold text-red-600 tabular-nums">&lt; {thresholds.thoracicBioimpedanceMinOhms} &Omega;</span>
              </div>
              <input
                type="range"
                min="20"
                max="45"
                step="0.5"
                value={thresholds.thoracicBioimpedanceMinOhms}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    thoracicBioimpedanceMinOhms: Number(e.target.value),
                  })
                }
                className="w-full accent-red-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Lower resistance indicates fluid accumulation in lungs</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-amber-700">Acoustic Cough Frequency Alert</span>
                <span className="font-bold text-amber-700 tabular-nums">&gt; {thresholds.coughRatePerHourMax} coughs/hr</span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={thresholds.coughRatePerHourMax}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    coughRatePerHourMax: Number(e.target.value),
                  })
                }
                className="w-full accent-amber-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Flags early pneumonia, viral infection, or COPD flare-up</p>
            </div>
          </div>
        </div>

        {/* Pulse Oximeter & Thermal Safeguards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Perfusion &amp; Thermal Drift</h3>
                <span className="text-xs text-slate-500">Optical Signal &amp; NTC Skin Temp Sensor</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-700">
              Ring &amp; Pulse Ox
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-blue-700">Minimum Perfusion Index (PI %)</span>
                <span className="font-bold text-blue-700 tabular-nums">&lt; {thresholds.perfusionIndexMin}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="2.5"
                step="0.1"
                value={thresholds.perfusionIndexMin}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    perfusionIndexMin: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Detects poor peripheral circulation or severe hypothermia</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-rose-700">Skin Temperature Fever Deviation</span>
                <span className="font-bold text-rose-700 tabular-nums">&gt; +{thresholds.skinTempDeviationMaxF}&deg;F above base</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={thresholds.skinTempDeviationMaxF}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    skinTempDeviationMaxF: Number(e.target.value),
                  })
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Detects immunological trigger up to 48 hours before fever</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Reset Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restore Default Safe Limits</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Thresholds &amp; Update Devices</span>
        </button>
      </div>
    </div>
  );
}

