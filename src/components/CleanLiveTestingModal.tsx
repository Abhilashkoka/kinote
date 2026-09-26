import React from 'react';
import { 
  Trash2, 
  X, 
  Radio, 
  CheckCircle2, 
  Database,
  Watch,
  Activity,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface CleanLiveTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeAndStartLive: () => void;
  activePatientName: string;
}

export const CleanLiveTestingModal: React.FC<CleanLiveTestingModalProps> = ({
  isOpen,
  onClose,
  onPurgeAndStartLive,
  activePatientName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-teal-300 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reset Database to 100% Live Mode</h3>
              <p className="text-[11px] text-teal-200">Delete all sample data &amp; listen strictly to real hardware</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
          
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-teal-900 text-xs">
              <Database className="w-4 h-4 text-teal-700 shrink-0" />
              <span>What happens when you switch to Clean Live Data:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-teal-900/90 pl-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span><strong>Purges All Sample Records:</strong> Erases pre-loaded test heart rate numbers, sample blood pressure logs, and simulated call histories.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span><strong>Standby Zero-State (<code className="font-mono bg-teal-100/80 px-1 py-0.5 rounded font-bold">-- BPM</code>):</strong> Telemetry dashboard resets to strict awaiting mode. No phantom numbers will ever be shown.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span><strong>Real Device Exclusive:</strong> Telemetry graphs and threshold alerts will ONLY register when transmitted directly from your physical watch or BLE sensor.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span><strong>Clears Browser Storage Cache:</strong> Wipes all demo fixtures from localStorage and starts a fresh live telemetry workspace for <strong>{activePatientName}</strong>.</span>
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Your login session and custom thresholds are preserved; only mock data is cleared.</span>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onPurgeAndStartLive();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Trash2 className="w-4 h-4 text-teal-200" />
            <span>Delete All Demo Data &amp; Switch to Live Only</span>
          </button>
        </div>

      </div>
    </div>
  );
};
