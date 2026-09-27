import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { InvestigationStepId } from '../../types';
import { Clock, MapPin } from 'lucide-react';

interface PipelineStep {
  id: number;
  targetStep: InvestigationStepId;
  name: string;
}

const STEPS: PipelineStep[] = [
  { id: 1, targetStep: 1, name: 'SAR Detection' },
  { id: 2, targetStep: 2, name: 'Slick Characterisation' },
  { id: 3, targetStep: 3, name: 'Lagrangian Simulation' },
  { id: 4, targetStep: 5, name: 'AIS Screening & Suspects' },
  { id: 5, targetStep: 7, name: 'Investigation Report' },
];

export const PipelineNav: React.FC = () => {
  const { activeStep, setActiveStep, goToRoute, currentCase, geometry } = useInvestigation();

  const handleStepClick = (targetStep: InvestigationStepId) => {
    setActiveStep(targetStep);
    if (targetStep === 1 || targetStep === 2) {
      goToRoute('detection');
    } else if (targetStep === 7) {
      goToRoute('report');
    } else {
      goToRoute('investigation');
    }
  };

  return (
    <aside className="w-[240px] bg-[#091728] border-r border-[#1168a0]/40 flex flex-col justify-between py-4 px-3 select-none z-20 shrink-0 text-xs text-[#edf4fd]">
      <div>
        <div className="text-[10px] uppercase text-[#89bada] tracking-wider mb-4 px-1 font-bold">
          INVESTIGATION PROGRESS
        </div>

        <nav className="space-y-1.5">
          {STEPS.map((s) => {
            const isCompleted = activeStep > s.targetStep;
            const isCurrent =
              s.targetStep === 3
                ? activeStep === 3 || activeStep === 4
                : s.targetStep === 5
                ? activeStep === 5 || activeStep === 6
                : activeStep === s.targetStep;

            return (
              <button
                key={s.id}
                onClick={() => handleStepClick(s.targetStep)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors text-[11px] cursor-pointer ${
                  isCurrent
                    ? 'bg-[#1168a0] text-white font-bold border-l-4 border-[#f1aa6f] shadow-sm'
                    : isCompleted
                    ? 'text-[#edf4fd]/90 hover:text-white hover:bg-[#1168a0]/20'
                    : 'text-[#89bada]/70 hover:text-[#edf4fd] hover:bg-[#1168a0]/20'
                }`}
              >
                <span
                  className={`w-4 text-center font-bold text-xs ${
                    isCompleted
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-[#f1aa6f]'
                      : 'text-[#89bada]/60'
                  }`}
                >
                  {isCompleted ? '✓' : s.id}
                </span>
                <span className="truncate">{s.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Oil Slick Coordinates & Time Card */}
      <div className="p-2.5 rounded-xl bg-[#0c1e33] border border-[#1168a0]/40 text-[10px] text-[#edf4fd] shadow-sm space-y-2">
        <div className="flex items-center justify-between border-b border-[#1168a0]/30 pb-1 text-[9.5px]">
          <span className="text-[#89bada] uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f1aa6f]" />
            Oil Slick T0
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#1168a0]/30 text-[#f1aa6f] font-mono font-bold text-[9px]">
            {currentCase.id}
          </span>
        </div>

        <div className="space-y-1.5">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#89bada] flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3 text-[#f1aa6f]" />
              <span>Time of Slick</span>
            </div>
            <div className="text-[10.5px] font-semibold text-white pl-4">
              26 Oct 2019, 05:53 AM
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-wider text-[#89bada] flex items-center gap-1 font-semibold">
              <MapPin className="w-3 h-3 text-[#89bada]" />
              <span>Coordinates</span>
            </div>
            <div className="text-[10px] font-mono text-[#edf4fd] pl-4">
              {geometry.centroid.lat.toFixed(4)}°N, {geometry.centroid.lon.toFixed(4)}°E
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
