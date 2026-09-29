import React from 'react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Droplets,
  RotateCcw,
  Wind,
  Waves,
  Navigation,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const LagrangianReconstructionSection: React.FC = () => {
  const {
    simDirection,
    setSimDirection,
    simHourBack,
    setSimHourBack,
    forecastHourAhead,
    setForecastHourAhead,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    currentForecastState,
    currentParticles,
    setSelectedKdeInfo,
    attributionMeta,
    keyHourBack,
    geometry,
    setDemoModeModalOpen,
  } = useInvestigation();

  const isLive = Boolean(attributionMeta?.isLive);
  const keyPill = Math.round(keyHourBack / 2) * 2; // pills are every 2 h

  const isForecast = simDirection === 'FORWARD';
  const HINDCAST_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  const FORECAST_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  // Environmental forcing aligned with hindcast hour
  // Live: ERA5 / CMEMS values sampled by the model along the drift track. Demo: illustrative formulas.
  const MS_TO_KN = 1 / 0.514444;
  const compass = (deg: number) =>
    ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  const liveSample =
    isLive && attributionMeta!.forcingSeries.length
      ? attributionMeta!.forcingSeries.reduce((best, f) =>
          Math.abs(f.hourBack - simHourBack) < Math.abs(best.hourBack - simHourBack) ? f : best
        )
      : null;

  let windSpeedMs: number, windDir: number, currentSpeedMs: number, currentDir: number;
  if (liveSample) {
    windSpeedMs = Math.hypot(liveSample.windU, liveSample.windV);
    windDir = Math.round(((Math.atan2(-liveSample.windU, -liveSample.windV) * 180) / Math.PI + 360) % 360); // from
    currentSpeedMs = Math.hypot(liveSample.currentU, liveSample.currentV);
    currentDir = Math.round(((Math.atan2(liveSample.currentU, liveSample.currentV) * 180) / Math.PI + 360) % 360); // towards
  } else {
    windSpeedMs = (8.2 - 0.035 * simHourBack) * 0.514444;
    windDir = Math.round(215 - 0.4 * simHourBack);
    currentSpeedMs = (0.45 + 0.0025 * simHourBack) * 0.514444;
    currentDir = Math.round(42 + 0.25 * simHourBack);
  }
  const windSpeedKn = parseFloat((windSpeedMs * MS_TO_KN).toFixed(1));
  windSpeedMs = parseFloat(windSpeedMs.toFixed(1));
  const currentSpeedKn = parseFloat((currentSpeedMs * MS_TO_KN).toFixed(2));
  currentSpeedMs = parseFloat(currentSpeedMs.toFixed(2));

  const windBadge = !isLive ? 'ERA5' : attributionMeta!.windSource.startsWith('SYNTHETIC') ? 'SYNTHETIC' : 'ERA5';
  const currentBadge = !isLive ? 'CMEMS' : attributionMeta!.currentSource.startsWith('SYNTHETIC') ? 'SYNTHETIC' : 'CMEMS';

  const waveHeightM = isLive ? '—' : `${parseFloat((0.8 - 0.008 * simHourBack).toFixed(1))} m`;
  const seaTempC = isLive ? '—' : `${parseFloat((24.8 - 0.02 * simHourBack).toFixed(1))} °C`;
  const driftAxis = isLive
    ? `${geometry.pcaAxisBearingDeg.toFixed(1)}° ${compass(geometry.pcaAxisBearingDeg)}`
    : '40.8° NE';

  const handleStepBack = () => {
    if (!isForecast) {
      setSimHourBack(Math.min(24, Math.round(simHourBack / 2) * 2 + 2));
    } else {
      setForecastHourAhead(Math.max(0, Math.round(forecastHourAhead / 2) * 2 - 2));
    }
  };

  const handleStepForward = () => {
    if (!isForecast) {
      setSimHourBack(Math.max(0, Math.round(simHourBack / 2) * 2 - 2));
    } else {
      setForecastHourAhead(Math.min(24, Math.round(forecastHourAhead / 2) * 2 + 2));
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (!isForecast && simHourBack >= 24) setSimHourBack(0);
      if (isForecast && forecastHourAhead >= 24) setForecastHourAhead(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (!isForecast) {
      setSimHourBack(0);
      setSelectedKdeInfo(null);
    } else {
      setForecastHourAhead(0);
    }
  };

  return (
    <div className="space-y-3.5 font-sans text-xs text-[#1E293B]">
      {/* Live model status + data warnings */}
      {isLive && (
        <button
          onClick={() => setDemoModeModalOpen(true)}
          className={`w-full text-left p-2.5 rounded-xl border text-[10.5px] cursor-pointer transition-colors ${
            attributionMeta!.warnings.length
              ? 'bg-orange-50 border-[#D95800]/40 text-[#D95800] hover:border-[#D95800]'
              : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:border-emerald-500'
          }`}
        >
          <span className="font-bold">● LIVE MODEL</span> · T0 {attributionMeta!.t0Utc}
          {attributionMeta!.warnings.length > 0 && (
            <span> · ⚠ {attributionMeta!.warnings.length} data warning{attributionMeta!.warnings.length > 1 ? 's' : ''} — click for details</span>
          )}
        </button>
      )}

      {/* Hindcast / Forecast Direction Switch - Sleek Segmented Pill */}
      <div className="flex rounded-xl bg-[#F1F5F9] p-1 border border-slate-200 shadow-inner">
        <button
          onClick={() => setSimDirection('BACKWARD')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            !isForecast
              ? 'bg-[#0F62FE] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-200/50'
          }`}
        >
          <span>HINDCAST (← BACKWARD)</span>
        </button>
        <button
          onClick={() => setSimDirection('FORWARD')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            isForecast
              ? 'bg-[#D95800] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#D95800] hover:bg-slate-200/50'
          }`}
        >
          <span>FORECAST (→ FORWARD)</span>
        </button>
      </div>

      {!isForecast ? (
        /* HINDCAST MODE (T0 → T-24h) */
        <div className="space-y-3.5">
          {/* Timestep selector pills */}
          <div>
            <div className="text-[10px] uppercase text-[#64748B] tracking-wider mb-2 font-bold flex justify-between items-center">
              <span>Hindcast Timesteps (Every 2h)</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0F62FE]/10 border border-[#0F62FE]/30 text-[#0F62FE] font-bold text-[10px]">
                T-{simHourBack.toFixed(1)}h
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {HINDCAST_HOURS.map((h) => {
                const isActive = Math.round(simHourBack) === h;
                const isKey = h === keyPill;
                return (
                  <button
                    key={h}
                    onClick={() => {
                      setSimHourBack(h);
                      setSelectedKdeInfo(null);
                    }}
                    className={`py-1.5 px-0.5 rounded-lg text-center text-[10px] font-bold transition-all duration-150 relative cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#0F62FE] text-white shadow-xs scale-[1.03]'
                        : isKey
                        ? 'bg-orange-50 text-[#D95800] border border-[#D95800]/50 hover:border-[#D95800]'
                        : 'bg-white text-[#1E293B] border border-slate-200 hover:border-[#0F62FE] hover:text-[#0F62FE]'
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

          {/* Timeline range slider */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <div className="flex justify-between text-[10px] text-[#64748B] font-medium">
              <span>Observation (T0)</span>
              <span className="text-[#0F62FE] font-bold">T-{simHourBack.toFixed(1)}h</span>
              <span>Origin Horizon (T-24h)</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={simHourBack}
              onChange={(e) => setSimHourBack(parseFloat(e.target.value))}
              className="w-full accent-[#0F62FE] h-1.5 bg-slate-200 border-none rounded-full cursor-pointer"
            />
          </div>

          {/* Playback Controls Card */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStepBack}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Step Backward"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs active:scale-95 bg-[#0F62FE] hover:bg-[#0050E6] text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStepForward}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Step Forward"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Reset to T0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              {[1, 2, 4, 8].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-[#0F62FE] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>

          {/* Wind & Ocean Current Data Card */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs space-y-3">
            {/* Header with Timestamp */}
            <div className="flex justify-between items-center text-[10px] text-[#64748B] uppercase tracking-wider font-bold">
              <span className="flex items-center gap-1.5 text-[#1E293B]">
                <Wind className="w-3.5 h-3.5 text-[#D95800]" />
                <span>Wind & Ocean Current Data</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#0F62FE] text-[9.5px] font-bold shadow-xs">
                {currentParticles.timeUtc}
              </span>
            </div>

            {/* 2-Column Grid: Surface Wind & Ocean Current */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Surface Wind Card */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] font-bold flex items-center gap-1">
                    <Wind className="w-3 h-3 text-[#D95800]" />
                    <span>Surface Wind (10m)</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${windBadge === 'SYNTHETIC' ? 'bg-orange-50 text-[#D95800] border-[#D95800]/40' : 'bg-slate-100 text-[#64748B] border-slate-200'}`}>
                    {windBadge}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-base font-extrabold text-[#D95800]">
                    {windSpeedKn} <span className="text-[10px] text-[#64748B] font-normal">kn</span>
                  </div>
                  <div className="text-[10px] text-[#1E293B]/80 font-medium">
                    {windSpeedMs} m/s
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1 text-[#1E293B]">
                    <Navigation
                      className="w-3 h-3 text-[#D95800] transition-transform duration-300"
                      style={{ transform: `rotate(${windDir - 180}deg)` }}
                    />
                    <span className="font-semibold">{windDir}° {compass(windDir)}</span>
                  </div>
                  <span className="text-[9px] text-[#64748B]">3.0% leeway</span>
                </div>
              </div>

              {/* Ocean Current Card */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#64748B] font-bold flex items-center gap-1">
                    <Waves className="w-3 h-3 text-[#0F62FE]" />
                    <span>Ocean Current</span>
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${currentBadge === 'SYNTHETIC' ? 'bg-orange-50 text-[#D95800] border-[#D95800]/40' : 'bg-slate-100 text-[#64748B] border-slate-200'}`}>
                    {currentBadge}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-base font-extrabold text-[#0F62FE]">
                    {currentSpeedKn} <span className="text-[10px] text-[#64748B] font-normal">kn</span>
                  </div>
                  <div className="text-[10px] text-[#1E293B]/80 font-medium">
                    {currentSpeedMs} m/s
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1 text-[#1E293B]">
                    <Navigation
                      className="w-3 h-3 text-[#0F62FE] transition-transform duration-300"
                      style={{ transform: `rotate(${currentDir}deg)` }}
                    />
                    <span className="font-semibold">{currentDir}° {compass(currentDir)}</span>
                  </div>
                  <span className="text-[9px] text-[#64748B]">0-1m layer</span>
                </div>
              </div>
            </div>

            {/* Environmental Metadata Row */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-center text-[9.5px]">
              <div className="p-1.5 rounded-md bg-white border border-slate-200 shadow-xs">
                <div className="text-[#64748B]">Wave Height (Hs)</div>
                <div className="font-bold text-[#1E293B]">{waveHeightM}</div>
              </div>
              <div className="p-1.5 rounded-md bg-white border border-slate-200 shadow-xs">
                <div className="text-[#64748B]">Sea Temp (SST)</div>
                <div className="font-bold text-[#1E293B]">{seaTempC}</div>
              </div>
              <div className="p-1.5 rounded-md bg-white border border-slate-200 shadow-xs">
                <div className="text-[#64748B]">Net Drift Axis</div>
                <div className="font-bold text-[#D95800]">{driftAxis}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* FORECAST MODE (T0 → T+24h) */
        <div className="space-y-3.5">
          {isLive && (
            <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 text-[10.5px] text-[#64748B]">
              The attribution model only hindcasts (T0 → T−24h). This forward forecast is illustrative demo data.
            </div>
          )}
          {/* Timestep selector pills */}
          <div>
            <div className="text-[10px] uppercase text-[#D95800] tracking-wider mb-2 font-bold flex justify-between items-center">
              <span>Forecast Horizon (Every 2h)</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-[#D95800]/40 text-[#D95800] font-bold text-[10px]">
                T+{forecastHourAhead.toFixed(1)}h
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {FORECAST_HOURS.map((h) => {
                const isActive = Math.round(forecastHourAhead) === h;
                return (
                  <button
                    key={h}
                    onClick={() => setForecastHourAhead(h)}
                    className={`py-1.5 px-0.5 rounded-lg text-center text-[10px] font-bold transition-all duration-150 cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-[#D95800] text-white shadow-xs scale-[1.03]'
                        : 'bg-white text-[#1E293B] border border-slate-200 hover:border-[#D95800] hover:text-[#D95800]'
                    }`}
                  >
                    <span>{h === 0 ? 'T0' : `+${h}h`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline range slider */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <div className="flex justify-between text-[10px] text-[#64748B] font-medium">
              <span>Observation (T0)</span>
              <span className="text-[#D95800] font-bold">T+{forecastHourAhead.toFixed(1)}h</span>
              <span>Horizon (T+24h)</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={forecastHourAhead}
              onChange={(e) => setForecastHourAhead(parseFloat(e.target.value))}
              className="w-full accent-[#D95800] h-1.5 bg-slate-200 border-none rounded-full cursor-pointer"
            />
          </div>

          {/* Playback Controls Card */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleStepBack}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Step Backward"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-xs active:scale-95 bg-[#D95800] hover:bg-[#B84A00] text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStepForward}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Step Forward"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-all duration-150 active:scale-95 cursor-pointer shadow-xs"
                title="Reset to T0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              {[1, 2, 4, 8].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all duration-150 cursor-pointer ${
                    playbackSpeed === speed
                      ? 'bg-[#D95800] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {speed}×
                </button>
              ))}
            </div>
          </div>

          {/* Mass Balance Partitioning Visual Bar */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex justify-between items-center text-[10px] text-[#64748B] uppercase tracking-wider font-bold">
              <span className="flex items-center gap-1.5 text-[#1E293B]">
                <Droplets className="w-3.5 h-3.5 text-[#D95800]" />
                Oil Mass Balance Partitioning
              </span>
              <span className="text-[#64748B] font-bold">100% Total Spill</span>
            </div>

            {/* Multi-segment stacked bar */}
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex border border-slate-300 shadow-inner">
              <div
                style={{ width: `${currentForecastState.evaporatedPct}%` }}
                className="bg-[#D95800] h-full transition-all duration-300"
                title={`Evaporated: ${currentForecastState.evaporatedPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${currentForecastState.dispersedPct}%` }}
                className="bg-[#0F62FE] h-full transition-all duration-300"
                title={`Dispersed: ${currentForecastState.dispersedPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${currentForecastState.surfaceRemainingPct}%` }}
                className="bg-slate-400 h-full transition-all duration-300"
                title={`Surface Remaining: ${currentForecastState.surfaceRemainingPct.toFixed(1)}%`}
              />
            </div>

            {/* Partitioning legend */}
            <div className="flex items-center justify-between text-[10px] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D95800]" />
                <span className="text-[#64748B]">Evaporated:</span>
                <span className="text-[#D95800] font-bold">{currentForecastState.evaporatedPct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F62FE]" />
                <span className="text-[#64748B]">Dispersed:</span>
                <span className="text-[#0F62FE] font-bold">{currentForecastState.dispersedPct.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-[#64748B]">Surface:</span>
                <span className="text-[#1E293B] font-bold">{currentForecastState.surfaceRemainingPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
