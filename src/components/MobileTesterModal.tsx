import React, { useState } from 'react';
import { 
  Smartphone, 
  X, 
  Copy, 
  CheckCheck, 
  ExternalLink, 
  QrCode, 
  Info, 
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';

interface MobileTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileTesterModal: React.FC<MobileTesterModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // The live active development app URL running right now on Google Cloud Run
  const liveDevUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') 
        ? 'https://ais-dev-iir3vezt3hqwq2icud2eeu-304932023515.asia-southeast1.run.app' 
        : window.location.origin)
    : 'https://ais-dev-iir3vezt3hqwq2icud2eeu-304932023515.asia-southeast1.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(liveDevUrl)}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(liveDevUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Test KINOTE on Mobile Phone</h3>
              <p className="text-[11px] text-teal-200/80">Active Development Instance (Live Sync)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Why the previous link gave "URL Not Found"?</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              The preview link (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">ais-pre-...</code>) is only created when you click the "Share/Publish" button in AI Studio. 
              Your active running server is the <strong>Development URL (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">ais-dev-...</code>)</strong> shown below:
            </p>
          </div>

          {/* QR Code and Scan Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col items-center">
              <img 
                src={qrCodeUrl} 
                alt="Scan to open KINOTE on mobile" 
                className="w-40 h-40 object-contain rounded-lg"
              />
              <span className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-teal-600" />
                Scan with Phone Camera
              </span>
            </div>

            <div className="space-y-3 text-left w-full">
              <div>
                <p className="text-xs font-bold text-slate-900">Fastest Way to Test:</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Point your iPhone or Android camera at the QR code to open KINOTE instantly in your mobile browser.
                </p>
              </div>

              {/* Direct Copy Box */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Active Server URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={liveDevUrl}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* How to Install to Home Screen on Mobile */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-teal-700" />
              <span>How to Install on Your Phone (Full-Screen Native App Experience):</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <span>📱 On Android (Chrome):</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Open the link in Chrome. Tap the <strong>⋮ (three dots)</strong> menu in the top-right corner, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <span>🍎 On iPhone (Safari):</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Open the link in Safari. Tap the <strong>Share</strong> button <Share2 className="w-3 h-3 inline text-blue-600" /> at the bottom, scroll down and tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            No app store download needed
          </span>
          <div className="flex items-center gap-2">
            <a
              href={liveDevUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
