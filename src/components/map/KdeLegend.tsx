import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext';

export const KdeLegend: React.FC = () => {
  const { layers, simDirection, simHourBack, currentKdeStep } = useInvestigation();

  if (simDirection === 'FORWARD' || (!layers.kdeDensity && !layers.kdeEnvelopes && !layers.kdeCentroids)) {
    return null;
  }

  return (
    <div className="absolute bottom-6 right-4 z-[450] bg-[#091728]/95 border border-[#1168a0]/50 rounded-xl px-3.5 py-2.5 text-[10px] text-[#edf4fd] backdrop-blur-md shadow-2xl pointer-events-none space-y-2 select-none w-72">
      <div className="text-[9.5px] uppercase tracking-wider text-[#89bada] font-bold border-b border-[#1168a0]/40 pb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1168a0] border border-[#89bada]/60" />
          Hindcast Origin Envelopes
        </span>
        <span className="text-[#f1aa6f] font-bold">T−{Math.round(simHourBack)}h</span>
      </div>

      {/* Active Envelope Metrics */}
      {currentKdeStep && (
        <div className="grid grid-cols-2 gap-1.5 bg-[#061220]/70 p-1.5 rounded-lg border border-[#1168a0]/30 text-[9px]">
          <div>
            <span className="text-[#89bada] block">Centroid:</span>
            <span className="font-mono text-white font-semibold">
              {currentKdeStep.centroid.lat.toFixed(3)}°N, {currentKdeStep.centroid.lon.toFixed(3)}°E
            </span>
          </div>
          <div>
            <span className="text-[#89bada] block">95% Area:</span>
            <span className="text-[#f1aa6f] font-semibold">
              {currentKdeStep.envelopeAreaKm2.toFixed(1)} km²
            </span>
          </div>
        </div>
      )}

      {layers.kdeEnvelopes && (
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] text-[#89bada] font-medium">
            <span>T0 (Dark)</span>
            <span>T-6h</span>
            <span>T-12h</span>
            <span>T-16h (Peak)</span>
            <span>T-24h (Light)</span>
          </div>
          <div
            className="h-2.5 w-full rounded-md border border-[#1168a0]/60 shadow-inner"
            style={{
              background: 'linear-gradient(to right, #0c2e59 0%, #1168a0 25%, #2aa6e3 50%, #63cdfa 67%, #89bada 80%, #e4f3fd 100%)',
            }}
          />
          <div className="flex justify-between items-center text-[8px] text-[#89bada]">
            <span>Hours before T0 (Backward)</span>
            <span className="text-[#edf4fd] font-semibold">95% KDE Corridor</span>
          </div>
        </div>
      )}

      {layers.kdeDensity && (
        <div className="pt-1 border-t border-[#1168a0]/30">
          <div className="flex justify-between text-[8px] text-[#89bada] mb-0.5 font-medium">
            <span>Low Probability</span>
            <span>Peak Likelihood</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#0c2e59]/40 via-[#1168a0] to-[#e4f3fd] border border-[#1168a0]/50" />
        </div>
      )}

      <div className="flex items-center justify-between pt-1 text-[9px] border-t border-[#1168a0]/30 text-[#89bada]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f1aa6f] border border-white" />
          <span className="text-[#edf4fd]">Suspect Track</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#63cdfa]" />
          <span className="text-[#edf4fd]">Intercept (T-16h)</span>
        </div>
      </div>
    </div>
  );
};
