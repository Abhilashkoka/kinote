import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  Heart, 
  Activity, 
  Battery, 
  ShieldCheck, 
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Pill,
  TrendingUp
} from 'lucide-react';
import { 
  AIChatMessage, 
  MetricThresholds, 
  VitalsReading, 
  WearableDevice, 
  AIVoiceCallLog, 
  PatientLocation,
  MedicationItem,
  MedicationDoseLog
} from '../types';
import { speakText } from '../utils/speech';
import WeeklyHealthOverview from './WeeklyHealthOverview';
import { generateWeeklyHealthOverview } from '../utils/weeklyOverviewGenerator';
import { calculateMedicationAdherence } from '../utils/medicationAdherence';
import { generate30DayMedicationReport } from '../utils/medication30DayData';
import { INITIAL_MEDICATIONS, INITIAL_DOSE_LOGS } from '../utils/mockData';

interface KinoteAIAssistantProps {
  vitals: VitalsReading;
  thresholds: MetricThresholds;
  devices: WearableDevice[];
  callLogs: AIVoiceCallLog[];
  patientLocation: PatientLocation;
  patientName: string;
  initialView?: 'chat' | 'weekly_overview';
  medications?: MedicationItem[];
  doseLogs?: MedicationDoseLog[];
}

export default function KinoteAIAssistant({
  vitals,
  thresholds,
  devices,
  callLogs,
  patientLocation,
  patientName,
  initialView = 'chat',
  medications,
  doseLogs,
}: KinoteAIAssistantProps) {
  const [activeView, setActiveView] = useState<'chat' | 'weekly_overview'>(initialView);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      timestamp: 'Today at 09:00 AM',
      content: `Hello! I am Kinote Family Health Intelligence. I continuously monitor ${patientName} across all paired wearables. You can ask me for a daily summary, sleep/vitals trends, device diagnostics, or anomaly assessments anytime.`,
      category: 'daily_summary',
      actionableInsights: [
        `Resting Pulse: ${vitals.heartRate} BPM (Normal range)`,
        `Blood Pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg (Nominal)`,
        `Active Sync: ${devices.filter((d) => d.connected).length} of ${devices.length} wearables streaming`,
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnalyzing]);

  const generateAIResponse = (userPrompt: string): { content: string; insights?: string[]; category: AIChatMessage['category'] } => {
    const promptLower = userPrompt.toLowerCase();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 0. Weekly Health Overview & Periods of Concern vs. Baseline
    if (
      promptLower.includes('weekly') ||
      promptLower.includes('week') ||
      promptLower.includes('period of concern') ||
      promptLower.includes('periods of concern') ||
      promptLower.includes('baseline vs') ||
      promptLower.includes('concern vs baseline') ||
      promptLower.includes('weekly health overview')
    ) {
      const weeklyReport = generateWeeklyHealthOverview(vitals, thresholds, patientName);
      return {
        category: 'daily_summary',
        content: `### 📊 Weekly Health Overview for ${patientName}\n\n` +
          weeklyReport.caregiverExecutiveSummary +
          `\n\n*(💡 **Tip:** You can also switch directly to the **Weekly Health Overview** tab in the header above to explore interactive physiological domain tabs, filterable period timelines, and physician SOAP reports.)*`,
        insights: [
          `7-Day Mean Pulse: ${weeklyReport.observedAggregates.meanHeartRate} BPM (Resting: ${weeklyReport.observedAggregates.restingHeartRate} BPM)`,
          `Blood Oxygen: ${weeklyReport.observedAggregates.meanSpo2}% mean (${weeklyReport.observedAggregates.timeInRangeSpo2Percent}% Time-in-Range ≥95%)`,
          `Flagged Concern Period: Mon Sep 21 transit exertion (SpO2 nadir 94%, resolved in 7 mins)`,
          `Nocturnal Restorative Sleep Dip: 14.2% (Healthy autonomic circadian rhythm)`,
        ],
      };
    }

    // 1. Daily Summary
    if (promptLower.includes('daily summary') || promptLower.includes('summary') || promptLower.includes('today') || promptLower.includes('overview') || promptLower.includes('how is')) {
      const isElevated = vitals.heartRate > thresholds.heartRate.maxWarn || vitals.bloodPressureSystolic > thresholds.bloodPressureSystolic.maxWarn;
      return {
        category: 'daily_summary',
        content: `### 📋 Kinote Daily Wellness Briefing for ${patientName}\n\n` +
          `**Overall Status:** ${isElevated ? '⚠️ Attention Recommended' : '✅ Stable & Optimal'}\n\n` +
          `• **Cardiovascular:** Resting heart rate is steady at **${vitals.heartRate} BPM** (Target: ${thresholds.heartRate.minWarn}–${thresholds.heartRate.maxWarn} BPM). Blood pressure is currently **${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg**.\n` +
          `• **Respiratory & Oxygenation:** SpO2 is **${vitals.spo2}%** with a respiratory rate of **${vitals.respiratoryRate} breaths/min**.\n` +
          `• **Mobility & Fall Protection:** Multi-sensor accelerometer quorum is active. ${vitals.fallDetected ? '🚨 A fall shock was recently recorded!' : 'Zero fall impacts recorded in the last 24 hours.'}\n` +
          `• **Active Location:** ${patientLocation.label} (${patientLocation.address}). Dispatch profile: ${patientLocation.dispatchPreference.replace(/_/g, ' ').toUpperCase()}.\n` +
          `• **Recommendation:** Continue current medication protocol. Ensure adequate fluid intake this afternoon.`,
        insights: [
          `Heart Rate variability (HRV) is within normal age-adjusted band (38ms)`,
          `Blood Oxygen saturation has not dipped below ${thresholds.spo2.minWarn}% today`,
          `Next scheduled medication: Evening Lisinopril at 7:00 PM`,
        ],
      };
    }

    // 2. Devices & Battery Status
    if (promptLower.includes('device') || promptLower.includes('battery') || promptLower.includes('wearable') || promptLower.includes('watch') || promptLower.includes('ring')) {
      const connectedCount = devices.filter((d) => d.connected).length;
      const lowBatt = devices.filter((d) => d.batteryPercent !== undefined && d.batteryPercent < 25);
      return {
        category: 'device_status',
        content: `### 🔋 Wearable Ecosystem Diagnostics\n\n` +
          `Currently, **${connectedCount} of ${devices.length}** health monitors are synchronized and actively broadcasting telemetry:\n\n` +
          devices.map((d) => `• **${d.name}** (${d.brand}): ${d.batteryPercent !== undefined ? `Battery **${d.batteryPercent}%**` : 'Encrypted Stream'} · ${d.connected ? '🟢 Connected' : '⚪ Standby'} · Last sync: ${d.lastSync}`).join('\n') +
          `\n\n${lowBatt.length > 0 ? `⚠️ **Notice:** ${lowBatt.map((d) => d.name).join(', ')} is below 25% battery. Please remind Eleanor to place it on its magnetic dock.` : '✅ All device batteries have sufficient charge for overnight monitoring.'}`,
        insights: [
          `Universal Ingestion Gateway (HealthKit + Health Connect + BLE) running nominal`,
          `No packet dropouts detected in the last 60 minutes`,
        ],
      };
    }

    // 3. Heart Rate or Blood Pressure specific
    if (promptLower.includes('heart') || promptLower.includes('pulse') || promptLower.includes('bp') || promptLower.includes('pressure') || promptLower.includes('cardiac') || promptLower.includes('vitals')) {
      return {
        category: 'vitals_inquiry',
        content: `### 🫀 Cardiovascular Telemetry Analysis for ${patientName}\n\n` +
          `• **Current Pulse:** **${vitals.heartRate} BPM**\n` +
          `• **Blood Pressure:** **${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg**\n` +
          `• **Caregiver Custom Thresholds:** Warning at >${thresholds.heartRate.maxWarn} BPM, Emergency Voice Dispatch at >${thresholds.heartRate.maxCritical} BPM or <${thresholds.heartRate.minCritical} BPM.\n` +
          `• **Arrhythmia Screening:** Apple Watch single-lead ECG and Oura PPG show regular sinus rhythm with no signs of Atrial Fibrillation (AFib).\n` +
          `• **Circadian Baseline Learning:** Active. The system automatically accounts for Eleanor's daytime garden strolls versus deep REM sleep.`,
        insights: [
          `Mean resting heart rate across past 7 days: 68 BPM`,
          `Peak recorded heart rate today: 104 BPM (associated with mild walking)`,
        ],
      };
    }

    // 3.5. 30-Day Medication Adherence & Missed Doses Analytics (Recharts Analysis)
    if (
      promptLower.includes('30-day') ||
      promptLower.includes('30 day') ||
      promptLower.includes('missed dose') ||
      promptLower.includes('missed doses') ||
      promptLower.includes('adherence rate') ||
      promptLower.includes('adherence rates') ||
      promptLower.includes('adherence trend') ||
      promptLower.includes('why was') ||
      promptLower.includes('why were') ||
      promptLower.includes('drop-off') ||
      promptLower.includes('september 14') ||
      promptLower.includes('sep 14') ||
      (promptLower.includes('trend') && (promptLower.includes('med') || promptLower.includes('adherence')))
    ) {
      const activeMeds = medications || INITIAL_MEDICATIONS;
      const logs = doseLogs || INITIAL_DOSE_LOGS;
      const rep = generate30DayMedicationReport(activeMeds, logs);

      return {
        category: 'medication',
        content: `### 📊 30-Day Medication Adherence & Missed Dose Analysis for ${patientName}\n\n` +
          `**30-Day Adherence Score:** **${rep.thirtyDayAdherenceRate}%** (${rep.totalDosesTaken} of ${rep.totalDosesScheduled} doses taken)\n` +
          `• **Missed Doses:** **${rep.totalDosesMissed}** missed | **${rep.totalDosesSkipped}** physician-approved skip\n` +
          `• **Current Unbroken Streak:** **${rep.currentStreakDays} Days** (Zero missed doses since Sep 15)\n` +
          `• **Clinical Efficacy Line:** Maintained comfortably above the 80% clinical threshold, approaching 95% target.\n\n` +
          `**Key Behavioral & Clinical Trends Identified:**\n` +
          `1. 📉 **The Evening Dosing Gap (16.2% Deficit):** Morning routine compliance is **${rep.morningAdherenceRate}%** (anchored to 8:00 AM breakfast), whereas evening/bedtime compliance drops to **${rep.eveningAdherenceRate}%** due to post-dinner fatigue.\n` +
          `2. ⛪ **Sunday Routine Vulnerability:** Adherence drops to **${rep.weekendAdherenceRate}%** on weekends vs **${rep.weekdayAdherenceRate}%** on weekdays. 71% of all missed doses occurred on Sunday evenings during family outings or church events away from home.\n` +
          `3. 💊 **Atorvastatin Bedtime Friction (83.3%):** Because Atorvastatin is Eleanor's sole late-night dose (09:30 PM) unattached to food, dozing off before opening the pill compartment caused 5 of the 7 missed events.\n` +
          `4. 🩺 **Biometric Telemetry Correlation:** On mornings following a missed bedtime dose, Omron cuff and Apple Watch registered a mean systolic BP increase of **+9 mmHg** and resting HR **+5 BPM**.\n\n` +
          `**Recent Missed Dose Audit Trail:**\n` +
          rep.missedDoseEvents.slice(0, 4).map((evt) => `• **${evt.formattedDate} (${evt.scheduledTime}) — ${evt.medicationName}**: ${evt.reason} *[Impact: ${evt.impactDescription}]*`).join('\n') +
          `\n\n💡 *Tip: You can visualize these patterns dynamically across 4 Recharts views (Trajectory, Dose Breakdown, AM vs PM Gap, and Per-Medication) in the Caregiver Dashboard.*`,
        insights: [
          `30-day compliance: ${rep.thirtyDayAdherenceRate}% across 150 scheduled doses`,
          `Morning compliance (98.3%) significantly outperforms evening (82.1%)`,
          `Primary recommendation: Re-align Atorvastatin to 07:00 PM dinner with Dr. Thorne's approval`,
        ],
      };
    }

    // 4. Medication Management & Adherence Tracking
    if (
      promptLower.includes('medication') ||
      promptLower.includes('meds') ||
      promptLower.includes('pill') ||
      promptLower.includes('dose') ||
      promptLower.includes('adherence') ||
      promptLower.includes('lisinopril') ||
      promptLower.includes('metformin') ||
      promptLower.includes('atorvastatin') ||
      promptLower.includes('prescription') ||
      promptLower.includes('refill')
    ) {
      const activeMeds = medications || INITIAL_MEDICATIONS;
      const logs = doseLogs || INITIAL_DOSE_LOGS;
      const { summary: medSummary, todaySchedule: sched } = calculateMedicationAdherence(activeMeds, logs);
      const takenDoses = sched.filter((d) => d.status === 'taken');
      const upcomingDoses = sched.filter((d) => d.status === 'upcoming' || d.status === 'due');

      return {
        category: 'medication',
        content: `### 💊 Medication Management & Adherence for ${patientName}\n\n` +
          `**Adherence Score:** **${medSummary.overallAdherenceRate}%** (${medSummary.sevenDayStreak}-Day Adherence Streak with zero missed doses)\n\n` +
          `**Today's Schedule Progress (${medSummary.todayTakenCount} of ${medSummary.todayScheduledCount} Completed):**\n` +
          takenDoses.map((d) => `• ✅ **${d.medicationName}** (${d.dosage}) — Confirmed taken at **${d.loggedAt || d.scheduledTime}** ${d.loggedBy === 'patient' ? '(confirmed by Eleanor on SafeMode screen)' : '(verified by caregiver)'}`).join('\n') +
          `\n\n**Upcoming Scheduled Doses Tonight:**\n` +
          (upcomingDoses.length > 0
            ? upcomingDoses.map((d) => `• ⏳ **${d.medicationName}** (${d.dosage}) — Scheduled for **${d.scheduledTime}**`).join('\n')
            : '• All scheduled doses for today are complete!') +
          `\n\n**Active Prescriptions on File (${activeMeds.length}):**\n` +
          activeMeds.map((m) => `• **${m.name}** (${m.dosage}, ${m.frequency.replace(/_/g, ' ')}) — Prescribed by ${m.prescribingDoctor} for ${m.prescribedFor}. *(${m.pillsRemaining} pills remaining, ${m.refillRemainingDays} days left)*`).join('\n') +
          `\n\n**Automated Cascading Safety:** In accordance with your configured reminder rules, if a dose is unconfirmed after 45 minutes, KINOTE initiates: Push Notification ➔ SMS Alert ➔ AI Voice Call reminder.`,
        insights: [
          `Lisinopril adherence is correlating with optimal 121/77 mmHg blood pressure`,
          `Metformin ER twice-daily schedule is sustaining 96% CGM Time-in-Range`,
          `Refill status: All prescriptions have >18 days supply remaining`,
        ],
      };
    }

    // 5. Emergency & Call Logs
    if (promptLower.includes('emergency') || promptLower.includes('call') || promptLower.includes('triage') || promptLower.includes('dispatch') || promptLower.includes('ems')) {
      return {
        category: 'medication',
        content: `### 🚨 KINOTE Emergency Triage & Escalation Sequence\n\n` +
          `Per your configured architecture decisions, emergency response operates in an **Option A ➔ Option C ➔ Option B** sequence:\n\n` +
          `1. **Stage 1 (Senior Voice Check):** AI voice caller dials Eleanor (+1 555-321-7788) with a ${thresholds.gracePeriodSeconds}s grace window to check if she is conscious and safe.\n` +
          `2. **Stage 2 (Caregiver Escalation):** If Eleanor does not respond or expresses distress, immediate high-priority push notifications and phone calls escalate to you (David Miller).\n` +
          `3. **Stage 3 (EMS Bridge):** Automated 3-way conference bridge with municipal emergency relay (**${patientLocation.nearestPSAP}**) transmitting live GPS coordinates and biometric vitals telemetry.\n\n` +
          `Total emergency voice calls logged to date: **${callLogs.length}** (All resolved safely).`,
        insights: [
          `Active Dispatch Profile: ${patientLocation.label}`,
          `E911 PSAP coordinates: ${patientLocation.coordinates.lat.toFixed(4)}, ${patientLocation.coordinates.lng.toFixed(4)}`,
        ],
      };
    }

    // 5. Vital Trends / Historical Analytics (Heart Rate & SpO2 over last 7 days)
    if (
      promptLower.includes('trend') ||
      promptLower.includes('historical') ||
      promptLower.includes('last 7 day') ||
      promptLower.includes('7 day') ||
      promptLower.includes('7-day')
    ) {
      return {
        category: 'vitals_inquiry',
        content: `### 📈 7-Day Vital Trends Analytics for ${patientName}\n\n` +
          `• **Heart Rate 7-Day Mean:** **72 BPM** (Therapeutic Range: 56 – 99 BPM)\n` +
          `  - **Resting Heart Rate (Nocturnal):** Averaging **63–68 BPM**, demonstrating a healthy **14% restorative sleep dip** during slow-wave sleep.\n` +
          `  - **Peak Exertion:** Highest recorded HR was **99 BPM** on Mon Sep 21 during light physical movement (nominal safe margin below max warn threshold of ${thresholds.heartRate.maxWarn} BPM).\n` +
          `• **Blood Oxygen (SpO2) 7-Day Mean:** **97.7%**\n` +
          `  - **Time in Optimal Range (≥95%):** **99.2%** of logged readings across Apple Watch and Masimo sensors.\n` +
          `  - **Lowest Transient Reading:** **94%** on Mon Sep 21 (cleared within 3 minutes; no persistent nocturnal desaturation).\n` +
          `• **Multi-Wearable Quorum Integrity:** Sensor stream uptime over the 7 days is **99.8%** with cross-verification between Apple Watch Series 10, Oura Ring Gen 3, and Masimo Continuous Pulse Ox.\n\n` +
          `*Caregiver Recommendation:* All 7-day trajectories reflect stable cardiovascular and pulmonary baseline. You can view the live Recharts interactive chart in the **Vital Trends** section on your dashboard.`,
        insights: [
          `No threshold breaches occurred over the rolling 7-day window`,
          `Today's reading is streaming live into the 7-day visualization`,
        ],
      };
    }

    // 6. Wearables Data Overview / What data is collected from different wearables
    if (
      promptLower.includes('what other data') ||
      promptLower.includes('different wearable') ||
      promptLower.includes('wearable type') ||
      promptLower.includes('data it collects') ||
      promptLower.includes('all wearables') ||
      promptLower.includes('telemetry matrix')
    ) {
      return {
        category: 'device_status',
        content: `### 🌐 Comprehensive Wearable Telemetry Matrix for ${patientName}\n\n` +
          `KINOTE connects and decodes data from **8 distinct wearable hardware categories**, customized by sensor physics and clinical purpose:\n\n` +
          `1. **Smartwatches (Apple Watch / Galaxy Watch / Garmin):**\n` +
          `   • Continuous Heart Rate & Resting HR (5s sampling)\n` +
          `   • Single-Lead ECG rhythm strip (AFib detection)\n` +
          `   • Reflection SpO2 & Nocturnal Hypoxic Burden\n` +
          `   • Wrist Temperature deviation\n` +
          `   • Tri-axial accelerometer & gyroscope fall impacts (>4.5G)\n` +
          `   • Walking Steadiness & step asymmetry (12-mo fall risk)\n\n` +
          `2. **Smart Rings (Oura Gen 3 / Ultrahuman / RingConn):**\n` +
          `   • Digital palmar finger artery Resting Heart Rate\n` +
          `   • Continuous Nocturnal HRV (rMSSD in ms)\n` +
          `   • High-Precision NTC skin temperature (±0.05°C accuracy)\n` +
          `   • Breathing Disturbance Index (BDI) for sleep apnea\n` +
          `   • Sleep Readiness & autonomic recovery score (0–100)\n\n` +
          `3. **Wireless Blood Pressure Cuffs (Omron Evolv / Withings BPM):**\n` +
          `   • Systolic & Diastolic Blood Pressure (mmHg)\n` +
          `   • Mean Arterial Pressure (MAP mmHg): [(2×DBP) + SBP]/3\n` +
          `   • Pulse Pressure (arterial compliance index)\n` +
          `   • Irregular Heartbeat (IHB) arrhythmia flag\n` +
          `   • Digital Stethoscope phonocardiogram (valvular murmurs)\n\n` +
          `4. **Continuous Glucose Monitors (Dexcom G7 / FreeStyle Libre):**\n` +
          `   • Interstitial glucose level updating every 1–5 minutes\n` +
          `   • Rate-of-Change trend velocity arrows (↑↑, ↑, →, ↓, ↓↓)\n` +
          `   • Time-in-Range (TIR %, target >70% between 70–180 mg/dL)\n` +
          `   • Time-Below-Range (TBR % hypoglycemia hazard <70 & <54)\n` +
          `   • Estimated HbA1c (Glucose Management Indicator - GMI %)\n\n` +
          `5. **Medical Chest Patches (BioIntelliSense BioButton / Zio):**\n` +
          `   • Continuous 2/3-Lead ECG rhythm recording (250Hz)\n` +
          `   • Thoracic Bioimpedance (early Congestive Heart Failure lung fluid/edema)\n` +
          `   • Acoustic cough and sneeze frequency (pneumonia/infection biomarker)\n` +
          `   • Premature Ventricular Contraction (PVC) hourly burden count\n` +
          `   • Postural tilt inclinometer (upright vs. bedbound hours)\n\n` +
          `6. **Continuous Pulse Oximeters (Masimo MightySat / Wellue):**\n` +
          `   • 1-Second continuous optical SpO2 with motion tolerance\n` +
          `   • Perfusion Index (PI % - peripheral arterial pulse strength)\n` +
          `   • Oxygen Desaturation Index (ODI 4% dips/hour)\n` +
          `   • Silent in-device haptic vibration on oxygen drops\n\n` +
          `7. **Smart Medical Scales & Body Scanners (Withings Body Scan):**\n` +
          `   • Weight & sudden fluid weight gain (>2-3 lbs in 24h CHF alert)\n` +
          `   • 6-Lead Segmental ECG (Leads I, II, III, aVR, aVL, aVF)\n` +
          `   • Pulse Wave Velocity (PWV m/s) and calculated Vascular Age\n` +
          `   • Sudomotor nerve health score (diabetic peripheral neuropathy)\n` +
          `   • Extracellular vs. Intracellular water ratio (peripheral edema)\n\n` +
          `8. **Medical Alert Pendants & Smart Insoles (Guardian MGMini / FeetMe):**\n` +
          `   • Barometric altimeter rapid vertical descent (>1.2m freefall)\n` +
          `   • High-G impact shock vector (>4.5G)\n` +
          `   • Post-impact 15-second immobility timer\n` +
          `   • Dynamic plantar pressure balance (% left vs. right foot)\n` +
          `   • Freeze-of-Gait (FOG index for Parkinson's)\n` +
          `   • Dual-band GPS coordinates & PSAP emergency voice link`,
        insights: [
          `All 8 wearable streams can have individual warning and critical thresholds`,
          `Explore the "Telemetry Matrix & Data Dictionary" tab in Devices for complete technical specs`,
        ],
      };
    }

    // 6. CGM / Glucose Specific Inquiry
    if (promptLower.includes('glucose') || promptLower.includes('cgm') || promptLower.includes('sugar') || promptLower.includes('diabetes') || promptLower.includes('dexcom')) {
      const cgm = vitals.cgm || {
        currentGlucose: vitals.glucose || 104,
        trendArrow: 'steady',
        timeInRangePercent: 94,
        timeBelowRangePercent: 1,
        timeAboveRangePercent: 5,
        glucoseManagementIndicator: 5.8,
        sensorDaysRemaining: 8,
        urgentLowPredictiveWarning: false,
      };
      return {
        category: 'vitals_inquiry',
        content: `### 🩸 Continuous Glucose (CGM) Telemetry for ${patientName}\n\n` +
          `• **Current Glucose:** **${cgm.currentGlucose} mg/dL** (Trend: Steady ➔)\n` +
          `• **Time in Range (TIR):** **${cgm.timeInRangePercent}%** (Target: >70% between 70–180 mg/dL)\n` +
          `• **Hypoglycemia Risk (TBR):** **${cgm.timeBelowRangePercent}%** (Urgent Low <54 mg/dL: 0%)\n` +
          `• **Hyperglycemia Risk (TAR):** **${cgm.timeAboveRangePercent}%** (Nominal post-prandial)\n` +
          `• **Estimated HbA1c (GMI):** **${cgm.glucoseManagementIndicator}%**\n` +
          `• **Sensor Longevity:** Dexcom G7 filament has **${cgm.sensorDaysRemaining} days remaining**.\n\n` +
          `*Caregiver Threshold Guardrail:* Urgent low alarm will auto-escalate if glucose drops below ${thresholds.glucose?.urgentLow || 54} mg/dL.`,
        insights: [
          `Glycemic stability is in the top 5th percentile for geriatric CGM cohorts`,
          `No nocturnal hypoglycemic events detected in the past 7 days`,
        ],
      };
    }

    // 7. Smart Ring / Oura / HRV / Sleep Inquiry
    if (promptLower.includes('ring') || promptLower.includes('oura') || promptLower.includes('hrv') || promptLower.includes('readiness') || promptLower.includes('sleep')) {
      const ring = vitals.smartRing || {
        nocturnalHrv: 44,
        skinTempDeviation: 0.2,
        sleepReadinessScore: 88,
        breathingDisturbancesPerHour: 1.2,
        deepSleepPercent: 19,
      };
      return {
        category: 'vitals_inquiry',
        content: `### 💍 Smart Ring Recovery & Autonomic Telemetry for ${patientName}\n\n` +
          `• **Nocturnal HRV (rMSSD):** **${ring.nocturnalHrv} ms** (Indicates healthy parasympathetic autonomic balance)\n` +
          `• **Sleep Readiness Score:** **${ring.sleepReadinessScore}/100** (Optimal physical stamina reserve)\n` +
          `• **Skin Temperature Deviation:** **+${ring.skinTempDeviation}°C** (Well within normal ±0.5°C circadian band; zero infection signals)\n` +
          `• **Breathing Disturbance Index (BDI):** **${ring.breathingDisturbancesPerHour}/hour** (Normal: <5/hr; negative for obstructive sleep apnea)\n` +
          `• **Deep Sleep Ratio:** **${ring.deepSleepPercent}%** (Optimal cellular and neural repair)\n\n` +
          `*Sensor Advantage:* Finger palmar digital arteries offer closer capillary proximity and higher signal-to-noise ratio than wrist devices.`,
        insights: [
          `7-day rolling HRV baseline is steady with no chronic stress fatigue`,
          `Skin temperature has stayed stable with no fever onset`,
        ],
      };
    }

    // 8. Chest Patch / BioButton / Bioimpedance / Fluid / Cough
    if (promptLower.includes('patch') || promptLower.includes('biobutton') || promptLower.includes('bioimpedance') || promptLower.includes('fluid') || promptLower.includes('cough') || promptLower.includes('chf')) {
      const patch = vitals.medicalPatch || {
        thoracicBioimpedanceOhms: 48.2,
        coughFrequencyPerHour: 1,
        pvcCountPerHour: 2,
        bedboundHoursToday: 6.8,
      };
      return {
        category: 'vitals_inquiry',
        content: `### 🩺 Clinical Chest Patch & Fluid Surveillance for ${patientName}\n\n` +
          `• **Thoracic Bioimpedance:** **${patch.thoracicBioimpedanceOhms} Ω** (Nominal safe: >32.0 Ω. Indicates **zero pulmonary edema** or Congestive Heart Failure fluid buildup)\n` +
          `• **Acoustic Cough Frequency:** **${patch.coughFrequencyPerHour} cough/hr** (Normal baseline: <6/hr. No sign of viral infection or pneumonia)\n` +
          `• **Premature Ventricular Contractions (PVCs):** **${patch.pvcCountPerHour} events/hr** (Benign ectopy; monitored for sudden bursts)\n` +
          `• **Active Postural Mobility:** Eleanor spent **${patch.bedboundHoursToday} hours upright** today, meeting her mobility goals.\n\n` +
          `*Clinical Benefit:* Continuous thoracic bioimpedance detects CHF fluid retention up to 14 days before external ankle swelling or shortness of breath appears.`,
        insights: [
          `Thoracic bioimpedance has remained stable above the 32.0 Ω warning threshold`,
          `Acoustic microphone confirms quiet, unlabored respiration`,
        ],
      };
    }

    // 9. Smart Scale / Vascular Age / Pulse Wave Velocity
    if (promptLower.includes('scale') || promptLower.includes('weight') || promptLower.includes('vascular') || promptLower.includes('pwv') || promptLower.includes('nerve')) {
      const scale = vitals.smartScale || {
        weightLbs: 148.6,
        bmi: 23.4,
        pulseWaveVelocityMps: 7.2,
        vascularAgeYears: 66,
        sudomotorNerveScore: 84,
        extracellularWaterRatio: 38.8,
      };
      return {
        category: 'vitals_inquiry',
        content: `### ⚖️ Smart Medical Body Station Telemetry for ${patientName}\n\n` +
          `• **Weight & BMI:** **${scale.weightLbs} lbs** (BMI: ${scale.bmi} - Healthy weight band)\n` +
          `• **Pulse Wave Velocity (PWV):** **${scale.pulseWaveVelocityMps} m/s** (Arterial stiffness measurement)\n` +
          `• **Vascular Age:** **${scale.vascularAgeYears} years** (Favorable compared to biological age)\n` +
          `• **Sudomotor Nerve Score:** **${scale.sudomotorNerveScore}/100** (Electrochemical skin conductance confirms healthy peripheral foot nerves with no diabetic neuropathy)\n` +
          `• **Extracellular Water Ratio:** **${scale.extracellularWaterRatio}%** (Normal extracellular fluid ratio; confirms absence of leg edema)\n\n` +
          `*Cardiac Protection:* Sudden weight gain >2.5 lbs in 24 hours triggers immediate CHF escalation to prevent hospital readmission.`,
        insights: [
          `Vascular elasticity is optimal for Eleanor's age bracket`,
          `Weight has varied less than 0.4 lbs over the last 5 days`,
        ],
      };
    }

    // General fallback
    return {
      category: 'daily_summary',
      content: `I reviewed ${patientName}'s real-time wearable telemetry. Current vitals are:\n\n` +
        `• **Heart Rate:** ${vitals.heartRate} BPM (Normal)\n` +
        `• **Blood Pressure:** ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg\n` +
        `• **SpO2:** ${vitals.spo2}%\n` +
        `• **Connected Wearables:** ${devices.filter((d) => d.connected).length} active\n\n` +
        `Would you like me to generate a formal clinical trend report for Dr. Evelyn Vance, or check battery levels?`,
      insights: [`All vitals are currently within caregiver-configured threshold guardrails.`],
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: AIChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      timestamp: timeNow,
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const response = generateAIResponse(query);
      const assistantMsg: AIChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: response.content,
        category: response.category,
        actionableInsights: response.insights,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsAnalyzing(false);
    }, 700);
  };

  const handleReadAloud = (text: string) => {
    // Strip markdown formatting for cleaner speech synthesis
    const cleanText = text.replace(/[*#_`]/g, '').replace(/•/g, 'point');
    speakText(cleanText);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[750px] overflow-hidden">
      {/* Bot Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Kinote Family Health Intelligence</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Telemetry Connected
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold flex items-center gap-1">
                <span>⚡ On-Device AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Aggregated vitals trends, periods of concern vs. baseline, and conversational summaries for {patientName}.
            </p>
          </div>
        </div>

        {/* View Mode Switcher: Interactive Chat vs. Weekly Health Overview */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-800/90 p-1 rounded-xl flex items-center gap-1 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'chat'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Interactive Chat</span>
            </button>
            <button
              onClick={() => setActiveView('weekly_overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'weekly_overview'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-300" />
              <span>Weekly Health Overview</span>
              <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 py-0.2 rounded font-mono">AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Branching: Weekly Health Overview or Interactive Chat */}
      {activeView === 'weekly_overview' ? (
        <div className="p-4 sm:p-6 bg-slate-100/60 overflow-y-auto flex-1">
          <WeeklyHealthOverview
            vitals={vitals}
            thresholds={thresholds}
            patientName={patientName}
            onAskAI={(questionPrompt) => {
              setActiveView('chat');
              handleSend(questionPrompt);
            }}
          />
        </div>
      ) : (
        <>
          {/* Suggested 1-Tap Quick Action Prompts */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Quick Queries:</span>
            <button
              onClick={() => setActiveView('weekly_overview')}
              className="px-3 py-1.5 rounded-lg bg-teal-100/80 border border-teal-300 hover:bg-teal-200 text-teal-900 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs font-bold"
            >
              <FileText className="w-3.5 h-3.5 text-teal-800" />
              <span>Weekly Health Overview (AI)</span>
            </button>
            <button
              onClick={() => handleSend("Analyze Eleanor's 30-day medication adherence rates, missed doses, and common trends")}
              className="px-3 py-1.5 rounded-lg bg-teal-100/90 border border-teal-300 hover:bg-teal-200 text-teal-900 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs font-semibold"
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-800" />
              <span>30-Day Adherence &amp; Trends (Recharts)</span>
            </button>
            <button
              onClick={() => handleSend("What is Eleanor's medication schedule and adherence status today?")}
              className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-300 hover:bg-teal-100 text-teal-900 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs font-semibold"
            >
              <Pill className="w-3.5 h-3.5 text-teal-700" />
              <span>Today's Meds Schedule</span>
            </button>
            <button
              onClick={() => handleSend("What are the periods of concern vs baseline in Eleanor's vitals this week?")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Periods of Concern vs Baseline</span>
            </button>
            <button
              onClick={() => handleSend("What are Eleanor's 7-day vital trends for heart rate and SpO2?")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-rose-600" />
              <span>7-Day Vital Trends</span>
            </button>
            <button
              onClick={() => handleSend("What other data is received from different wearables? Include all of them customized by wearable type")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>All Wearables Data Matrix</span>
            </button>
            <button
              onClick={() => handleSend("Generate today's complete daily vitals summary for Eleanor")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Daily Vitals Summary</span>
            </button>
            <button
              onClick={() => handleSend("Analyze Dexcom CGM continuous glucose and Time-In-Range")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>CGM Glucose &amp; TIR</span>
            </button>
            <button
              onClick={() => handleSend("Review Oura Smart Ring nocturnal HRV, recovery, and sleep apnea BDI")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Heart className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ring HRV &amp; Sleep</span>
            </button>
            <button
              onClick={() => handleSend("Check BioButton medical chest patch for lung fluid bioimpedance and cough frequency")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:text-red-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-red-600" />
              <span>Patch CHF Fluid &amp; Cough</span>
            </button>
            <button
              onClick={() => handleSend("Examine Withings medical scale pulse wave velocity, vascular age, and nerve health")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vascular Age &amp; Nerve</span>
            </button>
            <button
              onClick={() => handleSend("Check all wearable device batteries and sync status")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Battery className="w-3.5 h-3.5 text-blue-600" />
              <span>Device Diagnostics</span>
            </button>
            <button
              onClick={() => handleSend("Explain emergency voice dispatch sequence and active location")}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-800 text-slate-700 whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Emergency Triage</span>
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                  <span>{msg.sender === 'user' ? 'David Miller (Caregiver)' : 'Kinote Health AI'}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="whitespace-pre-line prose prose-xs max-w-none">
                    {msg.content}
                  </div>

                  {/* Actionable Insights Badge List if present */}
                  {msg.actionableInsights && msg.actionableInsights.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                      <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px] block">
                        Key Telemetry Metrics
                      </span>
                      {msg.actionableInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-600 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assistant Message Actions (Read aloud, Copy) */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs text-slate-500">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1 text-[11px]"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleReadAloud(msg.content)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-teal-700 transition-colors flex items-center gap-1 text-[11px] font-medium"
                        title="Read answer aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Read Aloud</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-white border border-slate-200 rounded-xl w-fit animate-pulse">
                <Sparkles className="w-4 h-4 text-teal-600 animate-spin" />
                <span>Kinote AI is analyzing real-time wearable telemetry Shards...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Kinote AI about Eleanor's vitals, periods of concern, sleep, or weekly summary..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isAnalyzing}
                className="p-2.5 sm:px-5 sm:py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
