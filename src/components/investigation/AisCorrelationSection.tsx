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
    <div className="space-y-4 text-xs text-[#1E293B]">

      {/* Live data provenance */}
      {isLive && attributionMeta!.aisSource !== 'file' && (
        <div className="p-2.5 rounded-xl bg-orange-50 border border-[#D95800]/40 text-[10.5px] text-[#D95800]">
          Synthetic demo AIS — no real AIS data was supplied, so these vessels are illustrative (one is planted as
          a known culprit). Upload an AIS file to rank real vessels.
        </div>
      )}

      {/* Screened Summary Row */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#64748B] block uppercase font-medium">Screened</span>
          <span className="text-base font-bold text-[#1E293B] mt-0.5 block">{screened}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#64748B] block uppercase font-medium">Relevant</span>
          <span className="text-base font-bold text-emerald-600 mt-0.5 block">{relevant}</span>
        </div>
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs transition-transform hover:scale-[1.02]">
          <span className="text-[10px] text-[#64748B] block uppercase font-medium">Candidates</span>
          <span className="text-base font-bold text-[#D95800] mt-0.5 block">{candidates}</span>
        </div>
      </div>

      {/* Selected Vessel Information Card */}
      {selectedVessel ? (
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2 text-[#1E293B] font-bold">
              <Ship className="w-4 h-4 text-[#0F62FE]" />
              <span className="text-xs">{selectedVessel.vesselName}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-[#D95800]/40 text-[10px] text-[#D95800] font-bold shadow-xs">
              RANK #{selectedVessel.rank}
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">MMSI</span>
              <span className="font-bold text-[#1E293B] font-mono">{selectedVessel.mmsi}</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">Vessel Type</span>
              <span className="text-[#1E293B] font-medium truncate max-w-[180px]">
                {selectedVessel.vesselType}
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">Speed</span>
              <span className="font-bold text-[#1E293B]">{selectedVessel.sogKn} kn</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">Course</span>
              <span className="font-bold text-[#1E293B]">
                {selectedVessel.cogDeg.toString().padStart(3, '0')}°
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">Last position</span>
              <span className="font-semibold text-[#1E293B]">
                {fmtLat(selectedVessel.latClosest)}, {fmtLon(selectedVessel.lonClosest)}
              </span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md bg-orange-50/80 border border-[#D95800]/30">
              <span className="text-[#D95800] font-medium">Closest approach</span>
              <span className="font-bold text-[#D95800]">{selectedVessel.mdoKm} km</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md hover:bg-slate-100 transition-colors">
              <span className="text-[#64748B]">Time</span>
              <span className="font-bold text-[#0F62FE]">T−{selectedVessel.closestHourBack}h</span>
            </div>
            <div className="flex justify-between py-1 px-1.5 rounded-md bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-700 font-medium">Attribution score</span>
              <span className="font-bold text-emerald-700">{selectedVessel.culpritScorePct}%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[11px] text-[#64748B] text-center shadow-xs">
          Click any vessel in the candidate list below or on the map to inspect details.
        </div>
      )}

      {/* Candidate Vessels Ranked List embedded directly */}
      <div className="pt-2 border-t border-slate-200">
        <CandidateVesselsSection />
      </div>
    </div>
  );
};
