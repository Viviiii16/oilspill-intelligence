import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Compass,
  Wind,
  Ship,
  Satellite,
  Sun,
  Sliders,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const LayerControl: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    layers,
    toggleLayer,
    mapBrightness,
    setMapBrightness,
  } = useInvestigation();

  return (
    <div className="absolute top-4 left-4 z-[500] select-none text-xs font-sans">
      <div className="bg-white/95 border border-slate-200 backdrop-blur-md rounded-xl shadow-xl overflow-hidden transition-all duration-200 w-72">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[#0F62FE] hover:bg-[#0043ce] text-white transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <span className="font-bold tracking-wider text-white text-xs">TACTICAL LAYERS</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-white/80" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/80" />
          )}
        </button>

        {isOpen && (
          <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* Basemap Mode - Satellite Only */}
            <div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Compass className="w-3.5 h-3.5 text-[#0F62FE]" />
                <span>Basemap Cartography</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center text-[10.5px] font-semibold text-[#1E293B]">
                <span>World Imagery (Satellite)</span>
              </div>
            </div>

            {/* OBSERVATION */}
            <div className="border-t border-slate-200 pt-2.5">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Satellite className="w-3.5 h-3.5 text-[#0F62FE]" />
                <span>OBSERVATION</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#D95800] font-semibold">Detected Oil Slick</span>
                  <input
                    type="checkbox"
                    checked={layers.slickPolygon}
                    onChange={() => toggleLayer('slickPolygon')}
                    className="accent-[#D95800] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* RECONSTRUCTION (Backward Hindcast) */}
            <div className="border-t border-slate-200 pt-2.5">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-[#0F62FE]" />
                <span>RECONSTRUCTION (HINDCAST)</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#1E293B]">Backward Particles (1,750)</span>
                  <input
                    type="checkbox"
                    checked={layers.particles}
                    onChange={() => toggleLayer('particles')}
                    className="accent-[#0F62FE] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#1E293B]">KDE Density Surface</span>
                  <input
                    type="checkbox"
                    checked={layers.kdeDensity}
                    onChange={() => toggleLayer('kdeDensity')}
                    className="accent-[#0F62FE] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#1E293B]">95% KDE Envelopes</span>
                  <input
                    type="checkbox"
                    checked={layers.kdeEnvelopes}
                    onChange={() => toggleLayer('kdeEnvelopes')}
                    className="accent-[#0F62FE] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#0F62FE] font-semibold">Origin Drift Track</span>
                  <input
                    type="checkbox"
                    checked={layers.originDriftTrack}
                    onChange={() => toggleLayer('originDriftTrack')}
                    className="accent-[#0F62FE] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* FORECAST (Forward Forecast) */}
            <div className="border-t border-slate-200 pt-2.5">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Wind className="w-3.5 h-3.5 text-[#D95800]" />
                <span>FORECAST (FORWARD)</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#1E293B]">Forward Particles (1,000)</span>
                  <input
                    type="checkbox"
                    checked={layers.forecastParticles}
                    onChange={() => toggleLayer('forecastParticles')}
                    className="accent-[#D95800] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#D95800] font-semibold">Forecast Drift Track</span>
                  <input
                    type="checkbox"
                    checked={layers.forecastDriftTrack}
                    onChange={() => toggleLayer('forecastDriftTrack')}
                    className="accent-[#D95800] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* VESSEL TRAFFIC */}
            <div className="border-t border-slate-200 pt-2.5">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Ship className="w-3.5 h-3.5 text-[#0F62FE]" />
                <span>VESSEL TRAFFIC</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#1E293B] font-semibold">Candidate Vessels (Top 5)</span>
                  <input
                    type="checkbox"
                    checked={layers.suspectTracks}
                    onChange={() => toggleLayer('suspectTracks')}
                    className="accent-[#0F62FE] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="text-[#D95800] font-medium">Closest Approach Vector</span>
                  <input
                    type="checkbox"
                    checked={layers.closestApproachLine}
                    onChange={() => toggleLayer('closestApproachLine')}
                    className="accent-[#D95800] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* Opacity & Brightness Sliders */}
            <div className="border-t border-slate-200 pt-2.5 space-y-2.5">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                <Sliders className="w-3.5 h-3.5 text-[#0F62FE]" />
                <span>Display Adjustments</span>
              </div>

              {/* Map Canvas Brightness */}
              <div>
                <div className="flex justify-between text-[10px] text-[#1E293B] font-medium mb-1">
                  <span className="flex items-center gap-1 text-[#64748B]">
                    <Sun className="w-3 h-3 text-[#D95800]" />
                    Map Canvas Brightness
                  </span>
                  <span className="text-[#0F62FE] font-mono font-bold">{Math.round(mapBrightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.05"
                  value={mapBrightness}
                  onChange={(e) => setMapBrightness(parseFloat(e.target.value))}
                  className="w-full accent-[#0F62FE] h-1.5 bg-slate-200 rounded-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
