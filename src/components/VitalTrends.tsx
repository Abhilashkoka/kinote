import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { 
  Heart, 
  Wind, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  Info, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MetricThresholds, VitalsReading } from '../types';
import { getAugmentedHistoricalVitals } from '../utils/mockData';

interface VitalTrendsProps {
  vitals: VitalsReading;
  thresholds: MetricThresholds;
  patientName: string;
  onOpenWeeklyOverview?: () => void;
}

type ViewMode = 'dual' | 'heart_rate' | 'spo2';
type ResolutionMode = 'daily' | 'intraday';

interface ChartPoint {
  key: string;
  dayLabel: string;
  timeLabel: string;
  formattedDate: string;
  heartRate: number;
  avgHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  restingHeartRate?: number;
  spo2: number;
  avgSpo2?: number;
  minSpo2?: number;
  maxSpo2?: number;
  status?: 'optimal' | 'warning' | 'critical';
  notes?: string;
  activityContext?: string;
  sourceDevice?: string;
  sensorSource?: string;
  isSimulatedToday?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  resolution: ResolutionMode;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, resolution }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-md max-w-xs space-y-2 z-50">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-bold text-slate-100">
            {resolution === 'daily' ? `${data.dayLabel} (${data.formattedDate})` : `${data.dayLabel} · ${data.timeLabel}`}
          </span>
        </div>
        {data.isSimulatedToday && (
          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
            Live Streaming
          </span>
        )}
      </div>

      <div className="space-y-1.5 pt-0.5">
        {/* Heart Rate reading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Heart className="w-3.5 h-3.5" />
            <span className="font-medium">Heart Rate:</span>
          </div>
          <span className="font-bold font-mono text-slate-100">
            {resolution === 'daily' ? `${data.avgHeartRate} BPM (Avg)` : `${data.heartRate} BPM`}
          </span>
        </div>
        {resolution === 'daily' && (
          <div className="text-[11px] text-slate-400 pl-5 flex justify-between">
            <span>Range: {data.minHeartRate} - {data.maxHeartRate} BPM</span>
            <span>Resting: {data.restingHeartRate} BPM</span>
          </div>
        )}

        {/* SpO2 reading */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Wind className="w-3.5 h-3.5" />
            <span className="font-medium">Blood Oxygen (SpO2):</span>
          </div>
          <span className="font-bold font-mono text-slate-100">
            {resolution === 'daily' ? `${data.avgSpo2}%` : `${data.spo2}%`}
          </span>
        </div>

        {/* Context / Activity */}
        {data.activityContext && (
          <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
            <span className="text-slate-400">Context: </span>
            <span>{data.activityContext}</span>
          </div>
        )}

        {data.notes && resolution === 'daily' && (
          <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800">
            <span className="text-slate-400">Clinical Note: </span>
            <span className={data.status === 'critical' ? 'text-rose-400 font-semibold' : data.status === 'warning' ? 'text-amber-400 font-semibold' : 'text-slate-200'}>
              {data.notes}
            </span>
          </div>
        )}

        {/* Sensor Source */}
        <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/80">
          <span>Source:</span>
          <span className="text-teal-400 truncate max-w-[170px]">{data.sourceDevice || data.sensorSource}</span>
        </div>
      </div>
    </div>
  );
};

export default function VitalTrends({ 
  vitals, 
  thresholds, 
  patientName,
  onOpenWeeklyOverview
}: VitalTrendsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [resolution, setResolution] = useState<ResolutionMode>('daily');
  const [showThresholdGuides, setShowThresholdGuides] = useState<boolean>(true);

  // Compute augmented dataset that merges historical days with live reading
  const augmented = useMemo(() => {
    return getAugmentedHistoricalVitals(vitals, thresholds);
  }, [vitals, thresholds]);

  const { daily, intraday, avg7DayHr, avg7DaySpo2, min7DayHr, max7DayHr, timeInRangeSpo2Percent } = augmented;

  const chartData: ChartPoint[] = useMemo(() => {
    if (resolution === 'daily') {
      return daily.map((d) => ({
        key: d.date,
        dayLabel: d.dayLabel,
        timeLabel: d.dayLabel,
        formattedDate: d.formattedDate,
        heartRate: d.avgHeartRate,
        avgHeartRate: d.avgHeartRate,
        restingHeartRate: d.restingHeartRate,
        minHeartRate: d.minHeartRate,
        maxHeartRate: d.maxHeartRate,
        spo2: d.avgSpo2,
        avgSpo2: d.avgSpo2,
        minSpo2: d.minSpo2,
        maxSpo2: d.maxSpo2,
        status: d.status,
        notes: d.notes,
        sourceDevice: d.sourceDevice,
      }));
    } else {
      return intraday.map((intra) => ({
        key: intra.id,
        dayLabel: intra.dayLabel,
        timeLabel: intra.timeLabel,
        formattedDate: intra.dayLabel,
        heartRate: intra.heartRate,
        spo2: intra.spo2,
        activityContext: intra.activityContext,
        sensorSource: intra.sensorSource,
        isSimulatedToday: intra.isSimulatedToday,
      }));
    }
  }, [resolution, daily, intraday]);

  // Key stats comparisons
  const latestHr = vitals.heartRate;
  const hrDiffFrom7DayAvg = latestHr - avg7DayHr;
  const latestSpo2 = vitals.spo2;
  const spo2DiffFrom7DayAvg = Number((latestSpo2 - avg7DaySpo2).toFixed(1));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Vital Trends (7-Day Historical Analytics)</h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Multi-Sensor Quorum
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Continuous retrospective trajectory of heart rate and blood oxygen (SpO2) recorded for {patientName}.
            </p>
          </div>

          {/* View Mode & Resolution Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Mode Pill Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('dual')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'dual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dual Stream
              </button>
              <button
                onClick={() => setViewMode('heart_rate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'heart_rate'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-600" />
                <span>Heart Rate</span>
              </button>
              <button
                onClick={() => setViewMode('spo2')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  viewMode === 'spo2'
                    ? 'bg-white text-cyan-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wind className="w-3.5 h-3.5 text-cyan-600" />
                <span>SpO2 Oxygen</span>
              </button>
            </div>

            {/* Time Resolution Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
              <button
                onClick={() => setResolution('daily')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  resolution === 'daily'
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                7-Day Daily
              </button>
              <button
                onClick={() => setResolution('intraday')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  resolution === 'intraday'
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Intraday Stream (28)
              </button>
            </div>

            {/* Threshold Guides Toggle */}
            <button
              onClick={() => setShowThresholdGuides(!showThresholdGuides)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showThresholdGuides
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showThresholdGuides ? 'Guides: On' : 'Guides: Off'}</span>
            </button>

            {/* AI Weekly Health Overview Jump Button */}
            {onOpenWeeklyOverview && (
              <button
                onClick={onOpenWeeklyOverview}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs"
                title="Open AI Weekly Health Overview with Periods of Concern vs. Baseline"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>AI Weekly Overview</span>
              </button>
            )}
          </div>
        </div>

        {/* 7-Day Clinical Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Card 1: 7-Day Avg Heart Rate */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>7-Day Mean HR</span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{avg7DayHr}</span>
              <span className="text-xs font-semibold text-slate-500">BPM</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px]">
              {hrDiffFrom7DayAvg >= 0 ? (
                <span className="text-slate-600 flex items-center">
                  <ArrowUpRight className="w-3 h-3 text-amber-600" />
                  Live: +{hrDiffFrom7DayAvg} BPM
                </span>
              ) : (
                <span className="text-slate-600 flex items-center">
                  <ArrowDownRight className="w-3 h-3 text-teal-600" />
                  Live: {hrDiffFrom7DayAvg} BPM
                </span>
              )}
              <span className="text-slate-400">· 56-99 range</span>
            </div>
          </div>

          {/* Card 2: 7-Day Avg SpO2 */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>7-Day Mean SpO2</span>
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">{avg7DaySpo2}%</span>
              <span className="text-xs font-semibold text-emerald-700">Optimal</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span>{timeInRangeSpo2Percent}% days &ge;95%</span>
              <span className="text-slate-400">· Low: 94%</span>
            </div>
          </div>

          {/* Card 3: Resting Nocturnal Dip */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Resting Heart Dip</span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 tabular-nums">58-64</span>
              <span className="text-xs font-semibold text-slate-500">BPM</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Normal 14% sleep dip</span>
            </div>
          </div>

          {/* Card 4: Sensor Source Quorum */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Quorum Integrity</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-teal-800">99.8%</span>
              <span className="text-xs font-semibold text-slate-500">Uptime</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate" title="Apple Watch + Masimo + Oura + BioButton">
              Watch · Masimo · Oura
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 20, bottom: 20, left: 10 }}
            >
              <defs>
                {/* Heart Rate Gradients */}
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>

                {/* SpO2 Gradients */}
                <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              {/* X Axis */}
              <XAxis 
                dataKey={resolution === 'daily' ? 'dayLabel' : 'timeLabel'} 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                interval={resolution === 'daily' ? 0 : 3}
                tickFormatter={(val, idx) => {
                  if (resolution === 'daily') {
                    const day = daily[idx];
                    return day ? `${val} (${day.formattedDate.split(' ')[1]})` : val;
                  }
                  return val;
                }}
              />

              {/* Primary Y Axis (Heart Rate in BPM) */}
              {(viewMode === 'dual' || viewMode === 'heart_rate') && (
                <YAxis
                  yAxisId="hrAxis"
                  stroke="#e11d48"
                  fontSize={11}
                  domain={[40, 130]}
                  tickLine={false}
                  axisLine={{ stroke: '#fecdd3' }}
                  tickFormatter={(val) => `${val} bpm`}
                  orientation="left"
                />
              )}

              {/* Secondary Y Axis (SpO2 in %) */}
              {(viewMode === 'dual' || viewMode === 'spo2') && (
                <YAxis
                  yAxisId="spo2Axis"
                  stroke="#0891b2"
                  fontSize={11}
                  domain={[80, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#cffafe' }}
                  tickFormatter={(val) => `${val}%`}
                  orientation={viewMode === 'dual' ? 'right' : 'left'}
                />
              )}

              <Tooltip 
                content={<CustomTooltip resolution={resolution} />} 
              />

              {/* Shaded Reference Area for Normal Heart Rate band (60-100 BPM) */}
              {showThresholdGuides && (viewMode === 'dual' || viewMode === 'heart_rate') && (
                <ReferenceArea
                  yAxisId="hrAxis"
                  y1={60}
                  y2={100}
                  fill="#f0fdf4"
                  fillOpacity={0.5}
                />
              )}

              {/* Reference Lines for Caregiver Alert Thresholds */}
              {showThresholdGuides && (viewMode === 'dual' || viewMode === 'heart_rate') && (
                <ReferenceLine
                  yAxisId="hrAxis"
                  y={thresholds.heartRate.maxWarn}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `HR Max Warn: ${thresholds.heartRate.maxWarn} BPM`,
                    position: 'insideTopLeft',
                    fill: '#be123c',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {showThresholdGuides && (viewMode === 'dual' || viewMode === 'spo2') && (
                <ReferenceLine
                  yAxisId="spo2Axis"
                  y={thresholds.spo2.minWarn}
                  stroke="#0284c7"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `SpO2 Min Warn: ${thresholds.spo2.minWarn}%`,
                    position: 'insideBottomRight',
                    fill: '#0369a1',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Heart Rate Area & Line */}
              {(viewMode === 'dual' || viewMode === 'heart_rate') && (
                <Area
                  yAxisId="hrAxis"
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (BPM)"
                  stroke="#e11d48"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hrGradient)"
                  dot={{ r: resolution === 'daily' ? 4 : 2, stroke: '#e11d48', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#be123c', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* SpO2 Area & Line */}
              {(viewMode === 'dual' || viewMode === 'spo2') && (
                <Line
                  yAxisId="spo2Axis"
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2 Blood Oxygen"
                  stroke="#0891b2"
                  strokeWidth={2.5}
                  dot={{ r: resolution === 'daily' ? 4 : 2, stroke: '#0891b2', strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, stroke: '#0e7490', strokeWidth: 2, fill: '#ffffff' }}
                />
              )}

              {/* Resting Heart Rate Baseline for Daily View */}
              {resolution === 'daily' && (viewMode === 'dual' || viewMode === 'heart_rate') && (
                <Line
                  yAxisId="hrAxis"
                  type="monotone"
                  dataKey="restingHeartRate"
                  name="Resting Heart Rate"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Guide Labels */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {(viewMode === 'dual' || viewMode === 'heart_rate') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                <span className="text-slate-700 font-medium">Heart Rate (BPM)</span>
              </div>
            )}
            {resolution === 'daily' && (viewMode === 'dual' || viewMode === 'heart_rate') && (
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-indigo-500 inline-block border-b border-dashed border-indigo-600"></span>
                <span className="text-slate-600 font-medium">Resting Heart Rate (HRV Baseline)</span>
              </div>
            )}
            {(viewMode === 'dual' || viewMode === 'spo2') && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block"></span>
                <span className="text-slate-700 font-medium">Blood Oxygen (SpO2 %)</span>
              </div>
            )}
            {showThresholdGuides && (
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-2 rounded bg-emerald-50 border border-emerald-200 inline-block"></span>
                <span>Normal Therapeutic Zone</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Hover points for detailed telemetry, activity notes &amp; sensor sources</span>
          </div>
        </div>
      </div>

      {/* 7-Day Day-by-Day Historical Log Table */}
      <div className="p-6 pt-0">
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              7-Day Chronological Biometric Log
            </span>
            <span className="text-[11px] text-slate-500">
              Synchronized with active Caregiver Thresholds
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                  <th className="p-3">Day / Date</th>
                  <th className="p-3">Heart Rate (Avg &amp; Range)</th>
                  <th className="p-3">SpO2 Oxygen</th>
                  <th className="p-3">Blood Pressure</th>
                  <th className="p-3">Glucose</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Clinical Context &amp; Sensor Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {daily.map((day, idx) => (
                  <tr key={idx} className={day.dayLabel === 'Today' ? 'bg-teal-50/40 font-medium' : 'hover:bg-slate-50/80 transition-colors'}>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{day.dayLabel}</span>
                        <span className="text-[11px] text-slate-400">({day.formattedDate})</span>
                        {day.dayLabel === 'Today' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                            Live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-bold font-mono text-slate-900">{day.avgHeartRate} BPM</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">({day.minHeartRate}-{day.maxHeartRate} BPM)</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`font-bold font-mono ${day.avgSpo2 < thresholds.spo2.minWarn ? 'text-amber-700' : 'text-slate-900'}`}>
                        {day.avgSpo2}%
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5">(min {day.minSpo2}%)</span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-slate-700">
                      {day.systolicBp}/{day.diastolicBp} mmHg
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-slate-700">
                      {day.glucoseAvg} mg/dL
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        day.status === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : day.status === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {day.status === 'optimal' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Optimal</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>{day.status === 'critical' ? 'Critical' : 'Warning'}</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 min-w-[200px]">
                      <div className="text-slate-700 line-clamp-1">{day.notes}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{day.sourceDevice}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
