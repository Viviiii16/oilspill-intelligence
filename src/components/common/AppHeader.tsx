import React from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { FileText, Compass, ChevronRight } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const {
    currentRoute,
    goToRoute,
    currentCase,
    processingState,
  } = useInvestigation();

  return (
    <header className="h-14 bg-[#091728] border-b border-[#1168a0]/40 px-6 flex items-center justify-between select-none z-30 shrink-0 text-[#edf4fd]">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => goToRoute('landing')}
          className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1168a0] border border-[#89bada]/40 flex items-center justify-center text-[#edf4fd] font-bold text-xs tracking-wider shadow-sm">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-white">
                OILSPILL
              </span>
              <span className="text-[11px] tracking-wider text-[#f1aa6f] font-bold">
                Marine Spill Intelligence
              </span>
            </div>
            <p className="text-[10px] text-[#89bada] tracking-tight font-medium">
              Detection • Reconstruction • Attribution
            </p>
          </div>
        </button>

        {/* Case ID Badge when not on landing */}
        {currentRoute !== 'landing' && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#1168a0]/40">
            <span className="text-[10px] text-[#89bada]">CASE:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#0c1e33] border border-[#1168a0]/50 text-xs text-[#f1aa6f] font-bold shadow-xs">
              {currentCase.id}
            </span>
          </div>
        )}
      </div>

      {/* Center: Stage breadcrumbs when past landing */}
      {currentRoute !== 'landing' && (
        <nav className="hidden md:flex items-center gap-1.5 text-xs">
          <button
            onClick={() => goToRoute('detection')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
              currentRoute === 'detection'
                ? 'bg-[#1168a0] text-white font-bold border border-[#89bada]/40 shadow-sm'
                : 'text-[#89bada] hover:text-white hover:bg-[#1168a0]/20'
            }`}
          >
            Detection
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#89bada]/60" />
          <button
            onClick={() => goToRoute('investigation')}
            disabled={processingState === 'analysing-slick'}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
              currentRoute === 'investigation'
                ? 'bg-[#1168a0] text-white font-bold border border-[#89bada]/40 shadow-sm'
                : 'text-[#89bada] hover:text-white hover:bg-[#1168a0]/20'
            }`}
          >
            Investigation
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#89bada]/60" />
          <button
            onClick={() => goToRoute('report')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
              currentRoute === 'report'
                ? 'bg-[#1168a0] text-white font-bold border border-[#89bada]/40 shadow-sm'
                : 'text-[#89bada] hover:text-white hover:bg-[#1168a0]/20'
            }`}
          >
            Report
          </button>
        </nav>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Navigation Action */}
        {currentRoute === 'investigation' && (
          <button
            onClick={() => goToRoute('report')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1168a0] hover:bg-[#167ab7] border border-[#89bada]/40 text-xs text-white font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#f1aa6f]" />
            <span className="hidden sm:inline">Generate Report</span>
          </button>
        )}

        {currentRoute === 'report' && (
          <button
            onClick={() => goToRoute('investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1168a0] hover:bg-[#167ab7] border border-[#89bada]/40 text-xs text-white font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Compass className="w-3.5 h-3.5 text-[#f1aa6f]" />
            <span className="hidden sm:inline">Back to Workspace</span>
          </button>
        )}
      </div>
    </header>
  );
};
