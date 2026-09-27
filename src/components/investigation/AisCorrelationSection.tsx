import React from 'react';
import { Ship } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { CandidateVesselsSection } from './CandidateVesselsSection';

export const AisCorrelationSection: React.FC = () => {
  const { selectedVessel, aisSummary, suspects, attributionMeta } = useInvestigation();
  const isLive = Boolean(attributionMeta?.isLive);
  const screened = isLive ? aisSummary.interpolableVessels : 28;
  const relevant = isLive ? aisSummary.vesselsEnteringOriginEnvelope : 3;
  const candidates = isLive ? Math.min(5, suspects.length) : 5;
  const fmtLat = (v: number) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'N' : 'S'}`;
  const fmtLon = (v: number) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'E' : 'W'}`;

  return (
    <div className="space-y-4 text-xs text-[#edf4fd]">

      {/* Live data provenance */}
      {isLive && attributionMeta!.aisSource !== 'file' && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-[10.5px] text-amber-300">
          Synthetic demo AIS — no real AIS data was supplied, so these vessels are illustrative (one is planted as
          a known culprit). Upload an AIS file to rank real vessels.
        </div>
      )}

      {/* Screened Summary Row */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-3 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#89bada] block uppercase font-medium">Screened</span>
          <span className="text-base font-bold text-white mt-0.5 block">{screened}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#89bada] block uppercase font-medium">Relevant</span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">{relevant}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#89bada] block uppercase font-medium">Candidates</span>
          <span className="text-base font-bold text-[#f1aa6f] mt-0.5 block">{candidates}</span>
        </div>
      </div>

      {/* Selected Vessel Information Card */}
      {selectedVessel ? (
        <div className="p-3.5 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 space-y-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between border-b border-[#1168a0]/40 pb-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Ship className="w-4 h-4 text-[#89bada]" />
              <span className="text-xs">{selectedVessel.vesselName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f1aa6f]/20 border border-[#f1aa6f]/50 text-[10px] text-[#f1aa6f] font-bold shadow-xs">
              RANK #{selectedVessel.rank}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">MMSI</span>
              <span className="font-bold text-white font-mono">{selectedVessel.mmsi}</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">Vessel Type</span>
              <span className="text-[#edf4fd] font-medium truncate max-w-[180px]">
                {selectedVessel.vesselType}
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">Speed</span>
              <span className="font-bold text-white">{selectedVessel.sogKn} kn</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">Course</span>
              <span className="font-bold text-white">
                {selectedVessel.cogDeg.toString().padStart(3, '0')}°
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">Last position</span>
              <span className="font-semibold text-[#edf4fd]">
                {fmtLat(selectedVessel.latClosest)}, {fmtLon(selectedVessel.lonClosest)}
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md bg-[#f1aa6f]/10 border border-[#f1aa6f]/30">
              <span className="text-[#f1aa6f] font-medium">Closest approach</span>
              <span className="font-bold text-[#f1aa6f]">{selectedVessel.mdoKm} km</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-white/5 transition-colors">
              <span className="text-[#89bada]">Time</span>
              <span className="font-bold text-[#89bada]">T−{selectedVessel.closestHourBack}h</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-300 font-medium">Attribution score</span>
              <span className="font-bold text-emerald-300">{selectedVessel.culpritScorePct}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 text-[11px] text-[#89bada] text-center shadow-xs">
          Click any vessel in the candidate list below or on the map to inspect details.
        </div>
      )}

      {/* Candidate Vessels Ranked List embedded directly */}
      <div className="pt-2 border-t border-[#1168a0]/30">
        <CandidateVesselsSection />
      </div>
    </div>
  );
};
