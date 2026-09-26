export type UserRole = 
  | 'family_caregiver' 
  | 'senior_patient' 
  | 'attending_physician' 
  | 'compliance_officer' 
  | 'system_admin';

export type AlertSeverity = 'nominal' | 'warning' | 'critical';

export type WearableCategory = 
  | 'smartwatch' 
  | 'ring' 
  | 'blood_pressure_cuff' 
  | 'cgm_patch' 
  | 'medical_patch' 
  | 'pulse_oximeter' 
  | 'smart_scale' 
  | 'pendant_insole';

// Specialized Telemetry Streams by Wearable Category
export interface SmartwatchTelemetry {
  ecgRhythm: 'normal_sinus' | 'atrial_fibrillation' | 'inconclusive';
  restingHeartRate: number; // BPM
  walkingHeartRateAvg: number; // BPM
  hrvRmssd: number; // ms
  wristTempDeviation: number; // °F offset
  cEdaStressEvents: number; // count
  walkingSteadiness: 'ok' | 'low' | 'very_low';
  dailySteps: number;
  sleepEfficiencyPercent: number;
}

export interface SmartRingTelemetry {
  fingerPpgHeartRate: number; // BPM
  nocturnalHrv: number; // ms
  skinTemperatureCelsius: number; // °C
  skinTempDeviation: number; // °C
  sleepReadinessScore: number; // 0 - 100
  breathingDisturbancesPerHour: number;
  deepSleepPercent: number;
  remSleepPercent: number;
  circadianAlignment: 'optimal' | 'mild_drift' | 'delayed';
}

export interface BloodPressureCuffTelemetry {
  systolic: number; // mmHg
  diastolic: number; // mmHg
  meanArterialPressure: number; // MAP = (2*DBP + SBP)/3 mmHg
  pulsePressure: number; // SBP - DBP mmHg
  cuffPulseRate: number; // BPM
  irregularHeartbeatDetected: boolean;
  cuffFitStatus: 'proper_fit' | 'loose' | 'excessive_movement';
  valvularMurmurDetected?: boolean; // via digital stethoscope
}

export interface CGMTelemetry {
  currentGlucose: number; // mg/dL
  trendArrow: 'rising_fast' | 'rising' | 'steady' | 'falling' | 'falling_fast';
  timeInRangePercent: number; // 70-180 mg/dL target
  timeBelowRangePercent: number; // < 70 mg/dL (hypoglycemia risk)
  timeAboveRangePercent: number; // > 180 mg/dL (hyperglycemia risk)
  glucoseManagementIndicator: number; // GMI % (estimated HbA1c)
  sensorDaysRemaining: number;
  urgentLowPredictiveWarning: boolean;
}

export interface MedicalPatchTelemetry {
  continuous3LeadEcg: 'sinus' | 'pvc_detected' | 'pac_detected' | 'afib';
  pvcCountPerHour: number;
  thoracicBioimpedanceOhms: number; // Lung fluid retention / CHF edema index
  fluidRetentionStatus: 'nominal' | 'mild_fluid_accumulation' | 'severe_pulmonary_edema';
  coughFrequencyPerHour: number;
  coreBodyTemperature: number; // °F
  posturalTiltDegrees: number; // Angle relative to vertical
  bedboundHoursToday: number;
}

export interface PulseOximeterTelemetry {
  continuousSpo2: number; // % (1Hz sampling)
  oxygenDesaturationIndex: number; // ODI 4% dips / hr
  perfusionIndexPercent: number; // PI % (0.02% - 20%, blood flow strength)
  plethWaveformQuality: 'optimal' | 'marginal' | 'noisy';
  hypoxicEventsLogged: number;
  hapticAlarmTriggered: boolean;
}

export interface SmartScaleTelemetry {
  weightLbs: number;
  bmi: number;
  sixLeadEcg: 'normal' | 'borderline' | 'abnormal';
  pulseWaveVelocityMps: number; // PWV m/s (arterial stiffness)
  vascularAgeYears: number; // calculated relative to biological age
  sudomotorNerveScore: number; // electrochemical skin conductance (0-100, peripheral neuropathy)
  visceralFatRating: number; // 1-12
  extracellularWaterRatio: number; // % fluid retention warning
  skeletalMuscleMassLbs: number;
}

export interface PendantInsoleTelemetry {
  barometricAltitudeDropMeters: number; // sudden vertical drop >1.2m
  impactShockForceG: number; // impact vector force
  postImpactImmobilitySeconds: number; // lack of movement
  plantarPressureBalancePercent: { left: number; right: number }; // gait balance
  cadenceStepsPerMin: number;
  freezeOfGaitEvents: number; // Parkinson's shuffling / FOG
  sosButtonPressed: boolean;
  gpsCoordinates: { lat: number; lng: number; accuracyMeters: number };
}

export interface VitalsReading {
  timestamp: string;
  heartRate: number; // bpm
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  spo2: number; // percentage
  respiratoryRate: number; // breaths/min
  glucose?: number; // mg/dL
  temperature?: number; // °F
  fallDetected?: boolean;
  // Category-specific rich telemetry records
  smartwatch?: SmartwatchTelemetry;
  smartRing?: SmartRingTelemetry;
  bpCuff?: BloodPressureCuffTelemetry;
  cgm?: CGMTelemetry;
  medicalPatch?: MedicalPatchTelemetry;
  pulseOx?: PulseOximeterTelemetry;
  smartScale?: SmartScaleTelemetry;
  pendantInsole?: PendantInsoleTelemetry;
}

export type EMSDispatchMode = 
  | 'certified_monitoring' 
  | 'caregiver_guided' 
  | 'direct_psap';

export interface PatientLocation {
  label: string; // e.g. "Primary Residence - Oakwood Home", "Traveling / Sibling House"
  address: string;
  coordinates: { lat: number; lng: number };
  nearestPSAP: string;
  dispatchPreference: EMSDispatchMode;
}

export interface MetricThresholds {
  heartRate: {
    minWarn: number;
    maxWarn: number;
    minCritical: number;
    maxCritical: number;
    unit: string;
  };
  bloodPressureSystolic: {
    maxWarn: number;
    maxCritical: number;
    unit: string;
  };
  bloodPressureDiastolic: {
    maxWarn: number;
    maxCritical: number;
    unit: string;
  };
  bloodPressureMap: {
    minWarn: number;
    maxWarn: number;
    unit: string;
  };
  spo2: {
    minWarn: number;
    minCritical: number;
    unit: string;
  };
  respiratoryRate: {
    minWarn: number;
    maxWarn: number;
    minCritical: number;
    maxCritical: number;
    unit: string;
  };
  glucose: {
    urgentLow: number; // mg/dL (critical hypoglycemia)
    lowWarn: number; // mg/dL
    highWarn: number; // mg/dL
    severeHigh: number; // mg/dL (hyperglycemia)
    unit: string;
  };
  perfusionIndexMin: number; // % (minimum peripheral perfusion)
  thoracicBioimpedanceMinOhms: number; // fluid retention alert
  coughRatePerHourMax: number; // respiratory infection warning
  skinTempDeviationMaxF: number; // °F fever or hypothermia deviation
  fallDetectionEnabled: boolean;
  gracePeriodSeconds: number; // time before voice escalation
  voiceCallAutoDispatch: boolean;
  // Q1 & Q2 & Q3 specifics:
  voiceTriageSequence: 'patient_then_caregiver_then_conference';
  wearableSyncProtocol: 'hybrid_bridge' | 'direct_ble_medical';
  activeClinicalTemplate: 'standard' | 'afib' | 'copd' | 'hypertension' | 'diabetes_cardio' | 'custom';
  adaptiveCircadianBaseline: boolean;
  activeEmsMode: EMSDispatchMode;
}

export interface WearableDeviceMetricSpec {
  name: string;
  unit: string;
  samplingInterval: string;
  clinicalPurpose: string;
  lastValue: string | number;
  status: 'nominal' | 'warning' | 'critical';
}

export interface WearableDevice {
  id: string;
  name: string;
  brand: string;
  category: WearableCategory;
  batteryPercent: number;
  lastSync: string;
  connected: boolean;
  macAddress: string;
  supportedMetrics: string[];
  metricsSpecs?: WearableDeviceMetricSpec[];
  telemetrySummary?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  priorityOrder: number;
  notifyOnWarning: boolean;
  notifyOnCritical: boolean;
  receiveAIVoiceCall: boolean;
}

export interface AIVoiceCallLog {
  id: string;
  timestamp: string;
  recipientName: string;
  recipientPhone: string;
  triggerReason: string;
  durationSeconds: number;
  callStatus: 'completed' | 'in_progress' | 'unanswered' | 'escalated_to_911';
  patientResponded: boolean;
  patientSentiment: 'calm' | 'distressed' | 'unresponsive';
  transcription: string;
  dispatchDispatched: boolean;
  stageReached?: 'patient_voice_check' | 'caregiver_escalated' | 'ems_bridge';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT';
  ipAddress: string;
  sha256Hash: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content: string;
  category?: 'daily_summary' | 'device_status' | 'vitals_inquiry' | 'medication';
  actionableInsights?: string[];
}

export interface DailyMedicationAdherencePoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Mon"
  formattedDate: string; // e.g. "Sep 25"
  dayNumber: number; // 1 to 30
  adherenceRate: number; // 0 to 100 percentage
  totalScheduled: number;
  takenCount: number;
  missedCount: number;
  skippedCount: number;
  hasMissedDose: boolean;
  missedMedications: string[]; // names of medications missed
  notes?: string;
  morningAdherenceRate: number;
  eveningAdherenceRate: number;
}

export interface MissedDoseEvent {
  id: string;
  date: string;
  formattedDate: string;
  dayOfWeek: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  reason: string;
  impactDescription: string;
  actionTaken: string;
  vitalCorrelationNotes?: string;
}

export interface MedicationTrendInsight {
  id: string;
  title: string;
  severity: 'positive' | 'warning' | 'alert' | 'neutral';
  category: 'timing' | 'day_of_week' | 'medication_specific' | 'biometric_impact';
  description: string;
  recommendation: string;
  metricLabel: string;
  metricValue: string;
}

export interface Medication30DayReport {
  thirtyDayAdherenceRate: number;
  totalDosesTaken: number;
  totalDosesScheduled: number;
  totalDosesMissed: number;
  totalDosesSkipped: number;
  currentStreakDays: number;
  longestStreakDays: number;
  weekdayAdherenceRate: number;
  weekendAdherenceRate: number;
  morningAdherenceRate: number;
  eveningAdherenceRate: number;
  dailyPoints: DailyMedicationAdherencePoint[];
  missedDoseEvents: MissedDoseEvent[];
  perMedication30DayStats: {
    medicationId: string;
    name: string;
    colorTheme: string;
    adherenceRate: number;
    totalScheduled: number;
    takenCount: number;
    missedCount: number;
    skippedCount: number;
    timingCategory: string;
    commonMissCause?: string;
  }[];
  trendInsights: MedicationTrendInsight[];
}

export interface HistoricalVitalDay {
  date: string;
  dayLabel: string;
  formattedDate: string;
  avgHeartRate: number;
  minHeartRate: number;
  maxHeartRate: number;
  restingHeartRate: number;
  avgSpo2: number;
  minSpo2: number;
  maxSpo2: number;
  systolicBp: number;
  diastolicBp: number;
  glucoseAvg: number;
  status: 'optimal' | 'warning' | 'critical';
  notes: string;
  sourceDevice: string;
}

export interface HistoricalIntradayReading {
  id: string;
  timestamp: string;
  dayLabel: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  heartRate: number;
  spo2: number;
  activityContext: string;
  sensorSource: string;
  isSimulatedToday?: boolean;
}

export type HealthPeriodType = 'baseline' | 'concern' | 'exertion_recovery';

export interface HealthPeriodItem {
  id: string;
  title: string;
  type: HealthPeriodType;
  timestamp: string;
  dayLabel: string;
  timeRange: string;
  vitalsSummary: {
    heartRate: number;
    spo2: number;
    bloodPressure?: string;
    glucose?: number;
  };
  sensorAttribution: string;
  clinicalContext: string;
  actionTakenOrAdvised: string;
  severity: 'info' | 'caution' | 'critical';
}

export interface WeeklyOverviewReport {
  patientName: string;
  dateRange: string;
  overallStatus: 'stable' | 'attention_recommended' | 'critical_alert';
  riskScore: number; // 0-100
  baselineMetrics: {
    restingHrBand: string;
    daytimeSpo2Band: string;
    nocturnalDipNormal: string;
    bloodPressureBaseline: string;
    meanGlucoseBaseline: string;
  };
  observedAggregates: {
    meanHeartRate: number;
    minHeartRate: number;
    maxHeartRate: number;
    restingHeartRate: number;
    meanSpo2: number;
    minSpo2: number;
    timeInRangeSpo2Percent: number;
    meanBloodPressure: string;
    meanGlucose: number;
    sensorUptimePercent: number;
  };
  identifiedPeriods: HealthPeriodItem[];
  caregiverExecutiveSummary: string;
  clinicalSoapSummary: string;
  domainSummaries: {
    cardiovascular: string;
    oxygenation: string;
    metabolic: string;
    circadianSleep: string;
  };
  actionItems: {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'routine';
    isCompleted?: boolean;
  }[];
}

// Medication Management & Adherence Tracking Types
export type MedicationFrequency = 
  | 'once_daily' 
  | 'twice_daily' 
  | 'three_times_daily' 
  | 'as_needed' 
  | 'weekly';

export type MedicationDoseStatus = 
  | 'taken' 
  | 'due' 
  | 'upcoming' 
  | 'missed' 
  | 'skipped';

export interface MedicationReminderSettings {
  enabled: boolean;
  reminderTimes: string[]; // e.g. ["08:00 AM"]
  notificationChannels: {
    pushNotification: boolean;
    smsAlert: boolean;
    aiVoiceCallIfMissed: boolean;
    seniorSafeModeChime: boolean;
  };
  gracePeriodMinutes: number; // e.g. 45 mins before marked missed
}

export interface MedicationItem {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'patch';
  frequency: MedicationFrequency;
  timingCategory: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'with_meals';
  scheduledTimes: string[];
  prescribedFor: string;
  prescribingDoctor: string;
  rxNumber?: string;
  refillRemainingDays: number;
  pillsRemaining: number;
  instructions: string;
  colorTheme: string;
  reminders: MedicationReminderSettings;
  vitalMetricCorrelation?: 'heart_rate' | 'blood_pressure' | 'glucose' | 'spo2';
  createdAt: string;
}

export interface MedicationDoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  scheduledDate: string; // YYYY-MM-DD
  status: MedicationDoseStatus;
  loggedAt?: string;
  loggedBy?: 'patient' | 'caregiver' | 'smart_pill_dispenser' | 'ai_voice_confirmation';
  skipReason?: string;
  notes?: string;
}

export interface MedicationAdherenceSummary {
  overallAdherenceRate: number; // e.g. 96%
  sevenDayStreak: number;
  dosesTakenThisWeek: number;
  dosesTotalThisWeek: number;
  missedDosesCount: number;
  todayScheduledCount: number;
  todayTakenCount: number;
}

export interface MissedDoseNotification {
  id: string;
  timestamp: string;
  patientName: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
  reason?: string;
  severity: 'high' | 'critical';
  channels: ('push' | 'sms' | 'chime')[];
  acknowledged?: boolean;
}

// User Authentication & Session Types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  authMethod: 'email' | 'phone_otp' | 'biometric' | 'senior_pin';
  avatar?: string;
  lastLogin: string;
}

// Membership & Billing Types
export type MembershipPlanType = 'family_basic' | 'caregiver_plus' | 'clinical_concierge';

export interface MembershipDetails {
  planType: MembershipPlanType;
  planName: string;
  status: 'active' | 'grace_period' | 'past_due' | 'trial';
  renewalDate: string;
  daysRemaining: number;
  billingCycle: 'monthly' | 'annual';
  priceFormatted: string;
  maxSeniors: number;
  currentSeniorsCount: number;
  features: {
    aiVoiceMinutesTotal: number;
    aiVoiceMinutesUsed: number;
    cellularEsimActive: boolean;
    rechartsAnalytics30Day: boolean;
    multiCaregiverSharing: boolean;
    emsDirectBridge247: boolean;
    unlimitedWearablesSync: boolean;
  };
  paymentMethod: {
    brand: 'visa' | 'mastercard' | 'amex';
    last4: string;
    expMonth: number;
    expYear: number;
  };
  invoices: {
    id: string;
    date: string;
    amount: string;
    status: 'paid' | 'pending';
  }[];
}

// Multi-Patient Monitoring & Profile Isolation Types
export interface PatientProfile {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  roomOrUnit: string;
  primaryCondition: string;
  avatarBg: string;
  location: PatientLocation;
  vitals: VitalsReading;
  thresholds: MetricThresholds;
  medications: MedicationItem[];
  doseLogs: MedicationDoseLog[];
  devices: WearableDevice[];
  emergencyContacts: EmergencyContact[];
}


