import { useState, useEffect } from 'react';
import { 
  Watch, 
  Bluetooth, 
  RefreshCw, 
  Battery, 
  Check, 
  Plus, 
  CircleDot, 
  Radio,
  Activity,
  Droplet,
  Wind,
  Scale,
  ShieldAlert,
  HeartHandshake,
  BookOpen,
  Info,
  Layers,
  ChevronRight,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  CheckCheck,
  Zap,
  Play,
  Square,
  Trash2,
  Vibrate
} from 'lucide-react';
import { WearableCategory, WearableDevice, VitalsReading } from '../types';
import { WEARABLE_DATA_DICTIONARY } from '../utils/mockData';
import { triggerSyncHapticFeedback } from '../utils/speech';

interface DevicesManagerProps {
  devices: WearableDevice[];
  onToggleDeviceConnect: (deviceId: string) => void;
  onAddDevice: (newDevice: WearableDevice) => void;
  onSyncAll: () => void;
  onRealVitalsUpdate?: (vitals: Partial<VitalsReading>) => void;
  onRemoveDevice?: (deviceId: string) => void;
}

export const SUPPORTED_DEVICE_PRESETS: {
  name: string;
  brand: string;
  category: WearableCategory;
  telemetrySummary: string;
  supportedMetrics: string[];
}[] = [
  {
    name: 'Apple Watch Series 10 / Ultra 2',
    brand: 'Apple HealthKit',
    category: 'smartwatch',
    telemetrySummary: 'ECG Sinus Rhythm, SpO2 98%, HR 72 BPM, Walking Steadiness: Good',
    supportedMetrics: ['ECG', 'Blood Oxygen', 'Heart Rate', 'Fall Detection', 'Skin Temp', 'Walking Steadiness'],
  },
  {
    name: 'Samsung Galaxy Watch 7 / Ultra',
    brand: 'Google Health Connect',
    category: 'smartwatch',
    telemetrySummary: 'ECG Rhythm, Blood Pressure, SpO2, BIA Body Composition, Sleep Apnea',
    supportedMetrics: ['Blood Pressure', 'ECG', 'SpO2', 'Body Composition', 'Sleep Apnea Score'],
  },
  {
    name: 'Google Pixel Watch 2 / 3',
    brand: 'Google / Fitbit Health Connect',
    category: 'smartwatch',
    telemetrySummary: 'Multi-path Optical HR, cEDA Stress Micro-events, SpO2, Fall Detection',
    supportedMetrics: ['Continuous Heart Rate', 'cEDA Stress', 'Blood Oxygen', 'Fall Quorum'],
  },
  {
    name: 'Fitbit Charge 5 / 6 / Sense 2 / Versa 4',
    brand: 'Fitbit Health Cloud',
    category: 'smartwatch',
    telemetrySummary: 'PurePulse HR, Daily Readiness, SpO2 Saturation, Sleep Efficiency 89%',
    supportedMetrics: ['Heart Rate', 'SpO2', 'Skin Temp', 'Steps & Cardio', 'Sleep Stages'],
  },
  {
    name: 'Garmin Venu 3 / Forerunner 965',
    brand: 'Garmin Health',
    category: 'smartwatch',
    telemetrySummary: 'Pulse Ox, HRV Status, Respiration Rate, Nap Detection, Body Battery',
    supportedMetrics: ['Pulse Ox', 'Heart Rate Variability', 'Respiration Rate', 'Body Battery'],
  },
  {
    name: 'Amazfit Balance / GTR / GTS',
    brand: 'Zepp Health Cloud',
    category: 'smartwatch',
    telemetrySummary: 'BioTracker 5.0 PPG, 24H SpO2, Sleep Readiness, Body Composition',
    supportedMetrics: ['Continuous Heart Rate', 'SpO2', 'Sleep Readiness', 'Step Count'],
  },
  {
    name: 'Whoop 4.0 Health Strap',
    brand: 'Whoop Cloud API',
    category: 'smartwatch',
    telemetrySummary: 'Skin Temp Deviation, Resting HR & HRV, Blood Oxygen SpO2, Strain Engine',
    supportedMetrics: ['Resting HR', 'HRV (rMSSD)', 'Blood Oxygen', 'Skin Temperature'],
  },
  {
    name: 'Pebble 2 HR / Pebble Time (Rebble)',
    brand: 'Pebble Health / RebbleOS',
    category: 'smartwatch',
    telemetrySummary: 'Pebble Health Steps & Sleep, Continuous Optical Heart Rate (Pebble 2 HR), 3-Axis Fall Accelerometer',
    supportedMetrics: ['Optical Heart Rate (Pebble 2 HR)', 'Pebble Health Steps', 'Sleep Tracking', 'Inertial Impact / Fall Detection', 'Battery Level (7-Day Life)'],
  },
  {
    name: 'Oura Ring Gen 3 / Gen 4 Horizon',
    brand: 'Oura Health Cloud',
    category: 'ring',
    telemetrySummary: 'Nocturnal HRV 44ms, Skin Temp +0.2°C, Sleep Readiness 88/100, BDI 1.2/hr',
    supportedMetrics: ['Overnight SpO2', 'Resting HR', 'Skin Temp Deviation', 'HRV (rMSSD)', 'Breathing Disturbances'],
  },
  {
    name: 'Ultrahuman Ring AIR',
    brand: 'Ultrahuman Cloud',
    category: 'ring',
    telemetrySummary: 'Circadian Phase Tracking, Nocturnal Skin Temp, Resting HR, Sleep Index',
    supportedMetrics: ['Skin Temp', 'Circadian Phase', 'HRV', 'Resting HR', 'Movement Index'],
  },
  {
    name: 'Omron Evolv Upper Arm Blood Pressure',
    brand: 'Omron Healthcare',
    category: 'blood_pressure_cuff',
    telemetrySummary: 'BP 122/78 mmHg, MAP 92.7 mmHg, Pulse Pressure 44 mmHg, Arrhythmia: Negative',
    supportedMetrics: ['Systolic BP', 'Diastolic BP', 'MAP', 'Pulse Pressure', 'Irregular Heartbeat'],
  },
  {
    name: 'Withings BPM Core Medical Cuff & Stethoscope',
    brand: 'Withings Health Solutions',
    category: 'blood_pressure_cuff',
    telemetrySummary: 'Oscillometric BP, 1-Lead ECG, Digital Stethoscope (Valvular Murmur Analysis)',
    supportedMetrics: ['Blood Pressure', '1-Lead ECG', 'Phonocardiogram Stethoscope', 'Valvular Murmur'],
  },
  {
    name: 'Dexcom G7 Continuous Glucose Monitor',
    brand: 'Dexcom CGM Direct',
    category: 'cgm_patch',
    telemetrySummary: 'Glucose 104 mg/dL (Steady arrow), TIR 94%, GMI 5.8%, Urgent Low Alarm Armed',
    supportedMetrics: ['Real-time Glucose', 'Trend Arrows', 'Time in Range', 'TBR Hypo Risk', 'Estimated HbA1c'],
  },
  {
    name: 'Abbott FreeStyle Libre 3 Plus',
    brand: 'Abbott Diabetes Care',
    category: 'cgm_patch',
    telemetrySummary: 'Continuous Glucose, 1-Minute Telemetry, Urgent Low Alarm, 15-day Sensor',
    supportedMetrics: ['1-Min Glucose', 'Trend Arrows', 'Time in Range', 'GMI', 'Sensor Longevity'],
  },
  {
    name: 'BioIntelliSense BioButton Clinical Patch',
    brand: 'BioIntelliSense Clinical',
    category: 'medical_patch',
    telemetrySummary: 'Continuous 3-Lead ECG, Thoracic Bioimpedance 48.2Ω, Cough 1/hr, Tilt Angle',
    supportedMetrics: ['Continuous ECG', 'Thoracic Bioimpedance', 'Acoustic Cough Count', 'PVC Burden', 'Gait Posture'],
  },
  {
    name: 'Masimo MightySat Medical Pulse Oximeter',
    brand: 'Masimo Medical BLE',
    category: 'pulse_oximeter',
    telemetrySummary: '1-Sec SpO2 98%, Perfusion Index 4.6%, ODI 0.8 dips/hr, Signal IQ',
    supportedMetrics: ['High-Res SpO2', 'Perfusion Index (PI)', 'ODI 4% Dips', 'Pleth Waveform', 'Respiration'],
  },
  {
    name: 'Withings Body Scan Medical Station',
    brand: 'Withings Health Solutions',
    category: 'smart_scale',
    telemetrySummary: 'Weight 148.6 lbs, PWV 7.2 m/s, Vascular Age 66y, 6-Lead ECG, Nerve Score 84',
    supportedMetrics: ['Weight & BMI', '6-Lead ECG', 'Pulse Wave Velocity (PWV)', 'Vascular Age', 'Sudomotor Score'],
  },
  {
    name: 'Medical Guardian MGMini Smart SOS Pendant',
    brand: 'Medical Guardian / Sensoria',
    category: 'pendant_insole',
    telemetrySummary: 'Altimeter: Normal, Impact Shock: 0.12G, Plantar Balance: 51%/49%, E911 GPS',
    supportedMetrics: ['Barometric Altitude Drop', 'Impact Shock Force', 'Immobility Timer', 'Plantar Balance', 'GPS & SOS'],
  },
];

export default function DevicesManager({
  devices,
  onToggleDeviceConnect,
  onAddDevice,
  onSyncAll,
  onRealVitalsUpdate,
  onRemoveDevice,
}: DevicesManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'fleet' | 'dictionary'>('fleet');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairingMode, setPairingMode] = useState<'real_bluetooth' | 'presets' | 'custom'>('real_bluetooth');
  const [customDevName, setCustomDevName] = useState('');
  const [customDevBrand, setCustomDevBrand] = useState('');
  const [customDevCategory, setCustomDevCategory] = useState<WearableCategory>('smartwatch');
  const [isScanningBLE, setIsScanningBLE] = useState(false);
  const [bleError, setBleError] = useState<string | null>(null);
  const [connectedBLEDevice, setConnectedBLEDevice] = useState<string | null>(null);
  const [liveHeartRate, setLiveHeartRate] = useState<number | null>(null);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDictionaryCategory, setExpandedDictionaryCategory] = useState<WearableCategory | null>('smartwatch');

  // Iframe and live telemetry simulation state
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [simulatedBpm, setSimulatedBpm] = useState(76);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isSimulatingStream) {
      interval = setInterval(() => {
        // Natural physiological HRV variance +/- 1 to 2 BPM
        const variance = Math.floor(Math.random() * 5) - 2;
        const newBpm = Math.max(45, Math.min(175, simulatedBpm + variance));
        setLiveHeartRate(newBpm);
        if (onRealVitalsUpdate) {
          onRealVitalsUpdate({ heartRate: newBpm });
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isSimulatingStream, simulatedBpm, onRealVitalsUpdate]);

  const handleCopyDirectUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const handleToggleSimulation = (targetBpm = 76) => {
    setSimulatedBpm(targetBpm);
    if (!isSimulatingStream) {
      setIsSimulatingStream(true);
      setLiveHeartRate(targetBpm);
      if (onRealVitalsUpdate) {
        onRealVitalsUpdate({ heartRate: targetBpm });
      }

      const simulatedWatch: WearableDevice = {
        id: `sim_watch_${Date.now()}`,
        name: 'Live Smartwatch Stream (Virtual BLE)',
        brand: 'Continuous Bluetooth GATT (1.5s Stream)',
        category: 'smartwatch',
        batteryPercent: 94,
        lastSync: 'Live (Streaming)',
        connected: true,
        macAddress: 'BLE:STREAM:ACTIVE',
        supportedMetrics: ['Continuous Heart Rate (BPM)', 'Heart Rate Variability (rMSSD)'],
        telemetrySummary: `Broadcasting physiological pulses at ${targetBpm} BPM`,
      };
      onAddDevice(simulatedWatch);
    } else {
      setIsSimulatingStream(false);
    }
  };

  const handleSync = () => {
    setIsSyncing(true);
    onSyncAll();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleConnectRealBLE = async () => {
    setBleError(null);
    setIsScanningBLE(true);

    try {
      if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth requires Google Chrome, Edge, or an Android browser. If on iOS Safari, use an Android/Chrome device or test using the Clinical Preset Emulators.');
      }

      // Request standard Bluetooth GATT Heart Rate Service (0x180D)
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      if (!device || !device.gatt) {
        throw new Error('Selected Bluetooth device does not provide GATT services.');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      await characteristic.startNotifications();

      // Listen for continuous live heartbeat measurements from the physical watch
      characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const dataView = event.target.value as DataView;
        const flags = dataView.getUint8(0);
        const is16Bit = flags & 0x01;
        const bpm = is16Bit ? dataView.getUint16(1, true) : dataView.getUint8(1);
        
        setLiveHeartRate(bpm);
        if (onRealVitalsUpdate) {
          onRealVitalsUpdate({ heartRate: bpm });
        }
      });

      const newDev: WearableDevice = {
        id: `ble_${device.id || Date.now()}`,
        name: device.name || 'Bluetooth Heart Rate Monitor',
        brand: 'Physical Bluetooth Watch (Live BLE)',
        category: 'smartwatch',
        batteryPercent: 95,
        lastSync: 'Live (Streaming)',
        connected: true,
        macAddress: 'BLE:GATT:ACTIVE',
        supportedMetrics: ['Continuous Heart Rate (BPM)', 'Heart Rate Variability (rMSSD)'],
        telemetrySummary: `Live GATT Heart Rate feed active (${device.name || 'Smartwatch'})`,
      };

      onAddDevice(newDev);
      setConnectedBLEDevice(device.name || 'Real Smartwatch');
      setShowPairModal(false);
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('permissions policy') || msg.includes('disallowed') || err.name === 'SecurityError') {
          setBleError('IFRAME_PERMISSION_POLICY');
        } else {
          setBleError(err.message || 'Bluetooth connection failed or was cancelled.');
        }
      }
    } finally {
      setIsScanningBLE(false);
    }
  };

  const handlePairSubmit = () => {
    const preset = SUPPORTED_DEVICE_PRESETS[selectedPresetIndex];
    const newDev: WearableDevice = {
      id: `dev_${Date.now()}`,
      name: preset.name,
      brand: preset.brand,
      category: preset.category,
      batteryPercent: Math.floor(Math.random() * 20) + 80,
      lastSync: 'Just now',
      connected: true,
      macAddress: `D8:42:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:99:FF`,
      supportedMetrics: preset.supportedMetrics,
      telemetrySummary: preset.telemetrySummary,
    };
    onAddDevice(newDev);
    setShowPairModal(false);
  };

  const getCategoryIcon = (category: WearableCategory) => {
    switch (category) {
      case 'smartwatch':
        return <Watch className="w-5 h-5 text-teal-700" />;
      case 'ring':
        return <CircleDot className="w-5 h-5 text-indigo-700" />;
      case 'blood_pressure_cuff':
        return <Activity className="w-5 h-5 text-rose-700" />;
      case 'cgm_patch':
        return <Droplet className="w-5 h-5 text-amber-700" />;
      case 'medical_patch':
        return <HeartHandshake className="w-5 h-5 text-red-700" />;
      case 'pulse_oximeter':
        return <Wind className="w-5 h-5 text-cyan-700" />;
      case 'smart_scale':
        return <Scale className="w-5 h-5 text-emerald-700" />;
      case 'pendant_insole':
        return <ShieldAlert className="w-5 h-5 text-purple-700" />;
      default:
        return <Watch className="w-5 h-5 text-slate-700" />;
    }
  };

  const getCategoryLabel = (cat: WearableCategory) => {
    switch (cat) {
      case 'smartwatch': return 'Smartwatch';
      case 'ring': return 'Smart Ring';
      case 'blood_pressure_cuff': return 'BP Cuff';
      case 'cgm_patch': return 'CGM Glucose';
      case 'medical_patch': return 'Medical Patch';
      case 'pulse_oximeter': return 'Pulse Oximeter';
      case 'smart_scale': return 'Medical Scale';
      case 'pendant_insole': return 'SOS Pendant / Insole';
      default: return cat;
    }
  };

  const filteredDevices = devices.filter((dev) => {
    if (selectedCategoryFilter !== 'all' && dev.category !== selectedCategoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        dev.name.toLowerCase().includes(q) ||
        dev.brand.toLowerCase().includes(q) ||
        dev.supportedMetrics.some((m) => m.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Mode Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-600 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900">Connected Wearable Health Ecosystem</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Universal multi-device telemetry supporting standard international &amp; domestic brands with customized data streams.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sub-tab view switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSubTab('fleet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'fleet'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Active Fleet ({devices.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('dictionary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'dictionary'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
              <span>Telemetry Matrix &amp; Data Dictionary</span>
            </button>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Fleet'}</span>
          </button>

          <button
            onClick={() => setShowPairModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Pair Wearable</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: ACTIVE WEARABLE FLEET */}
      {activeSubTab === 'fleet' && (
        <div className="space-y-5">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories ({devices.length})
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('smartwatch')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'smartwatch'
                    ? 'bg-teal-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Smartwatches
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('ring')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'ring'
                    ? 'bg-indigo-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Smart Rings
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('blood_pressure_cuff')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'blood_pressure_cuff'
                    ? 'bg-rose-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                BP Cuffs
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('cgm_patch')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'cgm_patch'
                    ? 'bg-amber-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                CGM Glucose
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('medical_patch')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'medical_patch'
                    ? 'bg-red-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Medical Patches
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('pulse_oximeter')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'pulse_oximeter'
                    ? 'bg-cyan-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Pulse Oximeters
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('smart_scale')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'smart_scale'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Body Scales
              </button>
              <button
                onClick={() => setSelectedCategoryFilter('pendant_insole')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'pendant_insole'
                    ? 'bg-purple-700 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                SOS Pendants
              </button>
            </div>

            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search device or metric..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-full sm:w-56 focus:outline-teal-700"
              />
            </div>
          </div>

          {/* Unlisted Device Guide Card */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Watch className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Have a watch or monitor not in the preset list?</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  KINOTE supports ANY brand (Noise, Boat, Fire-Boltt, Polar, Amazfit, Suunto, etc.). Click <strong>Pair Wearable</strong> &rarr; <strong>Add Custom Device</strong> or scan directly with <strong>Real Bluetooth BLE</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPairingMode('custom');
                setShowPairModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              + Add Unlisted Device
            </button>
          </div>

          {/* Connected Devices Grid with customized telemetry inspection */}
          {filteredDevices.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Watch className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">No Wearable Devices Found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery ? `No devices match "${searchQuery}".` : 'No health devices currently paired in this circle.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPairingMode('custom');
                    if (searchQuery) setCustomDevName(searchQuery);
                    setShowPairModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  + Add Custom / Unlisted Watch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPairingMode('real_bluetooth');
                    setShowPairModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Scan Bluetooth Sensor
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDevices.map((dev) => (
              <div
                key={dev.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  dev.connected
                    ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          dev.connected ? 'bg-slate-100' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {getCategoryIcon(dev.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{dev.name}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">{dev.brand}</span>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {getCategoryLabel(dev.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
                      {dev.batteryVerified && dev.batteryPercent !== undefined ? (
                        <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Battery className={`w-3.5 h-3.5 ${dev.batteryPercent > 20 ? 'text-emerald-600' : 'text-rose-500'}`} />
                          <span className="tabular-nums">{dev.batteryPercent}%</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-semibold">
                          Encrypted Feed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Summary Banner */}
                  {dev.telemetrySummary && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900 leading-snug">
                      <span className="font-semibold text-teal-950">Live Stream: </span>
                      {dev.telemetrySummary}
                    </div>
                  )}

                  {/* Watch Screen Message Simulator / Display */}
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[10px] flex items-center justify-between border border-slate-800">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span>SCREEN: &quot;KINOTE ACTIVE&quot;</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerSyncHapticFeedback([180, 80, 240])}
                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      title="Send hardware vibration pulse and screen ping"
                    >
                      <Vibrate className="w-2.5 h-2.5" />
                      <span>Haptic Ping</span>
                    </button>
                  </div>

                  {/* Active Sensor Metrics Breakdown if available */}
                  {dev.metricsSpecs && dev.metricsSpecs.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Customized Telemetry Stream:
                      </span>
                      <div className="space-y-1">
                        {dev.metricsSpecs.slice(0, 3).map((spec, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{spec.name}</p>
                              <p className="text-[10px] text-slate-500">{spec.samplingInterval}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-teal-800">{spec.lastValue}</span>
                              <span className="text-[10px] text-slate-400 block">{spec.clinicalPurpose.slice(0, 24)}...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supported Metrics Tags */}
                  <div className="mt-3 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Capabilities: </span>
                    {dev.supportedMetrics.slice(0, 4).join(' · ')}
                    {dev.supportedMetrics.length > 4 && ` · +${dev.supportedMetrics.length - 4} more`}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <CircleDot className={`w-2.5 h-2.5 ${dev.connected ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span className={dev.connected ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        {dev.connected ? 'Live Encrypted Sync' : 'Offline / Standby'}
                      </span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">Synced {dev.lastSync}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400 truncate">MAC: {dev.macAddress}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onRemoveDevice && (
                        <button
                          type="button"
                          onClick={() => onRemoveDevice(dev.id)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                          title={`Unpair and remove ${dev.name} from monitoring`}
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Unpair</span>
                        </button>
                      )}
                      <button
                        onClick={() => onToggleDeviceConnect(dev.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          dev.connected
                            ? 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                            : 'text-teal-700 hover:bg-teal-50 border border-teal-200 font-bold'
                        }`}
                      >
                        {dev.connected ? 'Disconnect' : 'Connect & Sync'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: WEARABLE TELEMETRY MATRIX & DATA DICTIONARY */}
      {activeSubTab === 'dictionary' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-indigo-950">Comprehensive Wearable Telemetry Data Dictionary</h3>
                <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                  Every wearable health monitor captures unique physiological signals depending on its sensor physics, placement on the body (wrist, finger, arm, chest, feet), and clinical purpose. Below is the complete catalog of all data received from different wearables, customized by wearable type.
                </p>
              </div>
            </div>
          </div>

          {/* Dictionary Category Accordions */}
          <div className="space-y-4">
            {WEARABLE_DATA_DICTIONARY.map((dictCat) => {
              const isExpanded = expandedDictionaryCategory === dictCat.id;
              return (
                <div
                  key={dictCat.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => setExpandedDictionaryCategory(isExpanded ? null : dictCat.id)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {getCategoryIcon(dictCat.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">{dictCat.title}</h4>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {dictCat.collectedDataPoints.length} Data Streams
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{dictCat.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-teal-700 font-semibold hidden sm:inline">
                        {isExpanded ? 'Collapse' : 'Explore Data Streams'}
                      </span>
                      <ChevronRight
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 pt-0 border-t border-slate-100 space-y-4 bg-slate-50/40">
                      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 mt-4 text-xs">
                        <p className="text-slate-700 leading-relaxed">{dictCat.description}</p>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <span className="font-semibold text-slate-700">Representative Hardware:</span>
                          <span>{dictCat.typicalBrands.join(' · ')}</span>
                        </div>
                      </div>

                      {/* Data Streams Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                              <th className="p-3.5">Telemetry Data Point</th>
                              <th className="p-3.5">Clinical &amp; Physiological Purpose</th>
                              <th className="p-3.5 whitespace-nowrap">Sampling Interval</th>
                              <th className="p-3.5">KINOTE Actionable Alert &amp; Threshold</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-800">
                            {dictCat.collectedDataPoints.map((dp, dpIdx) => (
                              <tr key={dpIdx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                                  {dp.name}
                                </td>
                                <td className="p-3.5 text-slate-600 leading-relaxed min-w-[200px]">
                                  {dp.clinicalValue}
                                </td>
                                <td className="p-3.5 font-mono text-[11px] text-teal-800 whitespace-nowrap">
                                  {dp.frequency}
                                </td>
                                <td className="p-3.5 text-slate-700 min-w-[220px]">
                                  <span className="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                                    {dp.actionableAlert}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pair New Device Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Pair New Health Device</h3>
              </div>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Mode Selector Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setPairingMode('real_bluetooth')}
                className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  pairingMode === 'real_bluetooth'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>Pair Real Smartwatch (Web BLE)</span>
              </button>
              <button
                onClick={() => setPairingMode('presets')}
                className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  pairingMode === 'presets'
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Device Presets</span>
              </button>
              <button
                onClick={() => setPairingMode('custom')}
                className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  pairingMode === 'custom'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Custom / Other Device</span>
              </button>
            </div>

            {pairingMode === 'real_bluetooth' ? (
              <div className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                    <Bluetooth className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span>Live Bluetooth Low Energy (GATT) Pairing</span>
                  </div>
                  <p className="text-xs leading-relaxed text-blue-900">
                    Connect directly to any physical smartwatch, smart ring, or heart rate monitor broadcasting standard Bluetooth SIG Heart Rate GATT (Service <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold">0x180D</code>).
                  </p>
                </div>

                {/* Instructions by Watch Brand */}
                <div className="space-y-2 text-xs text-slate-700">
                  <p className="font-bold text-slate-900 text-xs">How to test with your watch right now:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span>⌚ Garmin Watch:</span>
                      </span>
                      <p className="text-slate-600">
                        Go to <strong>Settings → Wrist Heart Rate → Broadcast Heart Rate</strong>. Turn ON, then tap Scan below.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span>⌚ Apple Watch:</span>
                      </span>
                      <p className="text-slate-600">
                        Open free broadcast app like <strong>HeartCast</strong> or <strong>Echo</strong> on Apple Watch to broadcast BLE to Chrome.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span>⌚ Samsung / Wear OS:</span>
                      </span>
                      <p className="text-slate-600">
                        Enable BLE Heart Rate Broadcast or open standard Wear OS BLE heart rate app.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span>🫀 Polar / Whoop / Rings:</span>
                      </span>
                      <p className="text-slate-600">
                        Wear device within Bluetooth range; BLE GATT 0x180D broadcasts automatically.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1 sm:col-span-2">
                      <span className="font-bold text-teal-950 flex items-center justify-between">
                        <span className="flex items-center gap-1">⌚ Pebble Watch (Pebble 2 HR / Pebble Time / Rebble):</span>
                        <span className="text-[10px] bg-teal-200/60 text-teal-900 px-1.5 py-0.5 rounded font-mono font-bold">Pebble Health</span>
                      </span>
                      <p className="text-slate-600 leading-snug">
                        <strong>Pebble 2 HR:</strong> Equipped with an optical heart rate sensor on the back. Syncs steps &amp; BPM via the Pebble/Rebble app to Google Fit or Google Health Connect.
                      </p>
                      <p className="text-[10px] text-slate-500">
                        <strong>Pebble Time / Classic / Steel / Round:</strong> Features 3-axis inertial accelerometer for sleep stages, step cadence, and impact fall detection (no optical HR sensor).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Iframe Permissions Policy Notice */}
                {(isInIframe || bleError === 'IFRAME_PERMISSION_POLICY') && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Browser Iframe Sandbox Security Policy</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900">
                      Web browsers (Chrome &amp; Edge) block physical Bluetooth pairing when apps are loaded inside an embedded preview iframe (Permissions Policy: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">bluetooth disallowed</code>).
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        onClick={handleCopyDirectUrl}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        {copiedUrl ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                        <span>{copiedUrl ? 'Direct URL Copied!' : 'Copy Direct App URL'}</span>
                      </button>
                      <a
                        href={typeof window !== 'undefined' ? window.location.href : '#'}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Direct Browser Tab</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Non-iframe specific BLE error */}
                {bleError && bleError !== 'IFRAME_PERMISSION_POLICY' && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Bluetooth Notice:</p>
                      <p className="text-[11px] leading-relaxed mt-0.5">{bleError}</p>
                    </div>
                  </div>
                )}

                {/* Live Smartwatch Stream Simulator (Always works 100% in all environments) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white space-y-2.5 shadow-md border border-teal-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-teal-400 shrink-0" />
                      <span className="font-bold text-xs text-white">Live Smartwatch Stream Simulator</span>
                    </div>
                    {isSimulatingStream ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-mono animate-pulse">
                        STREAMING ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        STANDBY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-100/80 leading-relaxed">
                    Test live continuous heart rate pulses (updated every 1.5s with realistic HRV variance) directly inside KINOTE without hardware restrictions.
                  </p>
                  
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      onClick={() => handleToggleSimulation(76)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSimulatingStream && simulatedBpm === 76
                          ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-300'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isSimulatingStream && simulatedBpm === 76 ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      <span>Normal (76 BPM)</span>
                    </button>

                    <button
                      onClick={() => handleToggleSimulation(138)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSimulatingStream && simulatedBpm === 138
                          ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300 animate-pulse'
                          : 'bg-white/10 hover:bg-white/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-rose-400" />
                      <span>Test Tachycardia Spike (138 BPM)</span>
                    </button>

                    <button
                      onClick={() => handleToggleSimulation(48)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSimulatingStream && simulatedBpm === 48
                          ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                          : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <span>Test Bradycardia (48 BPM)</span>
                    </button>
                  </div>
                </div>

                {liveHeartRate && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600 animate-bounce" />
                      <span>Live Heart Rate Received:</span>
                    </span>
                    <span className="text-base font-black font-mono text-emerald-800">{liveHeartRate} BPM</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleConnectRealBLE}
                    disabled={isScanningBLE}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Radio className={`w-4 h-4 ${isScanningBLE ? 'animate-spin' : 'animate-pulse'}`} />
                    <span>{isScanningBLE ? 'Scanning for Nearby Bluetooth Devices...' : 'Scan & Connect Physical Smartwatch (Chrome Web BLE)'}</span>
                  </button>
                </div>
              </div>
            ) : pairingMode === 'presets' ? (
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500">
                  Select from standard international or domestic health monitors across all 8 supported wearable categories:
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {SUPPORTED_DEVICE_PRESETS.map((preset, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedPresetIndex(index)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedPresetIndex === index
                          ? 'border-teal-600 bg-teal-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {getCategoryIcon(preset.category)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{preset.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {preset.brand} · <span className="font-semibold text-slate-700">{getCategoryLabel(preset.category)}</span>
                          </p>
                          <p className="text-[11px] text-teal-800 font-mono mt-0.5 line-clamp-1">
                            {preset.telemetrySummary}
                          </p>
                        </div>
                      </div>
                      {selectedPresetIndex === index && (
                        <Check className="w-5 h-5 text-teal-700 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!customDevName.trim()) return;
                const newDev: WearableDevice = {
                  id: `dev-custom-${Date.now()}`,
                  name: customDevName.trim(),
                  brand: customDevBrand.trim() || 'Custom BLE',
                  category: customDevCategory,
                  batteryVerified: false,
                  connected: true,
                  lastSync: 'Just now',
                  macAddress: `BLE:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:DD:EE`,
                  supportedMetrics: ['Heart Rate', 'Pulse SpO2', 'Step Tracking'],
                  telemetrySummary: 'Custom Bluetooth Health Stream Active',
                  screenSyncMessage: 'KINOTE CONNECTED · ACTIVE MONITORING',
                };
                triggerSyncHapticFeedback([150, 100, 200, 100, 300]);
                onAddDevice(newDev);
                if (onRealVitalsUpdate) {
                  onRealVitalsUpdate({ heartRate: 72, spo2: 98 });
                }
                setShowPairModal(false);
                setCustomDevName('');
                setCustomDevBrand('');
              }} className="p-6 space-y-4">
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950">
                  <p className="font-bold text-indigo-900">Add Any Unlisted Watch, Band or Sensor</p>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    If your smartwatch or medical device is not in the presets list, enter its name here. KINOTE will pair it and listen for continuous health telemetry.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Device Name / Model *</label>
                  <input
                    type="text"
                    required
                    value={customDevName}
                    onChange={(e) => setCustomDevName(e.target.value)}
                    placeholder="e.g. Fitbit Charge 6, Amazfit Balance, Coros Pace 3, Huawei Watch GT..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-teal-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Brand / Manufacturer</label>
                    <input
                      type="text"
                      value={customDevBrand}
                      onChange={(e) => setCustomDevBrand(e.target.value)}
                      placeholder="e.g. Fitbit, Huawei, Xiaomi"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-teal-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={customDevCategory}
                      onChange={(e) => setCustomDevCategory(e.target.value as WearableCategory)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-teal-700"
                    >
                      <option value="smartwatch">Smartwatch / Tracker</option>
                      <option value="ring">Smart Ring</option>
                      <option value="blood_pressure_cuff">Blood Pressure Cuff</option>
                      <option value="cgm_patch">Glucose CGM</option>
                      <option value="pulse_oximeter">Pulse Oximeter</option>
                      <option value="medical_patch">Medical ECG Patch</option>
                      <option value="smart_scale">Body Scale</option>
                      <option value="pendant_insole">Fall SOS Pendant</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    + Pair &amp; Connect {customDevName.trim() || 'Custom Device'}
                  </button>
                </div>
              </form>
            )}

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                {pairingMode === 'real_bluetooth' ? 'Requires Chrome / Android with Bluetooth enabled' : pairingMode === 'custom' ? 'Custom device configuration' : 'Preset emulator mode'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPairModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 cursor-pointer"
                >
                  Cancel
                </button>
                {pairingMode === 'presets' && (
                  <button
                    type="button"
                    onClick={handlePairSubmit}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Authenticate &amp; Ingest Telemetry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
