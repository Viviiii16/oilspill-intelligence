import React, { useEffect } from 'react';
import { useInvestigation } from '../context/InvestigationContext';
import { PipelineNav } from '../components/common/PipelineNav';
import { GisMap } from '../components/map/GisMap';
import { LagrangianReconstructionSection } from '../components/investigation/LagrangianReconstructionSection';
import { AisCorrelationSection } from '../components/investigation/AisCorrelationSection';
import { ChevronLeft, ChevronRight, FileText, Waves, Radar, RotateCcw } from 'lucide-react';

export const Workspace: React.FC = () => {
  const { goToRoute, activeStep, setActiveStep } = useInvestigation();
  const [isNavCollapsed, setIsNavCollapsed] = React.useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = React.useState(false);

  // Default to step 3 (Lagrangian Hindcast) if arriving on investigation workspace
  useEffect(() => {
    if (activeStep < 3 || activeStep > 6) {
      setActiveStep(3);
    }
  }, [activeStep, setActiveStep]);

  const currentStep = activeStep < 3 || activeStep > 6 ? 3 : activeStep;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#091524] text-[#edf4fd] overflow-hidden select-none">
      {/* Center Three-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANE: Thin Stepper Navigation */}
        <div
          className={`h-full transition-all duration-200 relative z-20 flex shrink-0 ${
            isNavCollapsed ? 'w-0 overflow-hidden' : 'w-[240px]'
          }`}
        >
          <PipelineNav />
        </div>

        {/* Left Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-[#0f243a] border border-[#1168a0]/50 hover:border-[#89bada] text-[#89bada] hover:text-white p-1 rounded-r shadow-md transition-all cursor-pointer"
          style={{ left: isNavCollapsed ? '0px' : '240px' }}
          title={isNavCollapsed ? 'Expand Progress Stepper' : 'Collapse Progress Stepper'}
        >
          {isNavCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* CENTER PANE: GIS Map (Untouched) */}
        <div className="flex-1 h-full relative overflow-hidden bg-[#090b10]">
          <GisMap />
        </div>

        {/* Right Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-[#0f243a] border border-[#1168a0]/50 hover:border-[#89bada] text-[#89bada] hover:text-white p-1 rounded-l shadow-md transition-all cursor-pointer"
          style={{ right: isPanelCollapsed ? '0px' : '440px' }}
          title={isPanelCollapsed ? 'Expand Analysis Panel' : 'Collapse Analysis Panel'}
        >
          {isPanelCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* RIGHT PANE: Investigation Analysis Drawers (Width: 440px) */}
        <div
          className={`h-full bg-[#0a1829] border-l border-[#1168a0]/40 flex flex-col transition-all duration-300 relative z-20 shrink-0 text-[#edf4fd] shadow-2xl ${
            isPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[440px]'
          }`}
        >
          {/* Synchronized Stage Navigation - 2 Streamlined Tabs */}
          <div className="p-2.5 border-b border-[#1168a0]/30 bg-[#081524]/90 backdrop-blur-md shrink-0">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#060f1c] border border-[#1168a0]/40 gap-1.5">
              <button
                onClick={() => setActiveStep(3)}
                title="Lagrangian Hindcast (Simulation)"
                className={`w-full py-2 px-2 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
                  currentStep === 3 || currentStep === 4
                    ? 'bg-[#1168a0] text-white shadow-md font-bold'
                    : 'text-[#89bada]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Waves className={`w-4 h-4 shrink-0 transition-transform duration-200 ${(currentStep === 3 || currentStep === 4) ? 'text-[#f1aa6f] scale-110' : 'text-[#89bada]'}`} />
                <span className="truncate">Hindcast</span>
              </button>

              <button
                onClick={() => setActiveStep(5)}
                title="AIS Vessel Traffic Screening & Candidates"
                className={`w-full py-2 px-2 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
                  currentStep === 5 || currentStep === 6
                    ? 'bg-[#1168a0] text-white shadow-md font-bold'
                    : 'text-[#89bada]/80 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radar className={`w-4 h-4 shrink-0 transition-transform duration-200 ${(currentStep === 5 || currentStep === 6) ? 'text-[#f1aa6f] scale-110' : 'text-[#89bada]'}`} />
                <span className="truncate">AIS Screening & Suspects</span>
              </button>
            </div>
          </div>

          {/* Right Pane Stage-Specific Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            <div className="animate-in fade-in-50 duration-200 space-y-4">
              {(currentStep === 3 || currentStep === 4) && <LagrangianReconstructionSection />}
              {(currentStep === 5 || currentStep === 6) && <AisCorrelationSection />}
            </div>
          </div>

          {/* Bottom Actions: Full Investigation Report + Analyse Another Image */}
          <div className="p-3.5 border-t border-[#1168a0]/40 bg-[#081524]/90 backdrop-blur-md space-y-2 shrink-0">
            <button
              onClick={() => goToRoute('report')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1168a0] to-[#167ab7] hover:from-[#1578b8] hover:to-[#1a88cc] text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer active:scale-[0.99]"
            >
              <FileText className="w-4 h-4 text-[#89bada]" />
              <span>Generate Report →</span>
            </button>
            <button
              onClick={() => goToRoute('landing')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#f1aa6f] hover:bg-[#f4b680] text-slate-950 font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-4 h-4 text-slate-950" />
              <span>Analyse Another Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
