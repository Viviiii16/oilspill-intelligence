import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

interface TimelinePoint {
  label: string;
  hourVal: number;
  direction: 'BACKWARD' | 'FORWARD';
  isKeyInterception?: boolean;
  timeUtc: string;
}

const TIMELINE_POINTS: TimelinePoint[] = [
  { label: 'T−24h', hourVal: 24, direction: 'BACKWARD', timeUtc: '25 Oct 05:53 UTC' },
  { label: 'T−20h', hourVal: 20, direction: 'BACKWARD', timeUtc: '25 Oct 09:53 UTC' },
  { label: 'T−16h', hourVal: 16, direction: 'BACKWARD', isKeyInterception: true, timeUtc: '25 Oct 13:53 UTC' },
  { label: 'T−12h', hourVal: 12, direction: 'BACKWARD', timeUtc: '25 Oct 17:53 UTC' },
  { label: 'T−8h', hourVal: 8, direction: 'BACKWARD', timeUtc: '25 Oct 21:53 UTC' },
  { label: 'T−4h', hourVal: 4, direction: 'BACKWARD', timeUtc: '26 Oct 01:53 UTC' },
  { label: 'T0', hourVal: 0, direction: 'BACKWARD', timeUtc: '26 Oct 05:53 UTC' },
  { label: 'T+4h', hourVal: 4, direction: 'FORWARD', timeUtc: '26 Oct 09:53 UTC' },
  { label: 'T+8h', hourVal: 8, direction: 'FORWARD', timeUtc: '26 Oct 13:53 UTC' },
  { label: 'T+12h', hourVal: 12, direction: 'FORWARD', timeUtc: '26 Oct 17:53 UTC' },
  { label: 'T+16h', hourVal: 16, direction: 'FORWARD', timeUtc: '26 Oct 21:53 UTC' },
  { label: 'T+20h', hourVal: 20, direction: 'FORWARD', timeUtc: '27 Oct 01:53 UTC' },
  { label: 'T+24h', hourVal: 24, direction: 'FORWARD', timeUtc: '27 Oct 05:53 UTC' },
];

export const InvestigationTimeline: React.FC = () => {
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
    currentKdeStep,
    currentForecastState,
    setSelectedKdeInfo,
    kdeHistory,
    forecastDriftTrack,
    keyHourBack,
    currentParticles,
    attributionMeta,
  } = useInvestigation();

  // Times & key interception come from the current result (live model or demo)
  const keyPoint = Math.round(keyHourBack / 4) * 4; // timeline ticks are every 4 h
  const timelinePoints: TimelinePoint[] = TIMELINE_POINTS.map((pt) => {
    const liveTime =
      pt.direction === 'BACKWARD'
        ? kdeHistory.find((k) => k.timeOffsetHours === pt.hourVal)?.timeUtc
        : forecastDriftTrack.find((f) => f.hourAhead === pt.hourVal)?.timeUtc;
    return {
      ...pt,
      timeUtc: liveTime ?? pt.timeUtc,
      isKeyInterception: pt.direction === 'BACKWARD' && pt.hourVal === keyPoint && keyHourBack >= 0,
    };
  });
  const particleCount = attributionMeta?.isLive ? currentParticles.particles.length : 1750;

  const isForecast = simDirection === 'FORWARD';

  const handleSelectPoint = (pt: TimelinePoint) => {
    setSimDirection(pt.direction);
    if (pt.direction === 'BACKWARD') {
      setSimHourBack(pt.hourVal);
      setSelectedKdeInfo(null);
    } else {
      setForecastHourAhead(pt.hourVal);
    }
  };

  const handleStepPrev = () => {
    if (!isForecast) {
      setSimHourBack(Math.min(24, Math.round(simHourBack / 2) * 2 + 2));
    } else {
      setForecastHourAhead(Math.max(0, Math.round(forecastHourAhead / 2) * 2 - 2));
    }
  };

  const handleStepNext = () => {
    if (!isForecast) {
      setSimHourBack(Math.max(0, Math.round(simHourBack / 2) * 2 - 2));
    } else {
      setForecastHourAhead(Math.min(24, Math.round(forecastHourAhead / 2) * 2 + 2));
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (!isForecast && simHourBack >= 24) {
        setSimHourBack(0);
      } else if (isForecast && forecastHourAhead >= 24) {
        setForecastHourAhead(0);
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-20 bg-white border-t border-slate-200 px-6 py-2 flex flex-col justify-between select-none z-20 shrink-0 font-mono text-xs text-[#1E293B]">
      {/* Top Bar: Playback Controls & Status */}
      <div className="flex items-center justify-between">
        {/* Left: Play/Pause, Step, Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStepPrev}
            className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-colors cursor-pointer shadow-xs"
            title="Step Back"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleTogglePlay}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm text-white ${
              isPlaying
                ? 'bg-[#D95800] hover:bg-[#b84800]'
                : 'bg-[#0F62FE] hover:bg-[#0043ce]'
            }`}
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
            onClick={handleStepNext}
            className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1E293B] transition-colors cursor-pointer shadow-xs"
            title="Step Forward"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-0.5 ml-2 shadow-xs">
            {[1, 2, 4].map((sp) => (
              <button
                key={sp}
                onClick={() => setPlaybackSpeed(sp)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                  playbackSpeed === sp
                    ? 'bg-[#0F62FE]/10 text-[#0F62FE] border border-[#0F62FE]'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current Timestep Display */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#0F62FE]" />
          <span className="font-bold text-[#1E293B]">
            {isForecast ? `T+${forecastHourAhead}h` : simHourBack === 0 ? 'T0 (Observation)' : `T−${simHourBack}h (Hindcast)`}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[#0F62FE] font-semibold">
            {isForecast ? currentForecastState.timeUtc : currentKdeStep.timeUtc}
          </span>
        </div>

        {/* Right Mode Indicator */}
        <div className="text-[11px] text-[#64748B] hidden sm:flex items-center gap-2">
          <span>Particles: <strong className="text-[#1E293B]">{isForecast ? '1,000' : particleCount.toLocaleString()}</strong></span>
          <span>•</span>
          <span>Leeway factor: <strong className="text-[#1E293B]">0.03</strong></span>
        </div>
      </div>

      {/* Bottom Continuous Interactive Timeline */}
      <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
        {/* Track horizontal connector line */}
        <div className="absolute left-6 right-6 top-[13px] h-0.5 bg-slate-200 -z-0" />

        {timelinePoints.map((pt) => {
          const isActive =
            pt.direction === simDirection &&
            ((pt.direction === 'BACKWARD' && simHourBack === pt.hourVal) ||
               (pt.direction === 'FORWARD' && forecastHourAhead === pt.hourVal));

          return (
            <div key={`${pt.direction}-${pt.hourVal}`} className="relative flex flex-col items-center z-10">
              <button
                onClick={() => handleSelectPoint(pt)}
                className="group flex flex-col items-center focus:outline-none cursor-pointer"
              >
                {/* Tick dot */}
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                    isActive
                      ? pt.isKeyInterception
                        ? 'bg-[#D95800] border-orange-300 scale-125 shadow-sm shadow-orange-500/40'
                        : 'bg-[#0F62FE] border-blue-300 scale-125 shadow-sm shadow-blue-500/40'
                      : pt.isKeyInterception
                      ? 'bg-white border-[#D95800] hover:scale-110'
                      : 'bg-white border-slate-300 hover:border-[#0F62FE] hover:scale-110'
                  }`}
                >
                  {isActive && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>

                {/* Point Label */}
                <span
                  className={`mt-1 text-[11px] tracking-tight transition-colors ${
                    isActive
                      ? 'text-[#0F62FE] font-bold'
                      : pt.isKeyInterception
                      ? 'text-[#D95800] font-semibold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {pt.label}
                </span>
              </button>

              {/* Special AIS intersection arrow annotation */}
              {pt.isKeyInterception && (
                <div className="absolute top-9 whitespace-nowrap text-[9px] text-[#D95800] font-bold flex items-center gap-0.5 pointer-events-none">
                  <span>↑</span>
                  <span>AIS intersection</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
