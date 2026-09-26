import React, { useState, useMemo } from 'react';
import { 
  VitalsReading, 
  MetricThresholds, 
  HealthPeriodType,
  WeeklyOverviewReport
} from '../types';
import { generateWeeklyHealthOverview } from '../utils/weeklyOverviewGenerator';
import { speakText, stopSpeech } from '../utils/speech';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Heart, 
  Wind, 
  Activity, 
  Moon, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  Droplet,
  Send,
  SlidersHorizontal
} from 'lucide-react';

interface WeeklyHealthOverviewProps {
  vitals: VitalsReading;
  thresholds: MetricThresholds;
  patientName?: string;
  onAskAI?: (prompt: string) => void;
  onViewRawCharts?: () => void;
}

export default function WeeklyHealthOverview({
  vitals,
  thresholds,
  patientName = 'Eleanor Vance',
  onAskAI,
  onViewRawCharts,
}: WeeklyHealthOverviewProps) {
  // View states
  const [toneMode, setToneMode] = useState<'caregiver' | 'clinical'>('caregiver');
  const [periodFilter, setPeriodFilter] = useState<'all' | HealthPeriodType>('all');
  const [selectedDomain, setSelectedDomain] = useState<'cardio' | 'oxygen' | 'metabolic' | 'sleep'>('cardio');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({
    'act-2': true,
    'act-3': true,
  });

  // Generate dynamic overview
  const report: WeeklyOverviewReport = useMemo(() => {
    return generateWeeklyHealthOverview(vitals, thresholds, patientName);
  }, [vitals, thresholds, patientName]);

  // Handle Regenerate AI brief simulation
  const handleRegenerate = () => {
    setIsRegenerating(true);
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    }
    setTimeout(() => {
      setIsRegenerating(false);
    }, 900);
  };

  // Handle Text-to-Speech
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      stopSpeech();
      setIsPlayingAudio(false);
    } else {
      const textToRead = toneMode === 'caregiver' 
        ? report.caregiverExecutiveSummary.replace(/[*#_`]/g, '').replace(/•/g, 'point')
        : report.clinicalSoapSummary.replace(/[*#_`]/g, '').replace(/•/g, 'point');
      speakText(textToRead);
      setIsPlayingAudio(true);
    }
  };

  // Handle Copy to clipboard
  const handleCopySummary = () => {
    const textToCopy = toneMode === 'caregiver'
      ? report.caregiverExecutiveSummary
      : report.clinicalSoapSummary;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2200);
  };

  // Toggle Action item
  const toggleAction = (id: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered identified periods
  const filteredPeriods = useMemo(() => {
    if (periodFilter === 'all') return report.identifiedPeriods;
    return report.identifiedPeriods.filter((p) => p.type === periodFilter);
  }, [report.identifiedPeriods, periodFilter]);

  const concernCount = report.identifiedPeriods.filter((p) => p.type === 'concern').length;
  const baselineCount = report.identifiedPeriods.filter((p) => p.type === 'baseline').length;
  const exertionCount = report.identifiedPeriods.filter((p) => p.type === 'exertion_recovery').length;

  return (
    <div className="space-y-6">
      {/* Top AI Synthesis Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">Weekly Health Overview</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  AI Multi-Wearable Synthesis
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  report.overallStatus === 'stable'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : report.overallStatus === 'attention_recommended'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}>
                  {report.overallStatus === 'stable' ? '● Baseline Stable' : report.overallStatus === 'attention_recommended' ? '▲ Period of Concern Flagged' : '🚨 Critical Telemetry Active'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                <span>Subject: <strong className="text-white">{patientName}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>{report.dateRange}</span>
                </span>
                <span>•</span>
                <span>Sensor Quorum Uptime: <strong className="text-emerald-300">99.8%</strong></span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tone Selector */}
            <div className="bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-700 text-xs">
              <button
                onClick={() => setToneMode('caregiver')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  toneMode === 'caregiver'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Conversational, empathetic explanation for adult children"
              >
                Caregiver Brief
              </button>
              <button
                onClick={() => setToneMode('clinical')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  toneMode === 'clinical'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="SOAP format with clinical terms ready for physician review"
              >
                Clinical SOAP
              </button>
            </div>

            {/* Read Aloud */}
            <button
              onClick={handleToggleAudio}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isPlayingAudio 
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title={isPlayingAudio ? 'Stop reading' : 'Read AI summary aloud'}
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
              <span>{isPlayingAudio ? 'Stop' : 'Read Aloud'}</span>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Copy text summary to clipboard"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              <span>{copiedSuccess ? 'Copied!' : 'Copy'}</span>
            </button>

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-40"
              title="Re-aggregate vitals trends"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 7-Day Aggregated Biometric KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-xs">
          {/* Heart Rate Mean & Rest */}
          <div className="p-3.5 sm:p-4">
            <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              7-Day Mean HR
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{report.observedAggregates.meanHeartRate}</span>
              <span className="text-[10px] text-slate-500 font-medium">BPM</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Resting: <strong>{report.observedAggregates.restingHeartRate} BPM</strong>
            </span>
          </div>

          {/* SpO2 & Time in Range */}
          <div className="p-3.5 sm:p-4">
            <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
              7-Day Mean SpO2
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{report.observedAggregates.meanSpo2}%</span>
              <span className="text-[10px] text-emerald-600 font-semibold">TIR {report.observedAggregates.timeInRangeSpo2Percent}%</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Nadir: <strong>{report.observedAggregates.minSpo2}%</strong> (Mon transit)
            </span>
          </div>

          {/* Blood Pressure Mean */}
          <div className="p-3.5 sm:p-4">
            <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Mean Blood Pressure
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-slate-900">{report.observedAggregates.meanBloodPressure}</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              Controlled on Lisinopril
            </span>
          </div>

          {/* Continuous Glucose (CGM) */}
          <div className="p-3.5 sm:p-4">
            <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-amber-500" />
              Mean CGM Glucose
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{report.observedAggregates.meanGlucose}</span>
              <span className="text-[10px] text-slate-500 font-medium">mg/dL</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
              96% Time-in-Range (Dexcom)
            </span>
          </div>

          {/* Circadian Restorative Dip */}
          <div className="p-3.5 sm:p-4">
            <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              Nocturnal Sleep Dip
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">14.2%</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Healthy</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Target dip: 10–20%
            </span>
          </div>

          {/* Periods Breakdown Summary */}
          <div className="p-3.5 sm:p-4 bg-teal-50/50">
            <span className="text-teal-900 block text-[11px] font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              Identified Windows
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                {baselineCount} Base
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                {concernCount} Concern
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                {exertionCount} Exert
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              1 resolved event flagged
            </span>
          </div>
        </div>

        {/* AI Narrative Body */}
        <div className="p-5 sm:p-7 space-y-4">
          {isRegenerating ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Sparkles className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Kinote AI is synthesizing multi-wearable trends...</p>
              <p className="text-xs text-slate-400 max-w-sm">Aggregating continuous PPG, thoracic bioimpedance, and sleep architecture telemetry.</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-line leading-relaxed bg-slate-50/60 p-5 rounded-xl border border-slate-200">
              {toneMode === 'caregiver' ? report.caregiverExecutiveSummary : report.clinicalSoapSummary}
            </div>
          )}

          {/* Follow-up question banner into AI Assistant */}
          {onAskAI && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-slate-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="text-slate-700">
                  Have a specific question about Eleanor&apos;s Monday clinic transit dip or sleep architecture?
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onAskAI("Explain the Monday Sep 21 SpO2 dip and exertion episode in detail")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 font-medium hover:bg-teal-50 transition-colors shadow-2xs whitespace-nowrap"
                >
                  Ask about Mon Transit Dip
                </button>
                <button
                  onClick={() => onAskAI("How does Eleanor's nocturnal restorative dip compare across the past 7 days?")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 font-medium hover:bg-teal-50 transition-colors shadow-2xs whitespace-nowrap"
                >
                  Ask about Sleep Dip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparative Section: Periods of Concern vs. Baseline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Periods of Concern vs. Baseline Classification</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kinote AI groups telemetry intervals into baseline stability vs. flagged periods requiring attention.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                periodFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Periods ({report.identifiedPeriods.length})
            </button>
            <button
              onClick={() => setPeriodFilter('concern')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                periodFilter === 'concern'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Periods of Concern ({concernCount})</span>
            </button>
            <button
              onClick={() => setPeriodFilter('baseline')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                periodFilter === 'baseline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Baseline Windows ({baselineCount})</span>
            </button>
            <button
              onClick={() => setPeriodFilter('exertion_recovery')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                periodFilter === 'exertion_recovery'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Exertion &amp; Recovery ({exertionCount})</span>
            </button>
          </div>
        </div>

        {/* Timeline Cards Grid */}
        <div className="space-y-3.5">
          {filteredPeriods.map((period) => {
            const isConcern = period.type === 'concern';
            const isBaseline = period.type === 'baseline';

            return (
              <div
                key={period.id}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  isConcern
                    ? 'bg-rose-50/40 border-rose-200'
                    : isBaseline
                    ? 'bg-emerald-50/20 border-emerald-200/80'
                    : 'bg-blue-50/20 border-blue-200/80'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                        isConcern
                          ? 'bg-rose-100 text-rose-800'
                          : isBaseline
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isConcern ? <AlertTriangle className="w-3 h-3" /> : isBaseline ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                        <span>{isConcern ? 'Period of Concern' : isBaseline ? 'Baseline Optimal Window' : 'Exertion & Active Recovery'}</span>
                      </span>

                      <span className="text-xs font-semibold text-slate-800">{period.dayLabel}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-mono">{period.timeRange}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1">{period.title}</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{period.clinicalContext}</p>
                    
                    <div className="pt-2 text-xs flex items-start gap-1.5 text-slate-600">
                      <strong className="text-slate-900 shrink-0">Kinote AI Guidance:</strong>
                      <span>{period.actionTakenOrAdvised}</span>
                    </div>
                  </div>

                  {/* Right Telemetry Snapshot */}
                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200 shrink-0 w-full md:w-56 space-y-1.5 text-xs shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Recorded Biometrics
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                        <span className={`font-bold ${isConcern && period.vitalsSummary.heartRate > 95 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {period.vitalsSummary.heartRate} BPM
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">SpO2 Oxygen</span>
                        <span className={`font-bold ${isConcern && period.vitalsSummary.spo2 < 95 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {period.vitalsSummary.spo2}%
                        </span>
                      </div>
                      {period.vitalsSummary.bloodPressure && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                          <span className="font-semibold text-slate-800">{period.vitalsSummary.bloodPressure}</span>
                        </div>
                      )}
                      {period.vitalsSummary.glucose && (
                        <div>
                          <span className="text-[10px] text-slate-400 block">CGM Glucose</span>
                          <span className="font-semibold text-slate-800">{period.vitalsSummary.glucose} mg/dL</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                      Sensor: {period.sensorAttribution}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Domain Summaries & Action Items Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Health Summaries */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Domain Vitals Breakdown</h3>
              <p className="text-xs text-slate-500">AI analysis partitioned by physiological system.</p>
            </div>
            {onViewRawCharts && (
              <button
                onClick={onViewRawCharts}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View Raw Recharts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <button
              onClick={() => setSelectedDomain('cardio')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                selectedDomain === 'cardio' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-600" />
              <span>Cardiovascular</span>
            </button>
            <button
              onClick={() => setSelectedDomain('oxygen')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                selectedDomain === 'oxygen' ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
              <span>Oxygenation</span>
            </button>
            <button
              onClick={() => setSelectedDomain('metabolic')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                selectedDomain === 'metabolic' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-amber-600" />
              <span>Metabolic (CGM)</span>
            </button>
            <button
              onClick={() => setSelectedDomain('sleep')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                selectedDomain === 'sleep' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Circadian &amp; Sleep</span>
            </button>
          </div>

          {/* Domain Body */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {selectedDomain === 'cardio' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
                  <span>Cardiovascular Summary</span>
                  <span className="text-emerald-700">Resting Baseline: 64–68 BPM</span>
                </div>
                <p>{report.domainSummaries.cardiovascular}</p>
              </div>
            )}
            {selectedDomain === 'oxygen' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
                  <span>Pulmonary &amp; SpO2 Summary</span>
                  <span className="text-emerald-700">Target: ≥95% (99.2% achieved)</span>
                </div>
                <p>{report.domainSummaries.oxygenation}</p>
              </div>
            )}
            {selectedDomain === 'metabolic' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
                  <span>Continuous Glycemic Index</span>
                  <span className="text-emerald-700">Dexcom G7 TIR: 96%</span>
                </div>
                <p>{report.domainSummaries.metabolic}</p>
              </div>
            )}
            {selectedDomain === 'sleep' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
                  <span>Circadian Dip &amp; Sleep Architecture</span>
                  <span className="text-emerald-700">Oura Recovery: 89/100</span>
                </div>
                <p>{report.domainSummaries.circadianSleep}</p>
              </div>
            )}
          </div>

          {/* Baseline Norms vs Observed Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Reference Standards Comparison
            </span>
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>Resting Heart Rate:</span>
              <span className="font-semibold text-slate-800">
                Baseline {report.baselineMetrics.restingHrBand} ➔ Observed {report.observedAggregates.restingHeartRate} BPM
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-[11px]">
              <span>Nocturnal Sleep Dip:</span>
              <span className="font-semibold text-slate-800">
                Norm {report.baselineMetrics.nocturnalDipNormal} ➔ Observed 14.2% Dip
              </span>
            </div>
          </div>
        </div>

        {/* Caregiver Action Items Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Caregiver Action Items</h3>
              <p className="text-xs text-slate-500">Key recommendations tailored for David Miller.</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800">
              {Object.values(completedActions).filter(Boolean).length} / {report.actionItems.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {report.actionItems.map((action) => {
              const isDone = !!completedActions[action.id];
              return (
                <div
                  key={action.id}
                  onClick={() => toggleAction(action.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isDone 
                      ? 'bg-slate-50 border-slate-200 opacity-75' 
                      : action.priority === 'high'
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <button
                    type="button"
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isDone 
                        ? 'bg-teal-700 border-teal-700 text-white' 
                        : 'border-slate-300 bg-white hover:border-teal-500'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {action.title}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        action.priority === 'high' 
                          ? 'bg-rose-100 text-rose-700' 
                          : action.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {action.priority}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                      {action.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 flex items-center gap-2.5 text-xs text-teal-900">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Encrypted HIPAA/DPDP session · Audit log updated on each AI synthesis generation.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
