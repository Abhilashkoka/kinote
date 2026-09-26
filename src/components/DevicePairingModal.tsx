import React, { useState, useMemo } from 'react';
import { 
  Watch, 
  Bluetooth, 
  Check, 
  Sparkles, 
  X, 
  Radio, 
  RefreshCw, 
  TestTube,
  Plus,
  Search,
  Activity,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Smartphone
} from 'lucide-react';
import { WearableCategory, WearableDevice, VitalsReading } from '../types';

export interface DevicePreset {
  id: string;
  name: string;
  brand: string;
  category: WearableCategory;
  badge: string;
  iconBg: string;
  features: string[];
  initialVitals: Partial<VitalsReading>;
}

export const POPULAR_DEVICES: DevicePreset[] = [
  {
    id: 'apple-watch',
    name: 'Apple Watch Series 8 / 9 / 10 / Ultra',
    brand: 'Apple HealthKit',
    category: 'smartwatch',
    badge: 'Apple Health',
    iconBg: 'bg-slate-900 text-white',
    features: ['ECG Lead I Sinus Rhythm', 'Blood Oxygen (SpO2)', 'Fall Detection Quorum', 'Resting Heart Rate'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 72,
      spo2: 98,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 78,
      temperature: 98.4,
      fallDetected: false,
      smartwatch: {
        ecgRhythm: 'normal_sinus',
        restingHeartRate: 68,
        walkingHeartRateAvg: 88,
        hrvRmssd: 45,
        wristTempDeviation: 0.1,
        cEdaStressEvents: 1,
        walkingSteadiness: 'ok',
        dailySteps: 4320,
        sleepEfficiencyPercent: 89,
      }
    }
  },
  {
    id: 'galaxy-watch',
    name: 'Samsung Galaxy Watch 5 / 6 / 7 / Ultra',
    brand: 'Google Health Connect',
    category: 'smartwatch',
    badge: 'Wear OS',
    iconBg: 'bg-blue-600 text-white',
    features: ['Optical BioActive Sensor', 'Blood Pressure Calibration', 'SpO2 & Sleep Apnea', 'Fall Sensor'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 74,
      spo2: 97,
      bloodPressureSystolic: 122,
      bloodPressureDiastolic: 80,
      temperature: 98.6,
      fallDetected: false,
      smartwatch: {
        ecgRhythm: 'normal_sinus',
        restingHeartRate: 70,
        walkingHeartRateAvg: 90,
        hrvRmssd: 42,
        wristTempDeviation: 0.2,
        cEdaStressEvents: 2,
        walkingSteadiness: 'ok',
        dailySteps: 3890,
        sleepEfficiencyPercent: 86,
      }
    }
  },
  {
    id: 'pixel-watch',
    name: 'Google Pixel Watch 2 / 3',
    brand: 'Fitbit / Google Health Connect',
    category: 'smartwatch',
    badge: 'Pixel Health',
    iconBg: 'bg-emerald-600 text-white',
    features: ['Multi-path Heart Rate Sensor', 'cEDA Continuous Stress', 'SpO2 Pulse Ox', 'Fall Detection'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 71,
      spo2: 98,
      temperature: 98.4,
      respiratoryRate: 15,
      smartwatch: {
        ecgRhythm: 'normal_sinus',
        restingHeartRate: 67,
        walkingHeartRateAvg: 86,
        hrvRmssd: 46,
        wristTempDeviation: 0.0,
        cEdaStressEvents: 1,
        walkingSteadiness: 'ok',
        dailySteps: 4100,
        sleepEfficiencyPercent: 91,
      }
    }
  },
  {
    id: 'fitbit-devices',
    name: 'Fitbit Charge 5 / 6 / Sense 2 / Versa 4',
    brand: 'Fitbit Cloud API',
    category: 'smartwatch',
    badge: 'Fitbit Health',
    iconBg: 'bg-teal-700 text-white',
    features: ['Continuous PurePulse HR', 'Daily Readiness Score', 'SpO2 Oxygen Saturation', 'Skin Temp Sensor'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 69,
      spo2: 98,
      temperature: 98.3,
      respiratoryRate: 15,
      smartwatch: {
        ecgRhythm: 'normal_sinus',
        restingHeartRate: 65,
        walkingHeartRateAvg: 85,
        hrvRmssd: 48,
        wristTempDeviation: 0.1,
        cEdaStressEvents: 0,
        walkingSteadiness: 'ok',
        dailySteps: 5200,
        sleepEfficiencyPercent: 88,
      }
    }
  },
  {
    id: 'garmin-venu',
    name: 'Garmin Venu 3 / Forerunner / Fenix',
    brand: 'Garmin Health API',
    category: 'smartwatch',
    badge: 'Multi-Day Battery',
    iconBg: 'bg-cyan-700 text-white',
    features: ['Pulse Ox Sensor', 'Continuous Heart Rate', 'Respiration Rate', 'Body Battery Telemetry'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 70,
      spo2: 98,
      respiratoryRate: 16,
      smartwatch: {
        ecgRhythm: 'normal_sinus',
        restingHeartRate: 66,
        walkingHeartRateAvg: 87,
        hrvRmssd: 49,
        wristTempDeviation: 0.1,
        cEdaStressEvents: 1,
        walkingSteadiness: 'ok',
        dailySteps: 4600,
        sleepEfficiencyPercent: 90,
      }
    }
  },
  {
    id: 'amazfit-watch',
    name: 'Amazfit Balance / GTR 4 / GTS 4',
    brand: 'Zepp Health Cloud',
    category: 'smartwatch',
    badge: 'Zepp OS',
    iconBg: 'bg-orange-600 text-white',
    features: ['BioTracker 5.0 PPG', '24H Blood Oxygen', 'Sleep Readiness & HRV', 'Body Composition'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 73,
      spo2: 98,
      temperature: 98.5,
      respiratoryRate: 16,
    }
  },
  {
    id: 'withings-scanwatch',
    name: 'Withings ScanWatch 2 / Horizon',
    brand: 'Withings Health Solutions',
    category: 'smartwatch',
    badge: 'Clinical 30-Day',
    iconBg: 'bg-slate-800 text-white',
    features: ['Medical Grade ECG', 'Blood Oxygen (SpO2)', 'TempTech 24/7 Baseline', 'AFib Tracking'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 68,
      spo2: 99,
      temperature: 98.4,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 78,
    }
  },
  {
    id: 'whoop-strap',
    name: 'Whoop 4.0 Health Strap',
    brand: 'Whoop Health Cloud',
    category: 'smartwatch',
    badge: 'Screenless',
    iconBg: 'bg-neutral-900 text-white',
    features: ['Skin Temperature', 'Resting Heart Rate & HRV', 'Blood Oxygen SpO2', 'Strain & Recovery Engine'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 65,
      spo2: 99,
      temperature: 98.2,
      respiratoryRate: 15,
    }
  },
  {
    id: 'oura-ring',
    name: 'Oura Ring Gen 3 / Gen 4 Horizon',
    brand: 'Oura Cloud Sync',
    category: 'ring',
    badge: 'Continuous 24/7',
    iconBg: 'bg-amber-600 text-white',
    features: ['Nocturnal HRV Analysis', 'Finger PPG Pulse & SpO2', 'Skin Temp Deviation', 'Sleep Readiness'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 66,
      spo2: 99,
      temperature: 98.2,
      smartRing: {
        fingerPpgHeartRate: 66,
        nocturnalHrv: 52,
        skinTemperatureCelsius: 36.8,
        skinTempDeviation: 0.1,
        sleepReadinessScore: 89,
        breathingDisturbancesPerHour: 1.1,
        deepSleepPercent: 22,
        remSleepPercent: 24,
        circadianAlignment: 'optimal',
      }
    }
  },
  {
    id: 'ultrahuman-ring',
    name: 'Ultrahuman Ring AIR',
    brand: 'Ultrahuman Health',
    category: 'ring',
    badge: 'Titanium Ring',
    iconBg: 'bg-indigo-700 text-white',
    features: ['Circadian Phase Tracking', 'Nocturnal Skin Temp', 'Continuous Resting HR', 'Sleep Index'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 67,
      spo2: 98,
      temperature: 98.3,
    }
  },
  {
    id: 'omron-cuff',
    name: 'Omron Evolv Upper Arm BP Cuff',
    brand: 'Omron Healthcare',
    category: 'blood_pressure_cuff',
    badge: 'Clinical Grade',
    iconBg: 'bg-emerald-700 text-white',
    features: ['Systolic / Diastolic Telemetry', 'Irregular Heartbeat Sensor', 'Mean Arterial Pressure (MAP)'],
    initialVitals: {
      timestamp: 'Just now',
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 76,
      bpCuff: {
        systolic: 118,
        diastolic: 76,
        meanArterialPressure: 90.0,
        pulsePressure: 42,
        cuffPulseRate: 68,
        irregularHeartbeatDetected: false,
        cuffFitStatus: 'proper_fit',
      }
    }
  },
  {
    id: 'dexcom-cgm',
    name: 'Dexcom G7 Continuous Glucose Monitor',
    brand: 'Dexcom Clarity Cloud',
    category: 'cgm_patch',
    badge: 'Real-time CGM',
    iconBg: 'bg-lime-700 text-white',
    features: ['Live Interstitial Glucose mg/dL', 'Rate of Change Trend Arrow', 'Hypo / Hyper Alert Window'],
    initialVitals: {
      timestamp: 'Just now',
      glucose: 108,
      cgm: {
        currentGlucose: 108,
        trendArrow: 'steady',
        timeInRangePercent: 96,
        timeBelowRangePercent: 0,
        timeAboveRangePercent: 4,
        glucoseManagementIndicator: 5.8,
        sensorDaysRemaining: 10,
        urgentLowPredictiveWarning: false,
      }
    }
  },
  {
    id: 'generic-ble',
    name: 'Direct Bluetooth Smart Sensor (BLE)',
    brand: 'Web Bluetooth API (0x180D)',
    category: 'smartwatch',
    badge: 'Live Sensor',
    iconBg: 'bg-purple-700 text-white',
    features: ['Live GATT Heart Rate Stream', 'Direct Browser-to-Device BLE', 'Polar / Garmin / Wahoo Straps'],
    initialVitals: {
      timestamp: 'Just now',
      heartRate: 75,
      spo2: 98,
    }
  }
];

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onDevicePaired: (device: WearableDevice, initialVitals: Partial<VitalsReading>) => void;
  onLoadDemoData?: () => void;
}

export function DevicePairingModal({
  isOpen,
  onClose,
  userName,
  onDevicePaired,
  onLoadDemoData,
}: DevicePairingModalProps) {
  // Navigation mode within modal: 'catalog' | 'custom' | 'bluetooth_scan'
  const [modalMode, setModalMode] = useState<'catalog' | 'custom' | 'bluetooth_scan'>('catalog');
  
  // Catalog selection & search
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(POPULAR_DEVICES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom device form inputs
  const [customName, setCustomName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customCategory, setCustomCategory] = useState<WearableCategory>('smartwatch');
  const [customSyncType, setCustomSyncType] = useState<'bluetooth' | 'health_connect' | 'cloud'>('bluetooth');
  const [customBaselineHr, setCustomBaselineHr] = useState('72');
  const [customBaselineSpo2, setCustomBaselineSpo2] = useState('98');

  // BLE Scan simulation state
  const [isScanningBLE, setIsScanningBLE] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<{ id: string; name: string; rssi: number; type: string }[]>([]);

  // Pairing animation & handshake state
  const [pairingStatus, setPairingStatus] = useState<'idle' | 'scanning' | 'handshake' | 'connected'>('idle');
  const [pairingProgress, setPairingProgress] = useState(0);
  const [activePairingTargetName, setActivePairingTargetName] = useState('');
  const [bleError, setBleError] = useState<string | null>(null);

  // Filtered devices based on search
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_DEVICES;
    const q = searchQuery.toLowerCase();
    return POPULAR_DEVICES.filter(
      d => d.name.toLowerCase().includes(q) || 
           d.brand.toLowerCase().includes(q) || 
           d.badge.toLowerCase().includes(q) ||
           d.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  // Complete pairing helper
  const finalizePairing = (device: WearableDevice, initialVitals: Partial<VitalsReading>) => {
    setPairingProgress(100);
    setPairingStatus('connected');
    setTimeout(() => {
      onDevicePaired(device, initialVitals);
      setPairingStatus('idle');
      onClose();
    }, 700);
  };

  // 1. Pair a Catalog Preset
  const handleStartCatalogPairing = () => {
    setActivePairingTargetName(selectedDevice.name);
    setPairingStatus('handshake');
    setPairingProgress(30);

    setTimeout(() => {
      setPairingProgress(65);
      setTimeout(() => {
        const newWearable: WearableDevice = {
          id: `dev-${Date.now()}`,
          name: selectedDevice.name,
          brand: selectedDevice.brand,
          category: selectedDevice.category,
          batteryPercent: 96,
          connected: true,
          macAddress: `BLE:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
          supportedMetrics: selectedDevice.features,
          lastSync: 'Just now',
        };
        finalizePairing(newWearable, selectedDevice.initialVitals);
      }, 600);
    }, 550);
  };

  // 2. Pair a Custom / Unlisted Device
  const handleCustomDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const deviceName = customName.trim();
    const deviceBrand = customBrand.trim() || 'Custom Bluetooth';
    const hr = parseInt(customBaselineHr, 10) || 72;
    const spo2 = parseInt(customBaselineSpo2, 10) || 98;

    setActivePairingTargetName(deviceName);
    setPairingStatus('handshake');
    setPairingProgress(35);

    setTimeout(() => {
      setPairingProgress(75);
      setTimeout(() => {
        const customWearable: WearableDevice = {
          id: `custom-dev-${Date.now()}`,
          name: deviceName,
          brand: deviceBrand,
          category: customCategory,
          batteryPercent: 100,
          connected: true,
          macAddress: `BLE:C0:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
          supportedMetrics: ['Heart Rate', 'Pulse SpO2', 'Step Tracking', 'Sleep Readiness'],
          lastSync: 'Just now',
        };

        const customVitals: Partial<VitalsReading> = {
          timestamp: 'Just now',
          heartRate: hr,
          spo2: spo2,
          bloodPressureSystolic: 120,
          bloodPressureDiastolic: 80,
          temperature: 98.4,
          fallDetected: false,
        };

        finalizePairing(customWearable, customVitals);
      }, 650);
    }, 500);
  };

  // 3. Scan for any nearby Bluetooth LE Devices
  const handleStartBLEScan = async () => {
    setIsScanningBLE(true);
    setBleError(null);
    setDiscoveredDevices([]);

    // Check if Web Bluetooth is natively supported in browser
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['heart_rate', 'battery_service', 'health_thermometer', 'blood_pressure']
        });

        setIsScanningBLE(false);
        setActivePairingTargetName(device.name || 'Bluetooth Health Monitor');
        setPairingStatus('handshake');
        setPairingProgress(50);

        setTimeout(() => {
          const newWearable: WearableDevice = {
            id: `ble-${Date.now()}`,
            name: device.name || 'Bluetooth Smart Device',
            brand: 'Web Bluetooth (GATT Direct)',
            category: 'smartwatch',
            batteryPercent: 100,
            connected: true,
            macAddress: 'BLE:FA:88:21:44:EE',
            supportedMetrics: ['Heart Rate', 'Continuous Pulse'],
            lastSync: 'Just now',
          };
          finalizePairing(newWearable, { timestamp: 'Just now', heartRate: 74, spo2: 98 });
        }, 700);
        return;
      } catch (err: any) {
        console.warn('Native Web Bluetooth prompt cancelled or not accessible:', err);
      }
    }

    // High-tech simulated BLE scan discovering realistic local health devices
    setTimeout(() => {
      setDiscoveredDevices([
        { id: 'ble_1', name: 'Smart Band HR-702', rssi: -58, type: 'Bluetooth Heart Rate' },
        { id: 'ble_2', name: 'Wireless Pulse Ox 4A', rssi: -64, type: 'SpO2 Sensor' },
        { id: 'ble_3', name: 'Health Watch BLE', rssi: -72, type: 'Fitness Tracker' },
      ]);
      setIsScanningBLE(false);
    }, 1200);
  };

  const handlePairDiscoveredBLE = (dev: { name: string; type: string }) => {
    setActivePairingTargetName(dev.name);
    setPairingStatus('handshake');
    setPairingProgress(40);

    setTimeout(() => {
      setPairingProgress(80);
      setTimeout(() => {
        const newWearable: WearableDevice = {
          id: `ble-${Date.now()}`,
          name: dev.name,
          brand: 'Bluetooth Smart BLE',
          category: 'smartwatch',
          batteryPercent: 95,
          connected: true,
          macAddress: `BLE:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:AA:BB`,
          supportedMetrics: ['Heart Rate', 'Activity', 'Pulse'],
          lastSync: 'Just now',
        };
        finalizePairing(newWearable, { timestamp: 'Just now', heartRate: 72, spo2: 98 });
      }, 600);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-800 to-teal-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-700/80 text-teal-200 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-teal-300" />
            <span>Device Setup &amp; Wearable Sync</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Pair Your Wearable Device
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-md">
            Welcome, <strong>{userName}</strong>! Select your device from the catalog, enter any unlisted watch, or scan nearby Bluetooth sensors.
          </p>
        </div>

        {/* Navigation Tabs */}
        {pairingStatus === 'idle' && (
          <div className="p-2 sm:p-2.5 bg-slate-100 border-b border-slate-200 flex gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setModalMode('catalog')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalMode === 'catalog'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>Device Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setModalMode('custom')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalMode === 'custom'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Other / Custom Device</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalMode('bluetooth_scan');
                if (discoveredDevices.length === 0) {
                  handleStartBLEScan();
                }
              }}
              className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                modalMode === 'bluetooth_scan'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bluetooth className="w-4 h-4 text-blue-600" />
              <span>Scan Bluetooth</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {bleError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{bleError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* PAIRING ACTIVE SCREEN                                    */}
          {/* ======================================================== */}
          {pairingStatus !== 'idle' ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-teal-50 border-2 border-teal-500/30 flex items-center justify-center text-teal-700 shadow-inner">
                {pairingStatus === 'connected' ? (
                  <Check className="w-10 h-10 text-emerald-600 stroke-[3]" />
                ) : (
                  <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {pairingStatus === 'connected'
                    ? 'Device Successfully Synced!'
                    : `Connecting to ${activePairingTargetName}...`}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {pairingStatus === 'connected'
                    ? 'Starting continuous live telemetry stream to KINOTE dashboard...'
                    : 'Establishing encrypted telemetry handshake & sensor subscription'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="max-w-xs mx-auto">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-300"
                    style={{ width: `${pairingProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Encrypted Handshake: {pairingProgress}%
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* ======================================================== */}
              {/* TAB 1: DEVICE CATALOG                                    */}
              {/* ======================================================== */}
              {modalMode === 'catalog' && (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search watch brand or model (Fitbit, Pixel, Amazfit, Withings, Garmin...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Device Not in List Callout Banner */}
                  <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>
                        Can't find your exact watch or model?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalMode('custom')}
                      className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer"
                    >
                      + Add Custom Device
                    </button>
                  </div>

                  {/* Catalog Cards Grid */}
                  {filteredDevices.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3 animate-in fade-in">
                      <div className="w-10 h-10 mx-auto rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Watch className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          &quot;{searchQuery}&quot; is not in our preset catalog
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                          Don't worry! KINOTE works with ANY smartwatch, fitness band, or BLE pulse sensor. You can pair it right now using one of the options below:
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomName(searchQuery);
                            setModalMode('custom');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add &quot;{searchQuery}&quot; as Custom Device</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalMode('bluetooth_scan');
                            handleStartBLEScan();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Bluetooth className="w-3.5 h-3.5" />
                          <span>Scan Over Bluetooth</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {filteredDevices.map((dev) => {
                        const isSelected = selectedDevice.id === dev.id;
                        return (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => setSelectedDevice(dev)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/30 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {dev.badge}
                                </span>
                                {isSelected && (
                                  <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start gap-2.5">
                                <div className={`w-8 h-8 rounded-xl ${dev.iconBg} flex items-center justify-center text-xs shrink-0 shadow-2xs`}>
                                  <Watch className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                                    {dev.name}
                                  </p>
                                  <p className="text-[10px] text-teal-700 font-medium truncate">
                                    {dev.brand}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                              {dev.features.slice(0, 2).map((feat, idx) => (
                                <span key={idx} className="text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                                  {feat}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: ADD OTHER / CUSTOM UNLISTED DEVICE                */}
              {/* ======================================================== */}
              {modalMode === 'custom' && (
                <form onSubmit={handleCustomDeviceSubmit} className="space-y-3.5 animate-in fade-in">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <p className="font-bold text-slate-900">Pair Any Brand or Unlisted Wearable</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Enter the name of your smartwatch, fitness tracker, ring, or medical cuff. KINOTE will configure an encrypted channel to receive live telemetry from it.
                    </p>
                  </div>

                  {/* Device Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Device Name / Model *</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Fitbit Charge 6, Amazfit Balance, Withings ScanWatch..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Brand & Category Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Brand / Manufacturer</label>
                      <input
                        type="text"
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="e.g. Fitbit, Huawei, Xiaomi, Coros"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Device Category</label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as WearableCategory)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 focus:bg-white transition-colors cursor-pointer"
                      >
                        <option value="smartwatch">Smartwatch / Fitness Tracker</option>
                        <option value="ring">Smart Ring</option>
                        <option value="blood_pressure_cuff">Blood Pressure Cuff</option>
                        <option value="cgm_patch">Continuous Glucose Monitor (CGM)</option>
                        <option value="pulse_oximeter">Pulse Oximeter</option>
                        <option value="medical_patch">Medical ECG / Chest Patch</option>
                        <option value="smart_scale">Smart Scale</option>
                        <option value="pendant_insole">Fall Detection Pendant / Insole</option>
                      </select>
                    </div>
                  </div>

                  {/* Connection Method */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Connection Method</label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setCustomSyncType('bluetooth')}
                        className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-colors ${
                          customSyncType === 'bluetooth'
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Bluetooth LE
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomSyncType('health_connect')}
                        className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-colors ${
                          customSyncType === 'health_connect'
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Health Connect
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomSyncType('cloud')}
                        className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-colors ${
                          customSyncType === 'cloud'
                            ? 'bg-teal-50 border-teal-600 text-teal-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Cloud API / Webhook
                      </button>
                    </div>
                  </div>

                  {/* Optional Baseline Readings */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Initial Baseline Readings (Optional):</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Heart Rate (BPM)</span>
                        <input
                          type="number"
                          value={customBaselineHr}
                          onChange={(e) => setCustomBaselineHr(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mt-0.5"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Blood Oxygen (SpO2 %)</span>
                        <input
                          type="number"
                          value={customBaselineSpo2}
                          onChange={(e) => setCustomBaselineSpo2(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mt-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Pair &amp; Connect {customName.trim() || 'Custom Device'}</span>
                  </button>
                </form>
              )}

              {/* ======================================================== */}
              {/* TAB 3: SCAN NEARBY BLUETOOTH (BLE)                       */}
              {/* ======================================================== */}
              {modalMode === 'bluetooth_scan' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                    <Bluetooth className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Nearby Bluetooth Sensor Discovery</p>
                      <p className="text-[11px] text-blue-800/80 mt-0.5">
                        KINOTE will discover any nearby Bluetooth device broadcasting Standard Health GATT services (Heart Rate 0x180D, Pulse Ox 0x1822, Thermometer 0x1809).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Discovered Bluetooth Devices:
                    </span>
                    <button
                      type="button"
                      onClick={handleStartBLEScan}
                      disabled={isScanningBLE}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningBLE ? 'animate-spin' : ''}`} />
                      <span>{isScanningBLE ? 'Scanning...' : 'Rescan'}</span>
                    </button>
                  </div>

                  {isScanningBLE ? (
                    <div className="py-8 text-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-800">Listening for Bluetooth Broadcasts...</p>
                      <p className="text-[11px] text-slate-500">Make sure your watch or sensor is turned on and in pairing mode.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {discoveredDevices.map((dev) => (
                        <div
                          key={dev.id}
                          className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Bluetooth className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{dev.name}</p>
                              <p className="text-[10px] text-slate-500">{dev.type} · Signal: {dev.rssi} dBm</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handlePairDiscoveredBLE(dev)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            Pair Device
                          </button>
                        </div>
                      ))}

                      {discoveredDevices.length === 0 && (
                        <div className="text-center py-6 text-slate-500 text-xs">
                          <p>No new Bluetooth broadcasts detected yet.</p>
                          <button
                            type="button"
                            onClick={() => setModalMode('custom')}
                            className="mt-2 text-teal-700 font-bold underline cursor-pointer"
                          >
                            Or enter device details manually ➔
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {pairingStatus === 'idle' && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            {onLoadDemoData ? (
              <button
                type="button"
                onClick={() => {
                  onLoadDemoData();
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer order-2 sm:order-1"
              >
                <TestTube className="w-3.5 h-3.5 text-teal-700" />
                <span>Explore with Sample Demo Data</span>
              </button>
            ) : <div className="order-2 sm:order-1" />}

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Skip for Now
              </button>

              {modalMode === 'catalog' && (
                <button
                  type="button"
                  onClick={handleStartCatalogPairing}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-md shadow-teal-900/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Pair {selectedDevice.name.split(' ')[0]}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
