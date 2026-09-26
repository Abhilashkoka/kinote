import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Bell, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  Check, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  PhoneCall, 
  RotateCcw, 
  Info, 
  Heart, 
  Droplet, 
  ChevronRight,
  Sliders,
  Send,
  UserCheck
} from 'lucide-react';
import { 
  MedicationItem, 
  MedicationDoseLog, 
  MedicationDoseStatus,
  MedicationFrequency
} from '../types';
import { calculateMedicationAdherence } from '../utils/medicationAdherence';
import MedicationAdherenceCharts from './MedicationAdherenceCharts';

interface MedicationManagementProps {
  medications: MedicationItem[];
  doseLogs: MedicationDoseLog[];
  onLogDose: (medicationId: string, status: MedicationDoseStatus, skipReason?: string) => void;
  onAddMedication: (newMed: Omit<MedicationItem, 'id' | 'createdAt'>) => void;
  onUpdateMedicationReminders?: (medicationId: string, reminderTimes: string[], channels: MedicationItem['reminders']['notificationChannels']) => void;
  onAskAI?: (prompt: string) => void;
  patientName?: string;
}

export default function MedicationManagement({
  medications,
  doseLogs,
  onLogDose,
  onAddMedication,
  onUpdateMedicationReminders,
  onAskAI,
  patientName = 'Eleanor Vance',
}: MedicationManagementProps) {
  // Navigation tabs within component
  const [activeTab, setActiveTab] = useState<'schedule' | 'directory' | 'adherence'>('schedule');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedForReminders, setSelectedMedForReminders] = useState<MedicationItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [skipModalDose, setSkipModalDose] = useState<MedicationDoseLog | null>(null);
  const [skipReasonText, setSkipReasonText] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Medication Form State
  const [newName, setNewName] = useState('');
  const [newGenericName, setNewGenericName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newForm, setNewForm] = useState<MedicationItem['form']>('tablet');
  const [newFrequency, setNewFrequency] = useState<MedicationFrequency>('once_daily');
  const [newTimingCategory, setNewTimingCategory] = useState<MedicationItem['timingCategory']>('morning');
  const [newScheduledTime, setNewScheduledTime] = useState('08:00 AM');
  const [newPrescribedFor, setNewPrescribedFor] = useState('');
  const [newPrescribingDoctor, setNewPrescribingDoctor] = useState('Dr. Aris Thorne');
  const [newPillsRemaining, setNewPillsRemaining] = useState(60);
  const [newRefillDays, setNewRefillDays] = useState(30);
  const [newInstructions, setNewInstructions] = useState('');
  const [newColorTheme, setNewColorTheme] = useState('teal');
  const [enableVoiceCallReminder, setEnableVoiceCallReminder] = useState(true);
  const [enableSmsReminder, setEnableSmsReminder] = useState(true);
  const [enablePushReminder, setEnablePushReminder] = useState(true);
  const [enableSafeModeChime, setEnableSafeModeChime] = useState(true);

  // Compute live adherence summary
  const { summary, todaySchedule, perMedicationStats } = calculateMedicationAdherence(
    medications,
    doseLogs
  );

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleMarkTaken = (medId: string) => {
    onLogDose(medId, 'taken');
    showToast('Dose logged as taken. Synchronized with Kinote AI Assistant.');
  };

  const handleConfirmSkip = () => {
    if (!skipModalDose) return;
    onLogDose(skipModalDose.medicationId, 'skipped', skipReasonText || 'Caregiver logged reason');
    setSkipModalDose(null);
    setSkipReasonText('');
    showToast('Dose recorded as skipped with caregiver note.');
  };

  const handleSaveNewMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDosage.trim()) return;

    onAddMedication({
      name: newName.trim(),
      genericName: newGenericName.trim() || newName.trim(),
      dosage: newDosage.trim(),
      form: newForm,
      frequency: newFrequency,
      timingCategory: newTimingCategory,
      scheduledTimes: [newScheduledTime],
      prescribedFor: newPrescribedFor.trim() || 'General therapeutic wellness',
      prescribingDoctor: newPrescribingDoctor.trim() || 'Dr. Aris Thorne',
      refillRemainingDays: Number(newRefillDays) || 30,
      pillsRemaining: Number(newPillsRemaining) || 60,
      instructions: newInstructions.trim() || 'Take as directed with water.',
      colorTheme: newColorTheme,
      reminders: {
        enabled: true,
        reminderTimes: [newScheduledTime],
        notificationChannels: {
          pushNotification: enablePushReminder,
          smsAlert: enableSmsReminder,
          aiVoiceCallIfMissed: enableVoiceCallReminder,
          seniorSafeModeChime: enableSafeModeChime,
        },
        gracePeriodMinutes: 45,
      },
    });

    // Reset and close
    setNewName('');
    setNewGenericName('');
    setNewDosage('');
    setNewPrescribedFor('');
    setNewInstructions('');
    setIsAddModalOpen(false);
    showToast(`Successfully added ${newName} to Eleanor's medication roster.`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Toast Notice */}
      {successToast && (
        <div className="bg-emerald-800 text-white text-xs px-4 py-2.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-200 hover:text-white font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Medication Management &amp; Adherence</h3>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  AI Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Log daily doses, configure smart reminders, and track adherence visible to both caregiver and Kinote AI.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'schedule' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today&apos;s Schedule ({todaySchedule.length})
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'directory' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prescriptions ({medications.length})
            </button>
            <button
              onClick={() => setActiveTab('adherence')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'adherence' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30-Day Adherence &amp; Trends
            </button>
          </div>

            <button
              onClick={() => {
                const targetDose = todaySchedule.find(d => d.status !== 'taken' && d.status !== 'missed') || todaySchedule[todaySchedule.length - 1];
                if (targetDose) {
                  onLogDose(targetDose.medicationId, 'missed', 'Simulated missed dose alert: unacknowledged after 45-min grace window');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Test caregiver push notification when a dose is missed"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Missed Dose Alert</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medication</span>
            </button>
        </div>
      </div>

      {/* KPI Adherence Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/70 border-b border-slate-100 text-xs">
        {/* Metric 1: 7-Day Adherence */}
        <div className="p-3.5 sm:p-4">
          <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            7-Day Adherence
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-slate-900">{summary.overallAdherenceRate}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.2 rounded">
              High Adherence
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Physician target: &ge;90%
          </span>
        </div>

        {/* Metric 2: Adherence Streak */}
        <div className="p-3.5 sm:p-4">
          <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Adherence Streak
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900">{summary.sevenDayStreak}</span>
            <span className="text-xs text-slate-500 font-medium">Days Clean</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Zero missed doses this week
          </span>
        </div>

        {/* Metric 3: Today's Taken / Scheduled */}
        <div className="p-3.5 sm:p-4">
          <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            Today&apos;s Progress
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-slate-900">
              {summary.todayTakenCount} <span className="text-sm font-normal text-slate-400">/ {summary.todayScheduledCount}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Doses Taken</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {summary.todayScheduledCount - summary.todayTakenCount} upcoming tonight
          </span>
        </div>

        {/* Metric 4: AI Voice Reminders */}
        <div className="p-3.5 sm:p-4">
          <span className="text-slate-500 block text-[11px] font-medium flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-500" />
            Escalation Backup
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-slate-900">AI Voice Check</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Dials Eleanor if &gt;45m late
          </span>
        </div>

        {/* Metric 5: AI Assistant Sync Indicator */}
        <div className="p-3.5 sm:p-4 bg-teal-50/40">
          <span className="text-teal-900 block text-[11px] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            AI Bot Live Feed
          </span>
          <span className="text-[11px] font-bold text-teal-900 mt-1 block">
            ● Active Bi-directional Sync
          </span>
          <span className="text-[10px] text-teal-700 block mt-0.5">
            AI answers caregiver queries on adherence in real-time.
          </span>
        </div>
      </div>

      {/* Tab 1: Today's Medication Timeline Schedule */}
      {activeTab === 'schedule' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Today&apos;s Schedule (Friday, Sep 25, 2026)</h4>
              <p className="text-xs text-slate-500">Live timeline of scheduled doses and confirmation events.</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {todaySchedule.filter((d) => d.status === 'taken').length} of {todaySchedule.length} Complete
            </span>
          </div>

          <div className="space-y-3">
            {todaySchedule.map((dose) => {
              const isTaken = dose.status === 'taken';
              const isUpcoming = dose.status === 'upcoming';
              const isDue = dose.status === 'due';
              const isMissed = dose.status === 'missed';
              const isSkipped = dose.status === 'skipped';

              // Find associated medication details
              const med = medications.find((m) => m.id === dose.medicationId);

              return (
                <div
                  key={dose.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isTaken
                      ? 'bg-emerald-50/20 border-emerald-200/80'
                      : isMissed
                      ? 'bg-rose-50/40 border-rose-300'
                      : isDue
                      ? 'bg-amber-50/40 border-amber-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Left: Time and Pill Icon */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isTaken
                        ? 'bg-emerald-100 text-emerald-800'
                        : isMissed
                        ? 'bg-rose-100 text-rose-800'
                        : isDue
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Pill className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{dose.medicationName}</span>
                        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                          {dose.dosage}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isTaken
                            ? 'bg-emerald-100 text-emerald-800'
                            : isMissed
                            ? 'bg-rose-100 text-rose-800'
                            : isDue
                            ? 'bg-amber-100 text-amber-800'
                            : isSkipped
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isTaken ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isTaken ? 'Taken' : isMissed ? 'Missed' : isDue ? 'Due Now' : isSkipped ? 'Skipped' : 'Upcoming'}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Scheduled: {dose.scheduledTime}
                        </span>
                        {med && (
                          <>
                            <span>•</span>
                            <span>{med.prescribedFor}</span>
                          </>
                        )}
                        {dose.loggedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              Logged at {dose.loggedAt} ({dose.loggedBy === 'patient' ? 'By Eleanor' : 'By David'})
                            </span>
                          </>
                        )}
                      </div>

                      {dose.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{dose.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isTaken ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Confirmed on SafeMode</span>
                        </span>
                      </div>
                    ) : isMissed ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-rose-800 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Missed Alert Active</span>
                        </span>
                        <button
                          onClick={() => handleMarkTaken(dose.medicationId)}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
                        >
                          Resolve (Taken Late)
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleMarkTaken(dose.medicationId)}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Taken</span>
                        </button>
                        <button
                          onClick={() => onLogDose(dose.medicationId, 'missed', 'Caregiver confirmed dose was missed')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium transition-colors cursor-pointer"
                          title="Alert caregivers of missed dose"
                        >
                          Mark Missed
                        </button>
                        <button
                          onClick={() => setSkipModalDose(dose)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                        >
                          Skip
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Full Prescriptions Directory & Reminders Configuration */}
      {activeTab === 'directory' && (
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Active Prescriptions ({medications.length})</h4>
              <p className="text-xs text-slate-500">Configured reminder channels, prescribing clinicians, and refill tracking.</p>
            </div>
            
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterCategory('morning')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterCategory === 'morning' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Morning
              </button>
              <button
                onClick={() => setFilterCategory('with_meals')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterCategory === 'with_meals' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                With Meals
              </button>
              <button
                onClick={() => setFilterCategory('bedtime')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterCategory === 'bedtime' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Bedtime
              </button>
            </div>
          </div>

          {/* Medication Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {medications
              .filter((m) => filterCategory === 'all' || m.timingCategory === filterCategory)
              .map((med) => {
                const medStats = perMedicationStats.find((s) => s.medicationId === med.id);
                return (
                  <div
                    key={med.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-teal-200 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          med.colorTheme === 'rose'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : med.colorTheme === 'teal'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : med.colorTheme === 'indigo'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-slate-900">{med.name}</h5>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {med.dosage}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block font-medium">
                            {med.genericName} • {med.form.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {medStats?.adherenceRate || 100}% Adherence
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-900">Instructions:</strong> {med.instructions}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Indication</span>
                        <span className="font-medium text-slate-800 line-clamp-1">{med.prescribedFor}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Prescribed By</span>
                        <span className="font-medium text-slate-800 line-clamp-1">{med.prescribingDoctor}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Schedule</span>
                        <span className="font-medium text-teal-800">
                          {med.scheduledTimes.join(', ')} ({med.frequency.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pills &amp; Refill</span>
                        <span className={`font-semibold ${med.refillRemainingDays < 20 ? 'text-amber-600' : 'text-slate-800'}`}>
                          {med.pillsRemaining} pills ({med.refillRemainingDays} days left)
                        </span>
                      </div>
                    </div>

                    {/* Reminders Pill Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap text-slate-500">
                        <span className="font-semibold text-slate-700">Reminders:</span>
                        {med.reminders.notificationChannels.pushNotification && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">Push</span>
                        )}
                        {med.reminders.notificationChannels.smsAlert && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">SMS</span>
                        )}
                        {med.reminders.notificationChannels.seniorSafeModeChime && (
                          <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 font-medium">SafeMode Chime</span>
                        )}
                        {med.reminders.notificationChannels.aiVoiceCallIfMissed && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-800 font-semibold flex items-center gap-0.5">
                            <PhoneCall className="w-2.5 h-2.5" />
                            AI Voice Backup
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedMedForReminders(med)}
                        className="text-teal-700 hover:text-teal-900 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Adherence Analytics & Biometric Correlation */}
      {activeTab === 'adherence' && (
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <h4 className="text-sm font-bold text-slate-900">7-Day Adherence &amp; Biometric Quorum Correlation</h4>
            <p className="text-xs text-slate-500">
              Evaluates whether prescribed therapies correlate with positive cardiovascular and metabolic stability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lisinopril Correlation Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span className="font-bold text-slate-900">Lisinopril 10mg ➔ Blood Pressure Stability</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  Optimal Response
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Consistent morning dosing (100% adherence over last 7 days) has kept mean blood pressure at <strong>121/77 mmHg</strong>, comfortably within the systolic target band (&lt;135 mmHg).
              </p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Source: Omron Evolv Wireless Cuff &amp; Apple Watch Pulse Transit Time.
              </div>
            </div>

            {/* Metformin Correlation Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-slate-900">Metformin ER 500mg ➔ Dexcom CGM Time-in-Range</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                  96% TIR Target
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Twice-daily doses taken with breakfast and dinner have maintained continuous glucose at an average of <strong>106 mg/dL</strong>, eliminating nocturnal hyperglycemic spikes.
              </p>
              <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                Source: Dexcom G7 Continuous Glucose Stream.
              </div>
            </div>
          </div>

          {/* Adherence breakdown table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-700 flex items-center justify-between">
              <span>Medication Breakdown</span>
              <span>7-Day Completed / Total Doses</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {perMedicationStats.map((stat) => (
                <div key={stat.medicationId} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{stat.name}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-emerald-700 font-medium">{stat.adherenceRate}% Adherence</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600">{stat.takenCount} / {stat.totalCount} doses</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Normal
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full 30-Day Recharts Adherence Rates & Trends Visualizer */}
          <MedicationAdherenceCharts
            medications={medications}
            doseLogs={doseLogs}
            patientName={patientName}
            onAskAI={onAskAI}
          />
        </div>
      )}

      {/* AI Assistant Integration Footer Banner */}
      <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-semibold text-white">Kinote AI Assistant Real-Time Visibility</div>
            <div className="text-slate-300 text-[11px]">
              The AI bot answers any medication status question using this live schedule and logs.
            </div>
          </div>
        </div>

        {onAskAI && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onAskAI("Did Eleanor take all her morning medications today?")}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 border border-teal-600 text-white font-medium transition-colors shadow-2xs whitespace-nowrap"
            >
              Ask AI: Morning Meds Status
            </button>
            <button
              onClick={() => onAskAI("What is Eleanor's current medication adherence and refill status?")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium transition-colors shadow-2xs whitespace-nowrap"
            >
              Ask AI: Adherence &amp; Refills
            </button>
          </div>
        )}
      </div>

      {/* Modal: Add New Medication */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Log New Prescription</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewMedication} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amlodipine"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 mg"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as MedicationFrequency)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                  >
                    <option value="once_daily">Once Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="three_times_daily">Three Times Daily</option>
                    <option value="as_needed">As Needed (PRN)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    value={newScheduledTime}
                    onChange={(e) => setNewScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Indication / Prescribed For</label>
                <input
                  type="text"
                  placeholder="e.g. Blood pressure regulation"
                  value={newPrescribedFor}
                  onChange={(e) => setNewPrescribedFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prescribing Doctor</label>
                  <input
                    type="text"
                    value={newPrescribingDoctor}
                    onChange={(e) => setNewPrescribingDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pill Supply &amp; Days</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newPillsRemaining}
                      onChange={(e) => setNewPillsRemaining(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                      placeholder="Pills"
                    />
                    <input
                      type="number"
                      value={newRefillDays}
                      onChange={(e) => setNewRefillDays(Number(e.target.value))}
                      className="w-1/2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs"
                      placeholder="Days"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Caregiver Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with food. Do not skip if blood pressure is normal."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:border-teal-600 text-xs"
                />
              </div>

              {/* Notification Reminders Config */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Configured Notification Reminders
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePushReminder}
                      onChange={(e) => setEnablePushReminder(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span>Push Notification</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSafeModeChime}
                      onChange={(e) => setEnableSafeModeChime(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span>SafeMode Screen Chime</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSmsReminder}
                      onChange={(e) => setEnableSmsReminder(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span>SMS Alert to Caregiver</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVoiceCallReminder}
                      onChange={(e) => setEnableVoiceCallReminder(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
                    />
                    <span>AI Voice Call if Missed</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-sm"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Skip Reason */}
      {skipModalDose && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-3 animate-in fade-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900">Record Skipped Dose</h4>
            <p className="text-xs text-slate-600">
              Please state why <strong>{skipModalDose.medicationName}</strong> was skipped today:
            </p>

            <div className="space-y-1.5 text-xs">
              {['Mild nausea / stomach upset', 'Patient fasting for lab tests', 'Advised to hold by Dr. Thorne', 'Temporary supply refill delay'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSkipReasonText(reason)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    skipReasonText === reason ? 'bg-teal-50 border-teal-300 font-semibold text-teal-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              placeholder="Or enter custom reason..."
              value={skipReasonText}
              onChange={(e) => setSkipReasonText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs focus:bg-white"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSkipModalDose(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Reminders */}
      {selectedMedForReminders && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">Edit Reminders: {selectedMedForReminders.name}</h4>
              <button onClick={() => setSelectedMedForReminders(null)} className="text-slate-400 font-bold">&times;</button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 font-semibold">Reminder Timing</label>
              <input
                type="text"
                defaultValue={selectedMedForReminders.scheduledTimes.join(', ')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300"
              />

              <label className="block text-slate-700 font-semibold pt-2">Active Channels</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={selectedMedForReminders.reminders.notificationChannels.pushNotification} />
                  <span>Push notification to caregiver</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={selectedMedForReminders.reminders.notificationChannels.smsAlert} />
                  <span>SMS alert if unacknowledged</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={selectedMedForReminders.reminders.notificationChannels.seniorSafeModeChime} />
                  <span>SafeMode chime on Eleanor&apos;s screen</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked={selectedMedForReminders.reminders.notificationChannels.aiVoiceCallIfMissed} />
                  <span>AI Voice call escalation (&gt;45m late)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedMedForReminders(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedMedForReminders(null);
                  showToast('Reminder preferences updated.');
                }}
                className="px-4 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-bold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
