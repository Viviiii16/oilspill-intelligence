import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext';

export const KdeLegend: React.FC = () => {
  const { layers, simDirection, simHourBack, currentKdeStep } = useInvestigation();

  if (simDirection === 'FORWARD' || (!layers.kdeDensity && !layers.kdeEnvelopes && !layers.kdeCentroids)) {
    return null;
  }

  return (
    <div className="absolute bottom-6 right-4 z-[450] bg-white/95 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[10px] text-[#1E293B] backdrop-blur-md shadow-xl pointer-events-none space-y-2 select-none w-72">
      <div className="text-[9.5px] uppercase tracking-wider text-[#64748B] font-bold border-b border-slate-200 pb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0F62FE] border border-blue-400" />
          Hindcast Origin Envelopes
        </span>
        <span className="text-[#D95800] font-bold">T−{Math.round(simHourBack)}h</span>
      </div>

      {/* Active Envelope Metrics */}
      {currentKdeStep && (
        <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[9px]">
          <div>
            <span className="text-[#64748B] block">Centroid:</span>
            <span className="font-mono text-[#1E293B] font-semibold">
              {currentKdeStep.centroid.lat.toFixed(3)}°N, {currentKdeStep.centroid.lon.toFixed(3)}°E
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block">95% Area:</span>
            <span className="text-[#D95800] font-semibold">
              {currentKdeStep.envelopeAreaKm2.toFixed(1)} km²
            </span>
          </div>
        </div>
      )}

      {layers.kdeEnvelopes && (
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] text-[#64748B] font-medium">
            <span>T0</span>
            <span>T-6h</span>
            <span>T-12h</span>
            <span>T-16h (Peak)</span>
            <span>T-24h</span>
          </div>
          <div
            className="h-2.5 w-full rounded-md border border-slate-200 shadow-inner"
            style={{
              background: 'linear-gradient(to right, #0F62FE 0%, #2563eb 25%, #3b82f6 50%, #60a5fa 67%, #93c5fd 80%, #dbeafe 100%)',
            }}
          />
          <div className="flex justify-between items-center text-[8px] text-[#64748B]">
            <span>Hours before T0 (Backward)</span>
            <span className="text-[#1E293B] font-semibold">95% KDE Corridor</span>
          </div>
        </div>
      )}

      {layers.kdeDensity && (
        <div className="pt-1 border-t border-slate-200">
          <div className="flex justify-between text-[8px] text-[#64748B] mb-0.5 font-medium">
            <span>Low Probability</span>
            <span>Peak Likelihood</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#0F62FE]/20 via-[#0F62FE] to-[#93c5fd] border border-slate-200" />
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-[9px] border-t border-slate-200 text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D95800] border border-white shadow-xs" />
          <span className="text-[#1E293B]">Suspect Track</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#0F62FE]" />
          <span className="text-[#1E293B]">Intercept (T-16h)</span>
        </div>
      </div>
    </div>
  );
};
