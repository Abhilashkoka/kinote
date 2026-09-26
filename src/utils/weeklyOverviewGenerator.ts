import { 
  VitalsReading, 
  MetricThresholds, 
  WeeklyOverviewReport, 
  HealthPeriodItem 
} from '../types';
import { getAugmentedHistoricalVitals } from './mockData';

export function generateWeeklyHealthOverview(
  vitals: VitalsReading,
  thresholds: MetricThresholds,
  patientName: string = 'Eleanor Vance'
): WeeklyOverviewReport {
  const {
    daily,
    avg7DayHr,
    avg7DaySpo2,
    min7DayHr,
    max7DayHr,
    timeInRangeSpo2Percent,
  } = getAugmentedHistoricalVitals(vitals, thresholds);

  // Check if live vitals currently have a critical or warning breach
  const liveHrBreach = vitals.heartRate > thresholds.heartRate.maxCritical || vitals.heartRate < thresholds.heartRate.minCritical;
  const liveHrWarn = vitals.heartRate > thresholds.heartRate.maxWarn || vitals.heartRate < thresholds.heartRate.minWarn;
  const liveSpo2Crit = vitals.spo2 < thresholds.spo2.minCritical;
  const liveSpo2Warn = vitals.spo2 < thresholds.spo2.minWarn;
  const liveBpCrit = vitals.bloodPressureSystolic > thresholds.bloodPressureSystolic.maxCritical || vitals.bloodPressureDiastolic > thresholds.bloodPressureDiastolic.maxCritical;
  const liveBpWarn = vitals.bloodPressureSystolic > thresholds.bloodPressureSystolic.maxWarn;
  const liveFall = vitals.fallDetected;

  const hasLiveCritical = liveHrBreach || liveSpo2Crit || liveBpCrit || liveFall;
  const hasLiveWarning = liveHrWarn || liveSpo2Warn || liveBpWarn;

  // Determine overall status
  let overallStatus: 'stable' | 'attention_recommended' | 'critical_alert' = 'stable';
  let riskScore = 14; // Nominal low risk baseline

  if (hasLiveCritical) {
    overallStatus = 'critical_alert';
    riskScore = 88;
  } else if (hasLiveWarning) {
    overallStatus = 'attention_recommended';
    riskScore = 46;
  } else {
    overallStatus = 'stable';
    riskScore = 12;
  }

  // Aggregate resting heart rates
  const restingRates = daily.map((d) => d.restingHeartRate);
  const avgRestingHr = Math.round(restingRates.reduce((a, b) => a + b, 0) / restingRates.length);

  // Aggregate Blood Pressure
  const avgSystolic = Math.round(daily.reduce((a, b) => a + b.systolicBp, 0) / daily.length);
  const avgDiastolic = Math.round(daily.reduce((a, b) => a + b.diastolicBp, 0) / daily.length);

  // Aggregate Glucose
  const avgGlucose = Math.round(daily.reduce((a, b) => a + b.glucoseAvg, 0) / daily.length);

  // Compile Identified Periods of Concern vs. Baseline
  const identifiedPeriods: HealthPeriodItem[] = [
    {
      id: 'period-sat-baseline',
      title: 'Optimal Weekend Baseline & Morning Activity',
      type: 'baseline',
      timestamp: '2026-09-19T09:30:00',
      dayLabel: 'Sat Sep 19',
      timeRange: '08:00 AM – 11:30 AM',
      vitalsSummary: {
        heartRate: 68,
        spo2: 98,
        bloodPressure: '120/76 mmHg',
        glucose: 102,
      },
      sensorAttribution: 'Apple Watch Series 10 (PPG) + Masimo MightySat',
      clinicalContext: 'Eleanor engaged in light garden watering and porch walking. Heart rate modulated naturally with physical exertion and quickly returned to a 64 BPM resting baseline within 3.5 minutes.',
      actionTakenOrAdvised: 'Baseline benchmark established. Autonomic tone and heart rate variability (HRV 42ms) demonstrated healthy parasympathetic rebound.',
      severity: 'info',
    },
    {
      id: 'period-sun-exertion',
      title: 'Family Visit Walk (Postprandial Exertion)',
      type: 'exertion_recovery',
      timestamp: '2026-09-20T13:45:00',
      dayLabel: 'Sun Sep 20',
      timeRange: '12:30 PM – 02:00 PM',
      vitalsSummary: {
        heartRate: 84,
        spo2: 97,
        bloodPressure: '124/78 mmHg',
        glucose: 108,
      },
      sensorAttribution: 'Apple Watch Series 10 + Oura Ring Gen 3',
      clinicalContext: 'Mild post-lunch elevation in pulse rate during family stroll. Heart rate peaked at 92 BPM, remaining safely below the caution threshold of 100 BPM.',
      actionTakenOrAdvised: 'No intervention required. Blood pressure remained well within normotensive targets.',
      severity: 'info',
    },
    {
      id: 'period-mon-concern',
      title: 'Period of Concern: Post-Clinic Transit Tachycardia & SpO2 Nadir',
      type: 'concern',
      timestamp: '2026-09-21T12:45:00',
      dayLabel: 'Mon Sep 21',
      timeRange: '12:15 PM – 01:20 PM',
      vitalsSummary: {
        heartRate: 99,
        spo2: 94,
        bloodPressure: '126/80 mmHg',
        glucose: 112,
      },
      sensorAttribution: 'Apple Watch Series 10 + BioButton Chest Patch',
      clinicalContext: 'Following outpatient clinic commute and navigating building stairs, pulse rate spiked to 99 BPM with a transient SpO2 dip to 94% recorded on continuous BioButton telemetry. Thoracic respiratory rate rose to 21 breaths/min.',
      actionTakenOrAdvised: 'Autonomous Kinote threshold ping alerted Eleanor to take a seat with cool water. SpO2 recovered to 97% within 7 minutes. Recommended: Schedule post-appointment rest periods and avoid heavy stair-climbing after clinic sessions.',
      severity: 'caution',
    },
    {
      id: 'period-tue-baseline',
      title: 'Exemplary Nocturnal Restorative Dip & Sleep Architecture',
      type: 'baseline',
      timestamp: '2026-09-22T03:15:00',
      dayLabel: 'Tue Sep 22',
      timeRange: '11:00 PM (Mon) – 06:30 AM (Tue)',
      vitalsSummary: {
        heartRate: 56,
        spo2: 99,
        bloodPressure: '119/75 mmHg',
        glucose: 99,
      },
      sensorAttribution: 'Oura Ring Gen 3 (Optical PPG + Temp Sensor) + Apple Watch',
      clinicalContext: 'Sleep architecture recorded a 14.2% physiological dip in heart rate during deep slow-wave sleep (nadir: 56 BPM). Nocturnal respiratory variation index (BDI) was minimal (0.8 events/hr), ruling out sleep apnea episodes.',
      actionTakenOrAdvised: 'Reassuring restorative sleep index (Score: 89/100). Demonstrates strong autonomic recovery from previous day exertion.',
      severity: 'info',
    },
    {
      id: 'period-wed-recovery',
      title: 'Physical Therapy Session: Controlled Cardiac Stress & Rapid Recovery',
      type: 'exertion_recovery',
      timestamp: '2026-09-23T11:00:00',
      dayLabel: 'Wed Sep 23',
      timeRange: '10:30 AM – 11:45 AM',
      vitalsSummary: {
        heartRate: 86,
        spo2: 97,
        bloodPressure: '121/77 mmHg',
        glucose: 105,
      },
      sensorAttribution: 'Masimo MightySat + Apple Watch Series 10',
      clinicalContext: 'Supervised balance and resistance PT exercises. Maximum heart rate reached 91 BPM with stable pulse ox perfusion index (PI 3.8%). Heart rate normalized back to 68 BPM within 4 minutes post-exercise.',
      actionTakenOrAdvised: 'Excellent cardiovascular exercise tolerance for age 78. Physical therapist noted consistent gait stability.',
      severity: 'info',
    },
    {
      id: 'period-thu-baseline',
      title: 'Metabolic & Glycemic Homeostasis (Time-in-Range: 96%)',
      type: 'baseline',
      timestamp: '2026-09-24T16:00:00',
      dayLabel: 'Thu Sep 24',
      timeRange: 'All Day (24-Hour CGM Stream)',
      vitalsSummary: {
        heartRate: 67,
        spo2: 98,
        bloodPressure: '123/79 mmHg',
        glucose: 106,
      },
      sensorAttribution: 'Dexcom G7 Continuous Glucose Monitor + Apple Watch',
      clinicalContext: 'Continuous glucose telemetry revealed 96% Time-in-Range (70–140 mg/dL target) with an average mean of 106 mg/dL. Zero hypoglycemic excursions recorded.',
      actionTakenOrAdvised: 'Dietary carbohydrate adherence and hydration levels are exemplary. Blood pressure remained well-controlled on Lisinopril.',
      severity: 'info',
    },
  ];

  // If live telemetry is simulated in an emergency / warning state, inject a Live Anomaly Period
  if (hasLiveCritical || hasLiveWarning) {
    let breachTitle = 'Active Period of Concern: Live Telemetry Anomaly Detected';
    let breachDetails = 'Current real-time wearable sensor stream indicates values exceeding normal thresholds.';
    let advised = 'Kinote automated triage sequence is actively monitoring this event.';
    let severity: 'caution' | 'critical' = hasLiveCritical ? 'critical' : 'caution';

    if (liveFall) {
      breachTitle = 'CRITICAL EVENT: Fall Shock Impact with Inactivity';
      breachDetails = 'Multi-sensor floor impact detected by Apple Watch accelerometer, followed by absence of step cadence.';
      advised = 'AI Voice Dispatch sequence triggered. Primary caregiver notified; EMS escalation standby active.';
    } else if (liveHrBreach || liveHrWarn) {
      breachTitle = `ALERT: Acute Heart Rate Excursion (${vitals.heartRate} BPM)`;
      breachDetails = `Current heart rate is ${vitals.heartRate} BPM (Baseline: 64–72 BPM). Exceeds caregiver set safety ceiling (${thresholds.heartRate.maxWarn} BPM).`;
      advised = 'AI Voice check-in initiated to verify Eleanor\'s consciousness, symptoms, and hydration.';
    } else if (liveSpo2Crit || liveSpo2Warn) {
      breachTitle = `ALERT: Acute Oxygen Saturation Drop (${vitals.spo2}%)`;
      breachDetails = `Continuous pulse ox indicates SpO2 has fallen to ${vitals.spo2}% (Therapeutic target: ≥95%). Labored respiration noted.`;
      advised = 'Instruct patient to sit upright, perform purse-lip breathing, and verify pulse ox clip placement.';
    } else if (liveBpCrit || liveBpWarn) {
      breachTitle = `ALERT: Blood Pressure Spike (${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg)`;
      breachDetails = `Omron Evolv cuff measured elevated systolic blood pressure.`;
      advised = 'Repeat measurement in 5 minutes in seated resting position.';
    }

    identifiedPeriods.unshift({
      id: 'period-live-event',
      title: breachTitle,
      type: 'concern',
      timestamp: '2026-09-25T13:45:00',
      dayLabel: 'Today (Live)',
      timeRange: 'Active Real-Time Window',
      vitalsSummary: {
        heartRate: vitals.heartRate,
        spo2: vitals.spo2,
        bloodPressure: `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`,
        glucose: vitals.glucose || 104,
      },
      sensorAttribution: 'Universal Wearable Gateway (Apple Watch + Masimo MightySat + Oura)',
      clinicalContext: breachDetails,
      actionTakenOrAdvised: advised,
      severity,
    });
  }

  // Caregiver Executive Narrative (Empathetic, clear, actionable for adult child)
  const caregiverExecutiveSummary = 
`**Executive Brief for David Miller (Caregiver)**

Over the past 7 days (Sep 19 – Sep 25, 2026), **${patientName}'s overall health trajectory demonstrates reassuring baseline stability**, with **${timeInRangeSpo2Percent}%** of blood oxygen readings and **96%** of continuous glucose readings maintaining optimal therapeutic targets.

### 🔍 Periods of Concern vs. Baseline Analysis:
1. **Established Physiological Baselines (Optimal):**
   • **Resting Cardiovascular Baseline:** Eleanor's resting heart rate reliably centers at **${avgRestingHr} BPM** (normal range: 60–75 BPM). 
   • **Nocturnal Restorative Dips:** Overnight readings from the Oura Ring and Apple Watch show a healthy **14.2% dip** in pulse rate during deep sleep (nadir: 56 BPM on Tuesday), indicating intact parasympathetic tone and restorative sleep.
   • **Activity Tolerance:** Routine daily activities (such as Saturday's morning garden stroll and Wednesday's physical therapy) produced appropriate, moderate cardiac responses that recovered cleanly to resting baseline within **4 minutes**.

2. **Flagged Period of Concern (Resolved):**
   • **Monday Sep 21 (12:15 PM – 01:20 PM):** During transit from her outpatient clinic visit, Eleanor experienced transient exertion tachycardia (**peak 99 BPM**) coupled with an isolated dip in blood oxygen to **94%**. Thoracic telemetry on the BioButton confirmed elevated breathing cadence.
   • **Resolution:** After an automated Kinote check-in prompted a 10-minute hydration and seated rest interval, Eleanor's SpO2 rebounded to 97% and heart rate returned to 76 BPM. No sustained nocturnal hypoxia occurred.

${hasLiveCritical ? `⚠️ **ATTENTION REQUIRED (Live Alert):** Eleanor's telemetry currently shows an acute metric excursion. Please review the live dashboard and verify her wellbeing immediately.` : '✅ **Summary Verdict:** Aside from Monday\'s transit exertion, Eleanor is tracking exceptionally well against her clinical baseline with zero unmanaged risks.'}

### 💡 Suggested Caregiver Actions for This Weekend:
• Continue morning Lisinopril medication schedule as prescribed.
• Ensure Eleanor takes a 15-minute hydration rest after future clinic travel days.
• Wearable batteries are in good order; keep Apple Watch and Oura dock chargers plugged in beside her bedside.`;

  // Clinical SOAP Summary (Medical format for primary physician Dr. Aris Thorne)
  const clinicalSoapSummary =
`**KINOTE 7-DAY REMOTE PATIENT MONITORING (RPM) CLINICAL SYNTHESIS**
**Patient:** ${patientName} | **Age/Sex:** 78F | **Reporting Period:** 2026-09-19 to 2026-09-25
**Ecosystem Quorum:** Apple Watch S10 (PPG/ECG), Oura Ring Gen 3 (PPG/Temp), Masimo MightySat (Pulse Ox), Dexcom G7 (CGM), BioButton (Thoracic Bioimpedance).

**S (Subjective):**
Patient reports adherence to prescribed regimen and activity protocol. Noted mild transient fatigue following clinic appointment on Mon Sep 21; otherwise feels energetic during morning physical therapy and daily strolls. No reports of chest pressure, palpitations, syncope, or near-falls.

**O (Objective - 7-Day Statistical Telemetry):**
• **Cardiovascular:**
  - 7-Day Mean HR: ${avg7DayHr} BPM (Range: ${min7DayHr} – ${max7DayHr} BPM).
  - Resting HR: ${avgRestingHr} BPM. Nocturnal Dip: 14.2% (Normative: 10–20%).
  - Arrhythmia Screening: Zero AFib episodes detected across 14 single-lead ECG recordings.
• **Oxygenation & Respiration:**
  - 7-Day Mean SpO2: ${avg7DaySpo2}%. Time in Target (≥95%): ${timeInRangeSpo2Percent}%.
  - SpO2 Nadir: 94% on Mon 09/21 at 12:45 PM during clinic transit exertion (duration: 7 mins; cleared post-rest).
  - Nocturnal Breathing Disturbance Index (BDI): 0.8 events/hr (Normal < 5.0).
• **Blood Pressure:**
  - 7-Day Mean BP: ${avgSystolic}/${avgDiastolic} mmHg (Normotensive control).
• **Metabolic (Dexcom G7 CGM):**
  - Mean Glucose: ${avgGlucose} mg/dL. Time-in-Range (70–140 mg/dL): 96%.
  - Glycemic Variability (CV): 14.8% (Target < 36%).

**A (Clinical Assessment):**
1. Stable baseline cardiovascular and pulmonary status under existing pharmacotherapy (Lisinopril 10mg QD).
2. Appropriate chronological chronological chronotropic response to physical therapy with brisk parasympathetic recovery.
3. Isolated transient exertional desaturation/tachycardia on 09/21 without nocturnal sequel or decompensation.
4. Quorum data integrity: 99.8% sensor packet uptime with cross-wearable correlation.

**P (Plan & Recommendations):**
1. Maintain current cardiovascular medication dosage and regimen.
2. Recommend planned rest intervals following medical transportation.
3. Continue multi-sensor RPM surveillance; next routine clinical review in 30 days.`;

  const domainSummaries = {
    cardiovascular: `Heart rate maintained a mean of ${avg7DayHr} BPM over the 7 days. Resting heart rate averaged ${avgRestingHr} BPM with healthy nocturnal deceleration. One peak exertion incident of 99 BPM occurred on Mon Sep 21 during clinic transit stairs, resolving to 76 BPM within 7 minutes.`,
    oxygenation: `Blood oxygen saturation (SpO2) averaged ${avg7DaySpo2}% across the week, achieving ${timeInRangeSpo2Percent}% Time-in-Range (≥95%). An isolated nadir of 94% was recorded during Monday's commute fatigue, with zero nocturnal desaturation events (BDI: 0.8 events/hr).`,
    metabolic: `Continuous glucose monitoring via Dexcom G7 tracked a mean 7-day glucose of ${avgGlucose} mg/dL with 96% Time-in-Range. Autonomic temperature deviation logged by Oura Ring remained flat (±0.1°C), confirming absence of acute systemic inflammation.`,
    circadianSleep: `Circadian telemetry demonstrates consistent sleep onset between 10:30 PM and 11:15 PM. Restorative nocturnal heart rate dip averaged 14.2%, with deepest sleep cycles recorded on Tuesday night.`,
  };

  const actionItems: WeeklyOverviewReport['actionItems'] = [
    {
      id: 'act-1',
      title: 'Review Monday Transit Protocol',
      description: 'Encourage Eleanor to utilize the clinic elevator rather than stairs and schedule a 15-minute rest after transit.',
      priority: 'medium',
      isCompleted: false,
    },
    {
      id: 'act-2',
      title: 'Maintain Hydration on Active Days',
      description: 'Provide an insulated water bottle before Wednesday physical therapy and afternoon walks.',
      priority: 'routine',
      isCompleted: true,
    },
    {
      id: 'act-3',
      title: 'Verify Wearable Charging Docks',
      description: 'Confirm Oura Ring and Apple Watch chargers remain plugged in at bedside for uninterrupted overnight tracking.',
      priority: 'routine',
      isCompleted: true,
    },
  ];

  if (hasLiveCritical || hasLiveWarning) {
    actionItems.unshift({
      id: 'act-live-urgent',
      title: 'Respond to Real-Time Telemetry Excursion',
      description: 'Check Eleanor immediately or review the AI voice call triage log to confirm patient safety.',
      priority: 'high' as const,
      isCompleted: false,
    });
  }

  return {
    patientName,
    dateRange: 'Past 7 Days (Sep 19 – Sep 25, 2026)',
    overallStatus,
    riskScore,
    baselineMetrics: {
      restingHrBand: '60 – 72 BPM',
      daytimeSpo2Band: '≥ 95% (97–99% typical)',
      nocturnalDipNormal: '10% – 20% dip during sleep',
      bloodPressureBaseline: '115–125 / 75–80 mmHg',
      meanGlucoseBaseline: '90 – 115 mg/dL',
    },
    observedAggregates: {
      meanHeartRate: avg7DayHr,
      minHeartRate: min7DayHr,
      maxHeartRate: max7DayHr,
      restingHeartRate: avgRestingHr,
      meanSpo2: avg7DaySpo2,
      minSpo2: Math.min(...daily.map((d) => d.minSpo2)),
      timeInRangeSpo2Percent,
      meanBloodPressure: `${avgSystolic}/${avgDiastolic} mmHg`,
      meanGlucose: avgGlucose,
      sensorUptimePercent: 99.8,
    },
    identifiedPeriods,
    caregiverExecutiveSummary,
    clinicalSoapSummary,
    domainSummaries,
    actionItems,
  };
}
