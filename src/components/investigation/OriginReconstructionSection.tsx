import React from 'react';
import { Layers, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { KDEHistoryMode } from '../../types';

export const OriginReconstructionSection: React.FC = () => {
  const {
    currentKdeStep,
    kdeHistory,
    kdeHistoryMode,
    setKdeHistoryMode,
    simHourBack,
    setSimHourBack,
    setSelectedKdeInfo,
    setActiveStep,
  } = useInvestigation();

  const HINDCAST_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  return (
    <div className="space-y-3.5 font-mono text-xs text-slate-200">
      {/* Overview header */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#192344] to-[#121932] border border-purple-500/35 space-y-2 shadow-[0_4px_20px_rgba(168,85,247,0.12)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-300 font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-xs">95% KDE ORIGIN RECONSTRUCTION</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
            T−{Math.round(simHourBack)}h
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Non-parametric Kernel Density Estimation (Silverman bandwidth rule) reconstructing the 24-hour backward release probability corridor.
        </p>
      </div>

      {/* 2-Hour Timestep Selector */}
      <div>
        <div className="text-[10px] uppercase text-purple-400 tracking-wider mb-2 font-bold flex justify-between items-center">
          <span>Hindcast Stages (Every 2h)</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold text-[10px]">
            T-{simHourBack.toFixed(1)}h
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {HINDCAST_HOURS.map((h) => {
            const isActive = Math.round(simHourBack) === h;
            const isKey = h === 16;
            return (
              <button
                key={h}
                onClick={() => {
                  setSimHourBack(h);
                  setSelectedKdeInfo(null);
                }}
                className={`py-1.5 px-0.5 rounded-lg text-center text-[10px] font-bold transition-all duration-150 relative cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white border border-purple-300/40 shadow-[0_2px_10px_rgba(168,85,247,0.35)] scale-[1.03]'
                    : isKey
                    ? 'bg-gradient-to-b from-[#182c47] to-[#122238] text-amber-300 border border-amber-500/50 hover:border-amber-400'
                    : 'bg-gradient-to-b from-[#14263e] to-[#0f1d30] text-slate-300 border border-sky-800/40 hover:border-sky-600/50 hover:text-white'
                }`}
              >
                <span>{h === 0 ? 'T0' : `-${h}h`}</span>
                {isKey && !isActive && (
                  <span className="block text-[8px] text-amber-400 -mt-0.5">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Origin Details */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#152d4b] to-[#10233b] border border-sky-700/30 shadow-[0_4px_16px_rgba(0,0,0,0.25)] space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-white border-b border-sky-800/80 pb-2">
          <span>Active Origin Envelope</span>
          <span className="text-purple-300 font-bold">{currentKdeStep.timeUtc}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
          <div className="p-2 rounded-lg bg-[#0b1728]/50 border border-white/5 flex flex-col justify-between">
            <span className="text-slate-400 block text-[9.5px]">Centroid:</span>
            <span className="font-bold text-white mt-0.5">
              {currentKdeStep.centroid.lat.toFixed(4)}°N, {currentKdeStep.centroid.lon.toFixed(4)}°E
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#0b1728]/50 border border-white/5 flex flex-col justify-between">
            <span className="text-slate-400 block text-[9.5px]">Density Peak:</span>
            <span className="font-bold text-white mt-0.5">
              {currentKdeStep.densityPeak.lat.toFixed(4)}°N, {currentKdeStep.densityPeak.lon.toFixed(4)}°E
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#0b1728]/50 border border-white/5 flex flex-col justify-between">
            <span className="text-slate-400 block text-[9.5px]">95% Envelope Area:</span>
            <span className="font-bold text-amber-400 mt-0.5">
              {currentKdeStep.envelopeAreaKm2.toFixed(1)} km²
            </span>
          </div>
          <div className="p-2 rounded-lg bg-[#0b1728]/50 border border-white/5 flex flex-col justify-between">
            <span className="text-slate-400 block text-[9.5px]">Relative Density:</span>
            <span className="font-bold text-purple-300 mt-0.5">
              {Math.round(currentKdeStep.relativePeakDensity * 100)}%
            </span>
          </div>
        </div>

        {currentKdeStep.isKeyInterception ? (
          <div className="mt-1.5 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/35 text-[11px] text-amber-200 font-bold flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-200">★ OPTIMAL AIS INTERSECTION WINDOW</div>
              <div className="text-[10px] text-amber-300/80 font-normal mt-0.5">
                Tanker M/T PACIFIC VALOUR crosses within 0.54 km MDO at {currentKdeStep.timeUtc}.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* KDE Map Layer Display Mode */}
      <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#152d4b] to-[#10233b] border border-sky-700/30 shadow-[0_4px_16px_rgba(0,0,0,0.25)] space-y-2.5">
        <div className="text-[10px] text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>KDE Envelopes Map Mode</span>
        </div>
        <div className="space-y-1">
          {(
            [
              { id: 'all', label: 'Show all 13 envelopes corridor' },
              { id: 'previous', label: 'Cumulative up to current hour' },
              { id: 'current', label: 'Current timestep only' },
            ] as { id: KDEHistoryMode; label: string }[]
          ).map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white py-1 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer select-none"
            >
              <input
                type="radio"
                name="kdeReconMode"
                checked={kdeHistoryMode === opt.id}
                onChange={() => setKdeHistoryMode(opt.id)}
                className="accent-purple-400 cursor-pointer"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Origin Drift Milestones */}
      <div className="p-3 rounded-xl bg-gradient-to-b from-[#152d4b] to-[#10233b] border border-sky-700/30 shadow-[0_4px_16px_rgba(0,0,0,0.25)] space-y-2">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
          Trajectory Milestones (T0 → T-24h)
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
          {kdeHistory.map((step) => {
            const isSelected = Math.round(simHourBack) === step.timeOffsetHours;
            return (
              <button
                key={step.timeOffsetHours}
                onClick={() => {
                  setSimHourBack(step.timeOffsetHours);
                  setSelectedKdeInfo(step);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/80 border border-purple-500/50 text-purple-200 font-bold shadow-xs'
                    : 'bg-[#0b1728]/60 hover:bg-[#16304f] text-slate-300 border border-sky-900/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      step.isKeyInterception ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  >
                    T-{step.timeOffsetHours}h
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {step.centroid.lat.toFixed(3)}°N, {step.centroid.lon.toFixed(3)}°E
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[10px]">{step.envelopeAreaKm2.toFixed(1)} km²</span>
                  {step.isKeyInterception && (
                    <span className="text-amber-400 font-bold text-xs">★</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action to Next Step */}
      <div className="pt-1">
        <button
          onClick={() => setActiveStep(5)}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-sky-400 to-sky-500 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_4px_16px_rgba(14,165,233,0.25)] active:scale-[0.99] cursor-pointer"
        >
          <span>Next: Screen AIS Traffic →</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
