import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { SuspectVessel } from '../../types';

export const CandidateVesselsSection: React.FC = () => {
  const { suspects, selectedVessel, setSelectedVessel, setSimHourBack } = useInvestigation();

  const handleSelectVessel = (vessel: SuspectVessel) => {
    setSelectedVessel(vessel);
    // Align hindcast hour to vessel's closest approach hour
    setSimHourBack(vessel.closestHourBack);
  };

  return (
    <div className="space-y-2.5 text-xs text-[#edf4fd]">
      <div className="text-[11px] text-[#f1aa6f] uppercase tracking-wider font-bold">
        Candidate Vessels (Ranked by Attribution Score)
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1168a0]/40 bg-[#0c1e33] shadow-[0_4px_16px_rgba(0,0,0,0.25)] overflow-hidden">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#081524] text-[#89bada] border-b border-[#1168a0]/50 font-bold text-[10.5px]">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Vessel</th>
              <th className="py-2.5 px-3">MMSI</th>
              <th className="py-2.5 px-3">MDO</th>
              <th className="py-2.5 px-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1168a0]/30">
            {suspects.slice(0, 5).map((v) => {
              const isSelected = selectedVessel?.mmsi === v.mmsi;
              return (
                <tr
                  key={v.mmsi}
                  onClick={() => handleSelectVessel(v)}
                  className={`cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#1168a0]/30 text-white font-semibold border-l-2 border-[#f1aa6f]'
                      : 'hover:bg-white/[0.04] text-[#edf4fd]/90'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-center text-[10px] ${
                        v.rank === 1
                          ? 'bg-[#f1aa6f]/20 text-[#f1aa6f] border border-[#f1aa6f]/60 font-bold shadow-xs'
                          : v.rank <= 3
                          ? 'bg-[#1168a0]/30 text-[#89bada] border border-[#1168a0]/60 font-semibold'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      {v.rank.toString().padStart(2, '0')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 truncate max-w-[110px] text-white font-medium">
                    {v.vesselName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#89bada]/80 text-[10px]">
                    {v.mmsi}
                  </td>
                  <td className="py-2.5 px-3 text-[#f1aa6f] font-medium">
                    {v.mdoKm.toFixed(2)} km
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#89bada]">
                    {v.culpritScorePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10.5px] text-[#89bada]/80 pl-0.5">
        Clicking a vessel highlights track and synchronizes origin envelope at closest approach.
      </p>
    </div>
  );
};
