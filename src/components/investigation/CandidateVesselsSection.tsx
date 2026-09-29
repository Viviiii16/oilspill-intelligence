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
    <div className="space-y-2.5 text-xs text-[#1E293B]">
      <div className="text-[11px] text-[#D95800] uppercase tracking-wider font-bold">
        Candidate Vessels (Ranked by Attribution Score)
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="bg-[#F1F5F9] text-[#64748B] border-b border-slate-200 font-bold text-[10.5px]">
              <th className="py-2.5 px-3">Rank</th>
              <th className="py-2.5 px-3">Vessel</th>
              <th className="py-2.5 px-3">MMSI</th>
              <th className="py-2.5 px-3">MDO</th>
              <th className="py-2.5 px-3 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {suspects.slice(0, 5).map((v) => {
              const isSelected = selectedVessel?.mmsi === v.mmsi;
              return (
                <tr
                  key={v.mmsi}
                  onClick={() => handleSelectVessel(v)}
                  className={`cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#0F62FE]/10 text-[#1E293B] font-semibold border-l-2 border-[#0F62FE]'
                      : 'hover:bg-slate-50 text-[#1E293B]'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-center text-[10px] ${
                        v.rank === 1
                          ? 'bg-orange-50 text-[#D95800] border border-[#D95800]/50 font-bold shadow-xs'
                          : v.rank <= 3
                          ? 'bg-blue-50 text-[#0F62FE] border border-[#0F62FE]/30 font-semibold'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {v.rank.toString().padStart(2, '0')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 truncate max-w-[110px] text-[#1E293B] font-medium">
                    {v.vesselName}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#64748B] text-[10px]">
                    {v.mmsi}
                  </td>
                  <td className="py-2.5 px-3 text-[#D95800] font-medium">
                    {v.mdoKm.toFixed(2)} km
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#0F62FE]">
                    {v.culpritScorePct}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10.5px] text-[#64748B] pl-0.5">
        Clicking a vessel highlights track and synchronizes origin envelope at closest approach.
      </p>
    </div>
  );
};
