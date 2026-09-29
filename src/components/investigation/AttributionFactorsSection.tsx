import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const AttributionFactorsSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { selectedVessel } = useInvestigation();

  const factors = [
    {
      name: 'Spatial proximity',
      weight: 45,
      actual: selectedVessel ? selectedVessel.spatialScore : 43.5,
      color: 'bg-emerald-500',
      desc: 'Distance from vessel track to 95% KDE centroid at closest approach',
    },
    {
      name: 'Temporal correlation',
      weight: 20,
      actual: selectedVessel ? selectedVessel.temporalScore : 19.2,
      color: 'bg-sky-500',
      desc: 'Alignment with backwards Lagrangian arrival timestamp',
    },
    {
      name: 'Course similarity',
      weight: 20,
      actual: selectedVessel ? selectedVessel.courseScore : 19.8,
      color: 'bg-purple-500',
      desc: 'Collinearity between vessel heading (COG) and slick PCA axis (40.8°)',
    },
    {
      name: 'Speed consistency',
      weight: 15,
      actual: selectedVessel ? selectedVessel.speedScore : 11.5,
      color: 'bg-amber-500',
      desc: 'Stability of speed over ground (SOG) through release corridor',
    },
  ];

  return (
    <div className="border border-slate-200 rounded-xl bg-white font-mono text-xs overflow-hidden shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#0F62FE]" />
          <span className="font-bold text-[#1E293B] text-[11px]">
            Attribution factors
          </span>
          {selectedVessel && (
            <span className="px-2 py-0.5 rounded-full bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-[10px] text-[#0F62FE] font-bold">
              {selectedVessel.vesselName}: {selectedVessel.culpritScorePct}%
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#64748B]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1.5 space-y-3 border-t border-slate-200">
          {/* Horizontal multi-color contribution bar */}
          <div>
            <div className="text-[10px] text-[#64748B] mb-1.5 flex justify-between font-medium">
              <span>Model Weight Allocation</span>
              <span className="text-[#0F62FE] font-bold">100% Total</span>
            </div>
            <div className="h-2.5 w-full rounded-full flex overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
              <div style={{ width: '45%' }} className="bg-emerald-500 transition-all duration-300" title="Spatial Proximity: 45%" />
              <div style={{ width: '20%' }} className="bg-[#0F62FE] transition-all duration-300" title="Temporal Correlation: 20%" />
              <div style={{ width: '20%' }} className="bg-indigo-500 transition-all duration-300" title="Course Similarity: 20%" />
              <div style={{ width: '15%' }} className="bg-[#D95800] transition-all duration-300" title="Speed Consistency: 15%" />
            </div>
          </div>

          {/* Factor rows */}
          <div className="space-y-2 text-[11px]">
            {factors.map((f) => (
              <div
                key={f.name}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all duration-150 space-y-1"
              >
                <div className="flex justify-between items-center text-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${f.color} shadow-xs`} />
                    <span className="font-semibold text-[#1E293B]">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    {selectedVessel && (
                      <span className="text-[#0F62FE] font-bold">
                        {f.actual.toFixed(1)} /
                      </span>
                    )}
                    <span className="text-[#64748B] font-medium">{f.weight}%</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B] pl-4 leading-tight">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
