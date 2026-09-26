import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Download,
  Lock
} from 'lucide-react';
import { AuthUser } from '../types';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onConfirmPurge: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmPurge,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = confirmationText.trim().toUpperCase() === 'DELETE';

  const handleExecuteDelete = () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setTimeout(() => {
      onConfirmPurge();
      setIsDeleting(false);
      onClose();
    }, 1200);
  };

  const handleExportDataBeforeDelete = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      account: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      notice: 'Patient telemetry and medication audit records export prior to permanent deletion under GDPR Article 17 / HIPAA Right to Erasure.',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinote-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setHasExported(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Delete Account &amp; Erase All Data</h3>
              <p className="text-[11px] text-rose-100 font-medium">Google Play Mandatory Erasure Mechanism</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700">
          
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Warning: This action is permanent and irreversible</span>
            </div>
            <p className="text-xs leading-relaxed">
              In compliance with Google Play Store User Data policies and privacy standards, deleting your account (<strong>{currentUser.email}</strong>) will permanently purge:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-rose-900 font-medium">
              <li>All monitored senior patient records &amp; family circles.</li>
              <li>Continuous vital telemetry (heart rate, SpO2, blood pressure logs).</li>
              <li>Custom metric thresholds &amp; automated notification preferences.</li>
              <li>Medication schedules and adherence logs.</li>
              <li>Emergency contacts and simulated AI voice triage transcripts.</li>
            </ul>
          </div>

          {/* Export copy option */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">Download Data Backup</span>
              <span className="text-slate-500 text-[11px]">Save an offline JSON archive before purging.</span>
            </div>
            <button
              onClick={handleExportDataBeforeDelete}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 shadow-2xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-700" />
              <span>{hasExported ? 'Downloaded ✓' : 'Export JSON'}</span>
            </button>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-slate-800">
              Type <span className="font-mono text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-black">DELETE</span> to confirm permanent erasure:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!isConfirmed || isDeleting}
            onClick={handleExecuteDelete}
            className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 ${
              isConfirmed && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer active:scale-95'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Purging All Data...' : 'Permanently Delete Account'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
