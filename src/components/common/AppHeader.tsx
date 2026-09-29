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
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none z-30 shrink-0 text-[#1E293B] shadow-xs">
      {/* Left: Branding */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => goToRoute('landing')}
          className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F62FE] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wider text-[#1E293B]">
                OILSPILL
              </span>
              <span className="text-[11px] tracking-wider text-[#D95800] font-bold">
                Marine Spill Intelligence
              </span>
            </div>
            <p className="text-[10px] text-[#64748B] tracking-tight font-medium">
              Detection • Reconstruction • Attribution
            </p>
          </div>
        </button>

        {/* Case ID Badge when not on landing */}
        {currentRoute !== 'landing' && (
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-[10px] text-[#64748B]">CASE:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#F4F6F8] border border-slate-200 text-xs text-[#D95800] font-bold shadow-xs">
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
                ? 'bg-[#0F62FE] text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
            }`}
          >
            Detection
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            onClick={() => goToRoute('investigation')}
            disabled={processingState === 'analysing-slick'}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
              currentRoute === 'investigation'
                ? 'bg-[#0F62FE] text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
            }`}
          >
            Investigation
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <button
            onClick={() => goToRoute('report')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-medium ${
              currentRoute === 'report'
                ? 'bg-[#0F62FE] text-white font-bold shadow-xs'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F62FE] hover:bg-[#0050E6] text-xs text-white font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-orange-200" />
            <span className="hidden sm:inline">Generate Report</span>
          </button>
        )}

        {currentRoute === 'report' && (
          <button
            onClick={() => goToRoute('investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F62FE] hover:bg-[#0050E6] text-xs text-white font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-orange-200" />
            <span className="hidden sm:inline">Back to Workspace</span>
          </button>
        )}
      </div>
    </header>
  );
};
