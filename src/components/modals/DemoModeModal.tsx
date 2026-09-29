import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const DemoModeModal: React.FC = () => {
  const { demoModeModalOpen, setDemoModeModalOpen, attributionMeta } = useInvestigation();
  const isLive = Boolean(attributionMeta?.isLive);

  if (!demoModeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0f1219] border border-slate-700/70 rounded-lg p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>{isLive ? 'LIVE MODEL — DATA PROVENANCE' : 'DEMO MODE DISCLAIMER'}</span>
          </div>
          <button
            onClick={() => setDemoModeModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLive ? (
          <div className="py-4 text-xs font-mono leading-relaxed space-y-3 text-slate-300">
            <p>
              This investigation was computed by the <strong>live attribution model</strong> from the slick
              detected in your uploaded SAR scene.
            </p>
            <ul className="space-y-1 text-slate-400">
              <li>T0: <b className="text-slate-200">{attributionMeta!.t0Utc}</b> ({attributionMeta!.t0Source ?? 'unknown'})</li>
              <li>Winds: <b className="text-slate-200">{attributionMeta!.windSource}</b></li>
              <li>Currents: <b className="text-slate-200">{attributionMeta!.currentSource}</b></li>
              <li>AIS: <b className="text-slate-200">{attributionMeta!.aisSource === 'file' ? 'uploaded AIS file' : 'synthetic demo AIS'}</b></li>
            </ul>
            {attributionMeta!.warnings.length > 0 && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300/90 text-[11px] space-y-1">
                {attributionMeta!.warnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}
            <p className="text-slate-500 text-[11px]">{attributionMeta!.disclaimer}</p>
          </div>
        ) : (
        <div className="py-4 text-xs font-mono leading-relaxed space-y-3 text-slate-300">
          <p>
            This demonstration uses <strong>synthetic SAR, met-ocean, and AIS data</strong>.
          </p>
          <p className="text-slate-400">
            The SAR segmentation inference (DeepLabV3+ with ResNet-50) and reverse-Lagrangian trajectory reconstruction (ERA5 winds, CMEMS currents, 1,750 particles, 95% KDE envelopes) represent the actual mathematical pipeline but are executed here with deterministic simulated outputs for interactive client demonstration.
          </p>
          <p className="p-2.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300/90 text-[11px]">
            <strong>Important:</strong> No real vessel attribution is being performed. Vessel names and MMSI records are representative synthetic identifiers for research prototype demonstration.
          </p>
        </div>
        )}

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => setDemoModeModalOpen(false)}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
