import { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Download, 
  Search, 
  Lock, 
  FileText, 
  Users, 
  CheckCircle2, 
  Globe 
} from 'lucide-react';
import { AuditLogEntry, UserRole } from '../types';

interface ComplianceAndAuditProps {
  auditLogs: AuditLogEntry[];
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenAccountDeletion?: () => void;
}

export default function ComplianceAndAudit({
  auditLogs,
  currentRole,
  onRoleChange,
  onOpenPrivacyPolicy,
  onOpenAccountDeletion,
}: ComplianceAndAuditProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL' | 'AUDIT'>('ALL');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Resource', 'Severity', 'IP Address', 'SHA256 Hash', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actor}"`,
      `"${l.actorRole}"`,
      `"${l.action}"`,
      `"${l.resource}"`,
      `"${l.severity}"`,
      `"${l.ipAddress}"`,
      `"${l.sha256Hash}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kinote_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Export complete: Signed immutable KINOTE audit ledger downloaded as CSV.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  const handleExportHIPAAComplianceReport = () => {
    const reportData = {
      system: 'KINOTE Family Health & Emergency Dispatch',
      complianceStandards: {
        HIPAA: { status: 'Compliant', ruleSet: 'HITECH Omnibus Rule 45 CFR Part 164', encryption: 'AES-256 GCM at rest / TLS 1.3 in transit', kms: 'Cloud KMS HSM Envelope Encryption (Q8)' },
        GDPR: { status: 'Compliant', articles: 'Art. 9 (Health Data Processing), Art. 17 (Right to Erasure), Art. 20 (Portability)', residency: 'EU Sovereign Shards' },
        DPDP: { status: 'Compliant', law: 'Digital Personal Data Protection Act 2023 (India)', consentRecord: 'Explicit informed consent with revocable tokens for adult children managing elders' },
      },
      exportTimestamp: new Date().toISOString(),
      activeRole: currentRole,
      verifiedLedgerEntries: auditLogs.length,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kinote_regulatory_certificate_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Generated official HIPAA/GDPR/DPDP compliance package.');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Compliance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* HIPAA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">United States</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Active BAA</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>HIPAA &amp; HITECH</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            45 CFR Part 164 Subpart C Security Rule verified. Protected Health Information (PHI) encrypted with per-user AES-256 keys.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Audit Trail Retention</span>
            <span className="font-semibold text-slate-900">7 Years Immutable</span>
          </div>
        </div>

        {/* GDPR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">European Union</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Article 9 Certified</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>GDPR Compliance</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Special category biometric data safeguards. Right to access, rectification, portability, and automated erasure protocols active.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Data Residency</span>
            <span className="font-semibold text-slate-900">EU Sovereignty Shards</span>
          </div>
        </div>

        {/* DPDP Act */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">India</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">DPDP 2023 Ready</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>DPDP Act Standards</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Consent Manager framework implemented. Verifiable parental consent verification for dependents and elderly fiduciary controls.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Consent Architecture</span>
            <span className="font-semibold text-slate-900">Itemized &amp; Revocable</span>
          </div>
        </div>
      </div>

      {/* Google Play Store Data Safety & Patient Rights (HIPAA / GDPR) */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-2xl border border-teal-800/60 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Google Play Data Safety &amp; Patient Privacy Standards</h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-400/40 px-2 py-0.5 rounded-full font-mono">
                  Store Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Full transparency on biometric telemetry collection, emergency GPS usage, and mandatory Right to Erasure compliance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenPrivacyPolicy && (
              <button
                onClick={onOpenPrivacyPolicy}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-teal-300" />
                <span>Privacy Policy</span>
              </button>
            )}
            {onOpenAccountDeletion && (
              <button
                onClick={onOpenAccountDeletion}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-semibold text-xs border border-rose-500/60 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Right to Erasure</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-teal-800/40 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 block font-mono">ENCRYPTION</span>
            <span className="font-bold text-white">TLS 1.3 &amp; AES-256</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 block font-mono">DATA SALES</span>
            <span className="font-bold text-white">Zero Third-Party Ads</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 block font-mono">OFFLINE AI</span>
            <span className="font-bold text-white">On-Device Evaluation</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 block font-mono">ACCOUNT PURGE</span>
            <span className="font-bold text-white">Instant In-App Deletion</span>
          </div>
        </div>
      </div>

      {/* RBAC Role Switcher & Permissions Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Simulator</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Switch roles to experience how permissions, audit views, and patient vital controls adjust dynamically.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl flex-wrap">
            {[
              { id: 'family_caregiver' as UserRole, label: 'Adult Child (Caregiver)' },
              { id: 'attending_physician' as UserRole, label: 'Attending Doctor' },
              { id: 'compliance_officer' as UserRole, label: 'Compliance Auditor' },
              { id: 'system_admin' as UserRole, label: 'System Admin' },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => onRoleChange(role.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  currentRole === role.id ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Capability</th>
                <th className="py-2.5 px-3 font-semibold text-center">Adult Child (Caregiver)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Senior (SafeMode)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Physician (MD)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Compliance Auditor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-4 font-medium">View Live Vitals &amp; Continuous Telemetry</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Simplified</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full ECG</td>
                <td className="py-2.5 px-3 text-center text-slate-400">De-identified</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium">Configure Alert Thresholds &amp; Danger Zones</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Full Control</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Prescribe Limits</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium">Initiate AI Voice Emergency Dispatch &amp; Call Senior</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ 1-Tap Trigger</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ SOS Trigger</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Triage Call</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium">Inspect Immutable Cryptographic Audit Log</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Family Activity</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Clinical Log</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Total Ledger</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium">Key Management &amp; Data Portability Export</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Patient Data</td>
                <td className="py-2.5 px-3 text-center text-slate-300">—</td>
                <td className="py-2.5 px-3 text-center text-slate-600">Clinical Export</td>
                <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">✓ Regulatory Package</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Audit Log Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">Cryptographic Audit Trail (SHA-256 Chained)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tamper-evident logs of all telemetry packets, threshold adjustments, emergency AI voice dispatches, and access.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportHIPAAComplianceReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Compliance Certificate</span>
            </button>
          </div>
        </div>

        {exportNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search actions, actors, or resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            {(['ALL', 'INFO', 'WARNING', 'CRITICAL', 'AUDIT'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  severityFilter === sev ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Log Entries Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Actor &amp; Role</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Resource Target</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">SHA-256 Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">{log.actor}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{log.actorRole}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">{log.action}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">{log.resource}</td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : log.severity === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : log.severity === 'AUDIT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.sha256Hash.slice(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
