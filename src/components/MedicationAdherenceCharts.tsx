import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  LineChart,
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Pill, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight, 
  Info, 
  Moon, 
  Sun, 
  RotateCcw,
  ShieldAlert,
  Flame,
  Activity,
  Heart
} from 'lucide-react';
import { 
  MedicationItem, 
  MedicationDoseLog, 
  DailyMedicationAdherencePoint,
  MissedDoseEvent
} from '../types';
import { generate30DayMedicationReport } from '../utils/medication30DayData';

interface MedicationAdherenceChartsProps {
  medications: MedicationItem[];
  doseLogs: MedicationDoseLog[];
  patientName?: string;
  onAskAI?: (prompt: string) => void;
}

type ChartViewType = 'adherence_rate' | 'dose_breakdown' | 'time_of_day' | 'per_medication';

export default function MedicationAdherenceCharts({
  medications,
  doseLogs,
  patientName = 'Eleanor Miller',
  onAskAI,
}: MedicationAdherenceChartsProps) {
  const [chartView, setChartView] = useState<ChartViewType>('adherence_rate');
  const [selectedMedFilter, setSelectedMedFilter] = useState<string>('all');
  const [highlightMissedOnly, setHighlightMissedOnly] = useState(false);
  const [showThresholdGuides, setShowThresholdGuides] = useState(true);
  const [selectedEventModal, setSelectedEventModal] = useState<MissedDoseEvent | null>(null);

  // Generate 30-day analytics report
  const report = useMemo(() => {
    return generate30DayMedicationReport(medications, doseLogs);
  }, [medications, doseLogs]);

  // Filter daily points based on selected medication or missed doses toggle
  const filteredDailyPoints = useMemo(() => {
    let points = report.dailyPoints;

    if (highlightMissedOnly) {
      points = points.filter((p) => p.hasMissedDose || p.skippedCount > 0);
    }

    if (selectedMedFilter !== 'all') {
      // Find stats for this med
      const medStat = report.perMedication30DayStats.find((m) => m.medicationId === selectedMedFilter);
      if (medStat) {
        // Adjust points for this specific med
        return points.map((p) => {
          const missedThisMed = p.missedMedications.some((m) => 
            m.toLowerCase().includes(medStat.name.toLowerCase().split(' ')[0])
          );
          const isTaken = !missedThisMed;
          return {
            ...p,
            adherenceRate: isTaken ? 100 : 0,
            takenCount: isTaken ? 1 : 0,
            missedCount: missedThisMed ? 1 : 0,
            hasMissedDose: missedThisMed,
          };
        });
      }
    }

    return points;
  }, [report, selectedMedFilter, highlightMissedOnly]);

  // Custom Dot for Area/Line chart to highlight days with missed doses
  const CustomChartDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    if (payload.hasMissedDose) {
      return (
        <g key={`dot-${payload.date}`}>
          <circle cx={cx} cy={cy} r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={9} fill="none" stroke="#ef4444" strokeWidth={1.5} opacity={0.6} className="animate-ping" />
        </g>
      );
    }

    if (payload.skippedCount > 0) {
      return (
        <circle key={`dot-skip-${payload.date}`} cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
      );
    }

    return null;
  };

  // Custom tooltip for rich compliance details
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: DailyMedicationAdherencePoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-xs max-w-xs space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-200">
              {data.dayLabel}, {data.formattedDate}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                data.adherenceRate === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : data.adherenceRate >= 80
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {data.adherenceRate}% Adherence
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] py-1 bg-slate-800/60 rounded-lg">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Taken</span>
              <span className="font-bold text-emerald-400">{data.takenCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Missed</span>
              <span className={`font-bold ${data.missedCount > 0 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}`}>
                {data.missedCount}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Skipped</span>
              <span className="font-bold text-amber-400">{data.skippedCount}</span>
            </div>
          </div>

          {data.hasMissedDose && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-800/80 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Missed Dose Event</span>
              </div>
              <p className="text-rose-200/90 leading-tight">
                {data.missedMedications.join(', ')}
              </p>
              {data.notes && (
                <p className="text-slate-300 text-[10px] italic border-t border-rose-800/40 pt-1">
                  &ldquo;{data.notes}&rdquo;
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>AM: <strong className="text-slate-200">{data.morningAdherenceRate}%</strong></span>
            <span>PM: <strong className={data.eveningAdherenceRate < 80 ? 'text-rose-300' : 'text-slate-200'}>{data.eveningAdherenceRate}%</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
      {/* Header & Controls Toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              30-Day Medication Adherence &amp; Missed Dose Analysis
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Recharts Visualizer
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Continuous compliance trajectory, time-of-day discrepancy, and behavioral trend detection for {patientName}.
          </p>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Medication Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMedFilter}
              onChange={(e) => setSelectedMedFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 focus:outline-hidden pr-2 cursor-pointer"
            >
              <option value="all">All Prescriptions (4 Meds)</option>
              {medications.map((med) => (
                <option key={med.id} value={med.id}>
                  {med.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Highlight Missed Doses */}
          <button
            onClick={() => setHighlightMissedOnly(!highlightMissedOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              highlightMissedOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${highlightMissedOnly ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>{highlightMissedOnly ? 'Showing Missed Doses Only' : 'Highlight Missed Doses'}</span>
          </button>

          {/* Ask AI Shortcut */}
          {onAskAI && (
            <button
              onClick={() => onAskAI("Analyze Eleanor's 30-day medication adherence and missed doses trends")}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Ask AI Analysis</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Metrics Strip */}
      <div className="px-5 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* KPI 1: 30-Day Adherence Rate */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>30-Day Compliance</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Target ≥95%
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {report.thirtyDayAdherenceRate}%
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                ({report.totalDosesTaken}/{report.totalDosesScheduled} doses)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200/60">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Above 80% clinical efficacy line</span>
            </div>
          </div>

          {/* KPI 2: Missed Doses Total */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Total Missed Doses</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                {report.totalDosesMissed} Missed
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                {report.totalDosesMissed}
              </span>
              <span className="text-xs text-slate-500">
                + {report.totalDosesSkipped} approved skip
              </span>
            </div>
            <div className="text-[11px] text-rose-700 flex items-center gap-1 pt-1 border-t border-slate-200/60 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>71% occurred on Sunday evenings</span>
            </div>
          </div>

          {/* KPI 3: Adherence Streak */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Current Streak</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                Best: {report.longestStreakDays}d
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-teal-800 font-mono">
                {report.currentStreakDays} Days
              </span>
              <span className="text-xs font-semibold text-teal-600">Unbroken</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-200/60">
              <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Zero misses since Sep 15</span>
            </div>
          </div>

          {/* KPI 4: AM vs PM Adherence Gap */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Time-of-Day Gap</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                -16.2% Evening
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                {report.morningAdherenceRate}% <span className="text-xs text-slate-400 font-normal">AM</span> / {report.eveningAdherenceRate}% <span className="text-xs text-slate-400 font-normal">PM</span>
              </span>
            </div>
            <div className="text-[11px] text-amber-700 flex items-center gap-1 pt-1 border-t border-slate-200/60 font-medium">
              <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Evening fatigue &amp; bedtime forgetfulness</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart View Mode Switcher */}
      <div className="px-5 sm:px-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setChartView('adherence_rate')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chartView === 'adherence_rate'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Adherence % Trajectory
            </button>
            <button
              onClick={() => setChartView('dose_breakdown')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chartView === 'dose_breakdown'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Dose Breakdown
            </button>
            <button
              onClick={() => setChartView('time_of_day')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                chartView === 'time_of_day'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>AM vs PM Divergence</span>
            </button>
            <button
              onClick={() => setChartView('per_medication')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                chartView === 'per_medication'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medication Comparison
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <button
              onClick={() => setShowThresholdGuides(!showThresholdGuides)}
              className="hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${showThresholdGuides ? 'bg-teal-600' : 'bg-slate-300'}`} />
              <span>{showThresholdGuides ? 'Guides: 80% & 95%' : 'Guides: Hidden'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="px-5 sm:px-6">
        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
          <div className="h-72 sm:h-80 w-full">
            {chartView === 'adherence_rate' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredDailyPoints}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    domain={[40, 105]}
                    ticks={[50, 60, 70, 80, 90, 100]}
                    unit="%"
                  />
                  <Tooltip content={<CustomChartTooltip />} />

                  {showThresholdGuides && (
                    <>
                      <ReferenceLine 
                        y={95} 
                        stroke="#0d9488" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Target: 95%', position: 'insideTopRight', fill: '#0d9488', fontSize: 10, fontWeight: 'bold' }} 
                      />
                      <ReferenceLine 
                        y={80} 
                        stroke="#f59e0b" 
                        strokeDasharray="4 4" 
                        label={{ value: 'Clinical Min: 80%', position: 'insideBottomRight', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} 
                      />
                    </>
                  )}

                  <Area
                    type="monotone"
                    dataKey="adherenceRate"
                    name="Daily Adherence"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#adherenceGradient)"
                    dot={<CustomChartDot />}
                    activeDot={{ r: 6, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartView === 'dose_breakdown' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredDailyPoints}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  stackOffset="none"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    domain={[0, 6]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    unit=" doses"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar dataKey="takenCount" name="Doses Taken" fill="#0f766e" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="skippedCount" name="Skipped (Reason Logged)" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="missedCount" name="Missed Doses (Alert)" fill="#e11d48" stackId="a" radius={[3, 3, 0, 0]}>
                    {filteredDailyPoints.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.missedCount > 0 ? '#e11d48' : '#0f766e'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartView === 'time_of_day' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredDailyPoints}
                  margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    domain={[40, 105]}
                    ticks={[50, 60, 70, 80, 90, 100]}
                    unit="%"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <ReferenceLine 
                    y={80} 
                    stroke="#94a3b8" 
                    strokeDasharray="3 3" 
                    label={{ value: '80% Benchmark', fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="morningAdherenceRate"
                    name="Morning Routine (08:00 AM - 100% Avg)"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0284c7' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="eveningAdherenceRate"
                    name="Evening & Bedtime (07:00 & 09:30 PM - 82.1% Avg)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#e11d48' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartView === 'per_medication' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={report.perMedication30DayStats}
                  layout="vertical"
                  margin={{ top: 15, right: 30, left: 70, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[70, 100]} 
                    unit="%" 
                    stroke="#94a3b8" 
                    fontSize={10}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`${val}% Adherence Rate`, '30-Day Rate']}
                  />
                  <ReferenceLine x={95} stroke="#0d9488" strokeDasharray="3 3" label={{ value: 'Target 95%', fill: '#0d9488', fontSize: 10 }} />
                  <Bar dataKey="adherenceRate" radius={[0, 6, 6, 0]}>
                    {report.perMedication30DayStats.map((entry, index) => (
                      <Cell 
                        key={`bar-${index}`} 
                        fill={entry.adherenceRate >= 95 ? '#0f766e' : entry.adherenceRate >= 85 ? '#d97706' : '#e11d48'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200 mt-2 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-700" />
                <span>Optimal Dose (100%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Missed Dose Event (Alert Triggered)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Caregiver-Approved Skip</span>
              </span>
            </div>
            <span className="italic text-slate-400">
              Aggregated across 150 scheduled doses · Last synced 2 mins ago
            </span>
          </div>
        </div>
      </div>

      {/* Missed Doses Log & Root Cause Analysis Section */}
      <div className="px-5 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Documented Missed Doses &amp; Incidents Log (Last 30 Days)
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {report.missedDoseEvents.length} Recorded Incidents
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {report.missedDoseEvents.map((evt) => (
            <div 
              key={evt.id}
              onClick={() => setSelectedEventModal(evt)}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-xs transition-all bg-white cursor-pointer space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {evt.medicationName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                    {evt.dosage}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  evt.id.startsWith('skipped')
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {evt.id.startsWith('skipped') ? 'Skipped' : 'Missed Dose'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{evt.formattedDate} ({evt.dayOfWeek})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{evt.scheduledTime}</span>
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                <strong>Cause:</strong> {evt.reason}
              </p>

              <div className="p-2 rounded bg-slate-50 border border-slate-100 text-[11px] space-y-0.5 text-slate-600">
                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span>Biometric Telemetry Correlation:</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">
                  {evt.impactDescription}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Trends & Behavioral Intelligence Panel */}
      <div className="px-5 sm:px-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Common Behavioral Patterns &amp; Clinical Action Items
            </h4>
          </div>
          <span className="text-xs text-teal-700 font-semibold">
            AI Triage Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.trendInsights.map((trend) => (
            <div
              key={trend.id}
              className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                trend.severity === 'alert'
                  ? 'bg-rose-50/40 border-rose-200'
                  : trend.severity === 'warning'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-teal-50/40 border-teal-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    trend.severity === 'alert'
                      ? 'bg-rose-100 text-rose-800'
                      : trend.severity === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {trend.category.replace('_', ' ')}
                  </span>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                    {trend.title}
                  </h5>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    {trend.metricValue}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {trend.description}
              </p>

              <div className="p-2.5 rounded-lg bg-white/90 border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Caregiver Recommendation:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {trend.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant Quick Actions Footer */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">
              Kinote AI Continuous Adherence Audit
            </div>
            <div className="text-slate-300 text-xs">
              AI monitors missed dose intervals and cross-references Apple Watch / Dexcom vital telemetry.
            </div>
          </div>
        </div>

        {onAskAI && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAskAI("What caused Eleanor to miss medications on Sunday Sep 14, and what was the blood pressure impact?")}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 border border-teal-600 text-white text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap"
            >
              Analyze Sep 14 Missed Dose
            </button>
            <button
              onClick={() => onAskAI("How can we eliminate Eleanor's Sunday evening medication forgetfulness?")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-colors shadow-2xs whitespace-nowrap"
            >
              Fix Sunday Drop-off
            </button>
          </div>
        )}
      </div>

      {/* Modal: Selected Missed Dose Event Inspection */}
      {selectedEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Incident Details</h4>
                  <p className="text-xs text-slate-500">{selectedEventModal.formattedDate} • {selectedEventModal.scheduledTime}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Medication</span>
                <div className="font-bold text-slate-900 text-sm">{selectedEventModal.medicationName} ({selectedEventModal.dosage})</div>
                <div className="text-slate-600">Scheduled: {selectedEventModal.scheduledTime} on {selectedEventModal.dayOfWeek}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold">Documented Context &amp; Root Cause:</span>
                <p className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-slate-800 leading-relaxed">
                  {selectedEventModal.reason}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold">Physiological &amp; Sensor Quorum Observation:</span>
                <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedEventModal.impactDescription}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold">Resolution &amp; Caregiver Action:</span>
                <p className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 text-teal-900 leading-relaxed">
                  {selectedEventModal.actionTaken}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              {onAskAI && (
                <button
                  onClick={() => {
                    const prompt = `Can you provide a clinical assessment of the missed dose of ${selectedEventModal.medicationName} on ${selectedEventModal.formattedDate}? Reason: ${selectedEventModal.reason}. Impact: ${selectedEventModal.impactDescription}`;
                    setSelectedEventModal(null);
                    onAskAI(prompt);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                  <span>Ask AI Assessment</span>
                </button>
              )}
              <button
                onClick={() => setSelectedEventModal(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
