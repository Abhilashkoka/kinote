import { useState } from 'react';
import { 
  Users, 
  ChevronDown, 
  Plus, 
  Heart, 
  Activity, 
  MapPin, 
  ShieldCheck, 
  Check, 
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { PatientProfile, MembershipDetails } from '../types';

interface PatientSwitcherProps {
  patients: PatientProfile[];
  activePatientId: string;
  onSelectPatient: (patientId: string) => void;
  membership: MembershipDetails;
  onAddNewPatient?: (newPatient: PatientProfile) => void;
  onRenamePatient?: (patientId: string, newName: string) => void;
}

export default function PatientSwitcher({
  patients,
  activePatientId,
  onSelectPatient,
  membership,
  onAddNewPatient,
  onRenamePatient,
}: PatientSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New patient modal inputs
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('Relative');
  const [newAge, setNewAge] = useState('75');
  const [newCondition, setNewCondition] = useState('Mild Arrhythmia & Fall Risk');

  // Rename modal
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const openRename = (patient: PatientProfile) => {
    setRenameTargetId(patient.id);
    setRenameValue(patient.name);
    setRenameError(null);
    setIsOpen(false);
  };

  const closeRename = () => {
    setRenameTargetId(null);
    setRenameValue('');
    setRenameError(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = renameValue.trim();
    if (!name) {
      setRenameError('Enter a name.');
      return;
    }
    if (name.length > 60) {
      setRenameError('Keep the name under 60 characters.');
      return;
    }
    if (renameTargetId && onRenamePatient) onRenamePatient(renameTargetId, name);
    closeRename();
  };

  const activePatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const isAtLimit = patients.length >= membership.maxSeniors;

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !onAddNewPatient) return;

    const newProfile: PatientProfile = {
      id: `patient-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelationship,
      age: parseInt(newAge) || 75,
      gender: 'Unspecified',
      roomOrUnit: 'Independent Living Suite 2A',
      primaryCondition: newCondition,
      avatarBg: 'from-purple-600 to-indigo-800',
      location: activePatient.location,
      vitals: {
        heartRate: 0,
        spo2: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        respiratoryRate: 0,
        temperature: 0,
        glucose: 0,
        fallDetected: false,
        timestamp: 'Awaiting device sync',
      },
      thresholds: activePatient.thresholds,
      medications: [],
      doseLogs: [],
      devices: [], // Fresh isolated profile: 0 paired devices
      emergencyContacts: activePatient.emergencyContacts,
    };

    onAddNewPatient(newProfile);
    setShowAddModal(false);
    setNewName('');
  };

  return (
    <div className="relative">
      {/* Switcher Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-950 text-xs font-bold transition-all shadow-2xs cursor-pointer group shrink-0"
        title={`Switch Monitored Senior (${activePatient.name})`}
      >
        <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">
          {activePatient.name.charAt(0)}
        </div>
        <div className="text-left flex flex-col">
          <span className="leading-tight flex items-center gap-1">
            <span className="truncate max-w-[65px] xs:max-w-[85px] sm:max-w-none">{activePatient.name}</span>
            <span className="text-[10px] text-teal-700 font-normal hidden md:inline">({activePatient.relationship})</span>
          </span>
          <span className="text-[9px] text-teal-600 font-mono font-medium hidden sm:block">
            HR: {activePatient.vitals.heartRate} BPM • BP: {activePatient.vitals.bloodPressureSystolic}/{activePatient.vitals.bloodPressureDiastolic}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-700 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Switcher Dropdown Modal / Popover */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Centered on mobile screen, anchored beneath button on desktop */}
          <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:left-0 top-20 sm:top-auto sm:mt-2 max-w-sm sm:w-85 mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Monitored Family Circle</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {patients.length} of {membership.maxSeniors} active
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden text-slate-400 hover:text-white font-bold p-1 text-base leading-none cursor-pointer"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

          <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
            {patients.map((p) => {
              const isSelected = p.id === activePatientId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {p.name.charAt(0)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {p.relationship}, {p.age}y
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {p.primaryCondition}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono pt-1">
                        <span className={p.vitals.heartRate > 0 ? "text-emerald-700 font-bold" : "text-slate-400 font-medium"}>
                          {p.vitals.heartRate > 0 ? `HR: ${p.vitals.heartRate} BPM` : 'Vitals Standby'}
                        </span>
                        <span>•</span>
                        <span>
                          {p.devices.length > 0 ? `${p.devices.length} wearable${p.devices.length > 1 ? 's' : ''}` : '0 devices paired'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onRenamePatient && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRename(p);
                        }}
                        className="w-6 h-6 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-100/70 flex items-center justify-center cursor-pointer"
                        title={`Rename ${p.name}`}
                        aria-label={`Rename ${p.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              disabled={isAtLimit}
              title={isAtLimit ? `${membership.planName} covers ${membership.maxSeniors} ${membership.maxSeniors === 1 ? 'person' : 'people'}. Upgrade in Membership & Billing to add more.` : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                isAtLimit
                  ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                  : 'text-teal-700 hover:bg-teal-100/80 cursor-pointer'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAtLimit ? `Plan covers ${membership.maxSeniors} · Upgrade to add more` : 'Add Monitored Relative'}</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      </>
      )}

      {/* Rename Monitored Person Modal */}
      {renameTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Rename</h3>
              <button
                onClick={closeRename}
                className="text-slate-400 hover:text-slate-700 font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="rename-patient" className="font-semibold text-slate-700">Name</label>
                <input
                  id="rename-patient"
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => {
                    setRenameValue(e.target.value);
                    setRenameError(null);
                  }}
                  placeholder="e.g. Mom or Lakshmi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
                {renameError && <p className="text-[11px] text-rose-600">{renameError}</p>}
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeRename}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Monitored Relative Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Monitored Senior Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Margaret Miller"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Relationship</label>
                  <select
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="In-Law">In-Law</option>
                    <option value="Grandparent">Grandparent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Age</label>
                  <input
                    type="number"
                    min="50"
                    max="115"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Primary Health Condition / Focus</label>
                <input
                  type="text"
                  placeholder="e.g. Atrial Fibrillation, Fall Risk, Memory Care"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p>
                  Isolated Circadian Baselines &amp; Custom Thresholds will automatically be generated for this new senior without affecting Eleanor or Robert.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold"
                >
                  Save &amp; Connect Wearables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
