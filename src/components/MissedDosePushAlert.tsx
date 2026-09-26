import React, { useEffect } from 'react';
import { 
  Bell, 
  PhoneCall, 
  AlertTriangle, 
  X, 
  Clock, 
  ShieldAlert, 
  Pill, 
  Sparkles,
  ChevronRight,
  Volume2
} from 'lucide-react';
import { MissedDoseNotification } from '../types';
import { playEmergencyChime } from '../utils/speech';

interface MissedDosePushAlertProps {
  notification: MissedDoseNotification | null;
  onDismiss: () => void;
  onNotifySenior: (notification: MissedDoseNotification) => void;
  onViewSchedule?: () => void;
}

export default function MissedDosePushAlert({
  notification,
  onDismiss,
  onNotifySenior,
  onViewSchedule,
}: MissedDosePushAlertProps) {
  useEffect(() => {
    if (!notification) return;

    // Play chime sound
    playEmergencyChime();

    // Trigger native browser notification if supported and granted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const nativeNotification = new Notification(`🚨 Missed Dose: ${notification.patientName}`, {
            body: `${notification.medicationName} (${notification.dosage}) scheduled for ${notification.scheduledTime} was missed. Tap to Notify Senior via AI Voice.`,
            tag: notification.id,
            requireInteraction: true,
          });
          nativeNotification.onclick = () => {
            window.focus();
            onNotifySenior(notification);
            nativeNotification.close();
          };
        } catch {
          // ignore native notification errors
        }
      } else if (Notification.permission !== 'denied') {
        try {
          Notification.requestPermission();
        } catch {
          // ignore
        }
      }
    }
  }, [notification, onNotifySenior]);

  if (!notification) return null;

  return (
    <aside
      aria-label="Missed medication alert"
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
    >
      <div className="bg-slate-900 text-white rounded-2xl border-2 border-rose-500/80 shadow-2xl overflow-hidden backdrop-blur-xl ring-4 ring-rose-500/20">
        {/* Urgent Header Bar */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 px-4 py-2.5 border-b border-rose-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-rose-400 uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Caregiver Push Notification</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              {notification.timestamp}
            </span>
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Dismiss Notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification Body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="w-5 h-5 text-rose-400" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Missed Medication Alert</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono border border-rose-700/50">
                    Overdue
                  </span>
                </h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">{notification.patientName}</strong> missed scheduled dose of{' '}
                <strong className="text-rose-300">{notification.medicationName}</strong> ({notification.dosage}).
              </p>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Scheduled for: <strong className="text-slate-300">{notification.scheduledTime}</strong>
                </span>
                <span>•</span>
                <span className="text-amber-400 font-medium">Grace period expired</span>
              </div>
            </div>
          </div>

          {/* Clinical Telemetry Context Box */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-semibold text-slate-200">Sensor &amp; Telemetry Quorum:</span> No pillbox compartment opening registered on bedside dispenser. Previous missed doses correlated with elevated morning blood pressure (+9 mmHg).
            </div>
          </div>

          {/* Primary One-Tap Action: Notify Senior */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => onNotifySenior(notification)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 active:scale-98 group cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <PhoneCall className="w-3.5 h-3.5 text-white animate-bounce" />
              </div>
              <span className="text-sm tracking-wide">Notify Senior (Kinote AI Voice)</span>
            </button>

            <button
              onClick={() => {
                onDismiss();
                if (onViewSchedule) onViewSchedule();
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Log</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Bottom Alert Ticker */}
        <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-teal-400 font-semibold">
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>AI Voice Bridge Ready (Option A ➔ C ➔ B)</span>
          </span>
          <button 
            onClick={onDismiss}
            className="hover:underline text-slate-400"
          >
            Acknowledge &amp; Silence
          </button>
        </div>
      </div>
    </aside>
  );
}
