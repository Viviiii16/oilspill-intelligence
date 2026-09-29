import React, { useEffect, useState } from 'react';
import { useInvestigation } from '../../context/InvestigationContext';
import { FileText, Compass, Loader2, Sparkles } from 'lucide-react';

export const RouteLoadingOverlay: React.FC = () => {
  const { routeLoadingTarget } = useInvestigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!routeLoadingTarget) {
      return;
    }

    // Smooth simulated progress from 15% to 100% over ~1150ms
    const t0 = setTimeout(() => setProgress(15), 10);
    const t1 = setTimeout(() => setProgress(45), 250);
    const t2 = setTimeout(() => setProgress(78), 650);
    const t3 = setTimeout(() => setProgress(95), 950);
    const t4 = setTimeout(() => setProgress(100), 1150);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [routeLoadingTarget]);

  if (!routeLoadingTarget) return null;

  const isReport = routeLoadingTarget === 'report';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md font-sans text-[#1E293B] px-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-[#0F62FE]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Radar/Compass Rings */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#0F62FE]/40 animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-[#D95800]/50 animate-[spin_4s_linear_infinite_reverse]" />
          <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-md text-[#0F62FE]">
            {isReport ? (
              <FileText className="w-6 h-6 animate-pulse text-[#0F62FE]" />
            ) : (
              <Compass
                className="w-6 h-6 animate-spin text-[#0F62FE]"
                style={{ animationDuration: '6s' }}
              />
            )}
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-[10.5px] font-bold text-[#0F62FE] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#D95800]" />
            <span>{isReport ? 'Dossier Generation' : 'Workspace Initialization'}</span>
          </div>
          <h3 className="text-lg font-bold text-[#1E293B] tracking-tight">
            {isReport ? 'Compiling Full Investigation Report' : 'Loading Hydrodynamic Workspace'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto leading-relaxed">
            {isReport
              ? 'Aggregating SAR spatial metrics, 24h reverse hindcast envelopes, and DuckDB AIS attribution ranking.'
              : 'Synthesizing Copernicus marine current vectors, ERA5 wind fields, and 1,750 Lagrangian particles.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#0F62FE] via-[#3b82f6] to-[#D95800] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#64748B] font-mono">
            <span>{isReport ? 'Processing telemetry...' : 'Calibrating particles...'}</span>
            <span className="font-bold text-[#D95800]">{progress}%</span>
          </div>
        </div>

        {/* Micro step indicators */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0F62FE]" />
          <span>Please wait, rendering analytical views...</span>
        </div>
      </div>
    </div>
  );
};
