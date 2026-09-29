import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const KdeInfoPanel: React.FC = () => {
  const { selectedKdeInfo, setSelectedKdeInfo, simDirection } = useInvestigation();

  // If in forward forecast, do not show hindcast KDE panel
  if (simDirection === 'FORWARD') return null;

  // Only display when user has explicitly clicked an envelope or centroid
  const step = selectedKdeInfo;
  if (!step) return null;

  return (
    <div className="absolute top-4 right-4 z-[450] bg-[#091728]/95 border border-[#1168a0]/60 rounded-xl p-3 text-xs text-[#edf4fd] backdrop-blur-md shadow-2xl w-68 select-none animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-[#1168a0]/40 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-[#89bada] font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#f1aa6f]" />
          <span>KDE ORIGIN ESTIMATE</span>
        </div>
        {selectedKdeInfo && (
          <button
            onClick={() => setSelectedKdeInfo(null)}
            className="text-[#89bada] hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[#89bada]">Time</span>
          <span className="text-white font-bold">T−{step.timeOffsetHours}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#89bada]">Timestamp</span>
          <span className="text-emerald-400 font-mono text-[10.5px] font-semibold">{step.timeUtc}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#89bada]">Confidence region</span>
          <span className="text-[#89bada] font-semibold">95%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#89bada]">Particles</span>
          <span className="text-white">1,750</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#89bada]">Envelope area</span>
          <span className="text-[#f1aa6f] font-semibold">{step.envelopeAreaKm2.toFixed(2)} km²</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#89bada]">Relative peak</span>
          <span className="text-emerald-400 font-semibold">
            {Math.round(step.relativePeakDensity * 100)}%
          </span>
        </div>

        <div className="border-t border-[#1168a0]/30 pt-1.5 mt-1 space-y-1">
          <div>
            <span className="text-[#89bada] block text-[10px]">KDE centroid:</span>
            <span className="text-[#edf4fd] font-bold font-mono">
              {step.centroid.lat.toFixed(4)}° N, {step.centroid.lon.toFixed(4)}° E
            </span>
          </div>
          <div>
            <span className="text-[#89bada] block text-[10px]">Density peak:</span>
            <span className="text-[#edf4fd] font-bold font-mono">
              {step.densityPeak.lat.toFixed(4)}° N, {step.densityPeak.lon.toFixed(4)}° E
            </span>
          </div>
        </div>

        {step.isKeyInterception && (
          <div className="mt-2 px-2 py-1 rounded bg-[#f1aa6f]/20 border border-[#f1aa6f]/50 text-[10px] text-[#f1aa6f] font-semibold flex items-center gap-1.5">
            <span>★</span>
            <span>AIS SPATIO-TEMPORAL INTERSECTION</span>
          </div>
        )}
      </div>
    </div>
  );
};
