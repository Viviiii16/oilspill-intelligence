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
    <div className="space-y-3.5 font-mono text-xs text-[#1E293B]">
      {/* Overview header */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0F62FE] font-bold tracking-wide">
            <Sparkles className="w-4 h-4 text-[#D95800]" />
            <span className="text-xs">95% KDE ORIGIN RECONSTRUCTION</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#0F62FE]/10 text-[#0F62FE] border border-[#0F62FE]/30 text-[10px] font-bold">
            T−{Math.round(simHourBack)}h
          </span>
        </div>
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          Non-parametric Kernel Density Estimation (Silverman bandwidth rule) reconstructing the 24-hour backward release probability corridor.
        </p>
      </div>

      {/* 2-Hour Timestep Selector */}
      <div>
        <div className="text-[10px] uppercase text-[#64748B] tracking-wider mb-2 font-bold flex justify-between items-center">
          <span>Hindcast Stages (Every 2h)</span>
          <span className="px-2 py-0.5 rounded-full bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-[#0F62FE] font-bold text-[10px]">
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
                    ? 'bg-[#0F62FE] text-white shadow-sm scale-[1.03]'
                    : isKey
                    ? 'bg-amber-50 text-[#D95800] border border-[#D95800]/40 hover:border-[#D95800]'
                    : 'bg-white text-[#1E293B] border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{h === 0 ? 'T0' : `-${h}h`}</span>
                {isKey && !isActive && (
                  <span className="block text-[8px] text-[#D95800] -mt-0.5">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Origin Details */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex justify-between items-center text-xs font-bold text-[#1E293B] border-b border-slate-200 pb-2">
          <span>Active Origin Envelope</span>
          <span className="text-[#0F62FE] font-bold">{currentKdeStep.timeUtc}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#1E293B]">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[#64748B] block text-[9.5px]">Centroid:</span>
            <span className="font-bold text-[#1E293B] mt-0.5">
              {currentKdeStep.centroid.lat.toFixed(4)}°N, {currentKdeStep.centroid.lon.toFixed(4)}°E
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[#64748B] block text-[9.5px]">Density Peak:</span>
            <span className="font-bold text-[#1E293B] mt-0.5">
              {currentKdeStep.densityPeak.lat.toFixed(4)}°N, {currentKdeStep.densityPeak.lon.toFixed(4)}°E
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[#64748B] block text-[9.5px]">95% Envelope Area:</span>
            <span className="font-bold text-[#D95800] mt-0.5">
              {currentKdeStep.envelopeAreaKm2.toFixed(1)} km²
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[#64748B] block text-[9.5px]">Relative Density:</span>
            <span className="font-bold text-[#0F62FE] mt-0.5">
              {Math.round(currentKdeStep.relativePeakDensity * 100)}%
            </span>
          </div>
        </div>

        {currentKdeStep.isKeyInterception ? (
          <div className="mt-1.5 p-2.5 rounded-lg bg-[#D95800]/10 border border-[#D95800]/30 text-[11px] text-[#D95800] font-bold flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#D95800] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#D95800]">★ OPTIMAL AIS INTERSECTION WINDOW</div>
              <div className="text-[10px] text-[#D95800]/90 font-normal mt-0.5">
                Tanker M/T PACIFIC VALOUR crosses within 0.54 km MDO at {currentKdeStep.timeUtc}.
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* KDE Map Layer Display Mode */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#0F62FE]" />
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
              className="flex items-center gap-2 text-xs text-[#1E293B] hover:text-[#0F62FE] py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer select-none"
            >
              <input
                type="radio"
                name="kdeReconMode"
                checked={kdeHistoryMode === opt.id}
                onChange={() => setKdeHistoryMode(opt.id)}
                className="accent-[#0F62FE] cursor-pointer"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Origin Drift Milestones */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold">
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
                    ? 'bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-[#0F62FE] font-bold shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-[#1E293B] border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      step.isKeyInterception ? 'text-[#D95800]' : 'text-[#64748B]'
                    }`}
                  >
                    T-{step.timeOffsetHours}h
                  </span>
                  <span className="text-[#64748B] font-mono text-[10px]">
                    {step.centroid.lat.toFixed(3)}°N, {step.centroid.lon.toFixed(3)}°E
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#64748B] text-[10px]">{step.envelopeAreaKm2.toFixed(1)} km²</span>
                  {step.isKeyInterception && (
                    <span className="text-[#D95800] font-bold text-xs">★</span>
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
          className="w-full py-2.5 px-4 rounded-xl bg-[#0F62FE] hover:bg-[#0043ce] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md active:scale-[0.99] cursor-pointer"
        >
          <span>Next: Screen AIS Traffic →</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
