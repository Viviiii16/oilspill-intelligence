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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091524]/90 backdrop-blur-md font-sans text-[#edf4fd] px-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a1e36] border border-[#1168a0] rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(17,104,160,0.35)] space-y-6 text-center">
        {/* Decorative Top Accent Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-24 bg-[#f1aa6f]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Animated Radar/Compass Rings */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#1168a0]/50 animate-[spin_8s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-[#f1aa6f]/60 animate-[spin_4s_linear_infinite_reverse]" />
          <div className="relative w-12 h-12 rounded-xl bg-[#082e49] border border-[#1168a0] flex items-center justify-center shadow-lg text-[#f1aa6f]">
            {isReport ? (
              <FileText className="w-6 h-6 animate-pulse text-[#f1aa6f]" />
            ) : (
              <Compass
                className="w-6 h-6 animate-spin text-[#f1aa6f]"
                style={{ animationDuration: '6s' }}
              />
            )}
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1168a0]/30 border border-[#1168a0]/60 text-[10.5px] font-bold text-[#f1aa6f] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#f1aa6f]" />
            <span>{isReport ? 'Dossier Generation' : 'Workspace Initialization'}</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isReport ? 'Compiling Full Investigation Report' : 'Loading Hydrodynamic Workspace'}
          </h3>
          <p className="text-xs text-[#89bada] max-w-xs mx-auto leading-relaxed">
            {isReport
              ? 'Aggregating SAR spatial metrics, 24h reverse hindcast envelopes, and DuckDB AIS attribution ranking.'
              : 'Synthesizing Copernicus marine current vectors, ERA5 wind fields, and 1,750 Lagrangian particles.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-[#081524] rounded-full overflow-hidden border border-[#1168a0]/50 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#1168a0] via-[#89bada] to-[#f1aa6f] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#89bada] font-mono">
            <span>{isReport ? 'Processing telemetry...' : 'Calibrating particles...'}</span>
            <span className="font-bold text-[#f1aa6f]">{progress}%</span>
          </div>
        </div>

        {/* Micro step indicators */}
        <div className="pt-2 border-t border-[#1168a0]/30 flex items-center justify-center gap-2 text-[11px] text-[#89bada]/90">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#89bada]" />
          <span>Please wait, rendering analytical views...</span>
        </div>
      </div>
    </div>
  );
};
