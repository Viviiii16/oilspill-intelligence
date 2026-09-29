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
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#F4F6F8] text-[#1E293B] overflow-hidden select-none">
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-slate-200 hover:border-slate-400 text-[#64748B] hover:text-[#1E293B] p-1 rounded-r shadow-md transition-all cursor-pointer"
          style={{ left: isNavCollapsed ? '0px' : '240px' }}
          title={isNavCollapsed ? 'Expand Progress Stepper' : 'Collapse Progress Stepper'}
        >
          {isNavCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* CENTER PANE: GIS Map */}
        <div className="flex-1 h-full relative overflow-hidden bg-[#E2E8F0]">
          <GisMap />
        </div>

        {/* Right Collapse/Expand Toggle Button */}
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white border border-slate-200 hover:border-slate-400 text-[#64748B] hover:text-[#1E293B] p-1 rounded-l shadow-md transition-all cursor-pointer"
          style={{ right: isPanelCollapsed ? '0px' : '440px' }}
          title={isPanelCollapsed ? 'Expand Analysis Panel' : 'Collapse Analysis Panel'}
        >
          {isPanelCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* RIGHT PANE: Investigation Analysis Drawers (Width: 440px) */}
        <div
          className={`h-full bg-white border-l border-slate-200 flex flex-col transition-all duration-300 relative z-20 shrink-0 text-[#1E293B] shadow-xl ${
            isPanelCollapsed ? 'w-0 overflow-hidden' : 'w-[440px]'
          }`}
        >
          {/* Synchronized Stage Navigation - 2 Streamlined Tabs */}
          <div className="p-2.5 border-b border-slate-200 bg-white shrink-0">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F1F5F9] border border-slate-200 gap-1.5">
              <button
                onClick={() => setActiveStep(3)}
                title="Lagrangian Hindcast (Simulation)"
                className={`w-full py-2 px-2 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
                  currentStep === 3 || currentStep === 4
                    ? 'bg-[#0F62FE] text-white shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
                }`}
              >
                <Waves className={`w-4 h-4 shrink-0 transition-transform duration-200 ${(currentStep === 3 || currentStep === 4) ? 'text-white scale-110' : 'text-[#64748B]'}`} />
                <span className="truncate">Hindcast</span>
              </button>

              <button
                onClick={() => setActiveStep(5)}
                title="AIS Vessel Traffic Screening & Candidates"
                className={`w-full py-2 px-2 text-[11px] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap min-w-0 ${
                  currentStep === 5 || currentStep === 6
                    ? 'bg-[#0F62FE] text-white shadow-xs font-bold'
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/60'
                }`}
              >
                <Radar className={`w-4 h-4 shrink-0 transition-transform duration-200 ${(currentStep === 5 || currentStep === 6) ? 'text-white scale-110' : 'text-[#64748B]'}`} />
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
          <div className="p-3.5 border-t border-slate-200 bg-white space-y-2 shrink-0">
            <button
              onClick={() => goToRoute('report')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F62FE] hover:bg-[#0050E6] text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer active:scale-[0.99]"
            >
              <FileText className="w-4 h-4 text-orange-200" />
              <span>Generate Report →</span>
            </button>
            <button
              onClick={() => goToRoute('landing')}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-4 h-4 text-[#64748B]" />
              <span>Analyse Another Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
