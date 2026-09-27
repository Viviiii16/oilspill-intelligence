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
      <div className="bg-[#0a3e61]/95 border border-[#1168a0] backdrop-blur-md rounded-xl shadow-2xl overflow-hidden transition-all duration-200 w-72">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between bg-[#1168a0] border-b border-[#89bada]/30 hover:bg-[#165682] text-[#edf4fd] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#f1aa6f]" />
            <span className="font-bold tracking-wider text-white text-xs">TACTICAL LAYERS</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#89bada]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#89bada]" />
          )}
        </button>

        {isOpen && (
          <div className="p-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
            {/* Basemap Mode - Satellite Only */}
            <div>
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Compass className="w-3.5 h-3.5 text-[#f1aa6f]" />
                <span>Basemap Cartography</span>
              </div>
              <div className="bg-[#082e49] p-2 rounded-lg border border-[#1168a0] text-center text-[10.5px] font-semibold text-[#edf4fd]">
                <span>World Imagery (Satellite)</span>
              </div>
            </div>

            {/* OBSERVATION */}
            <div className="border-t border-[#1168a0]/60 pt-2.5">
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Satellite className="w-3.5 h-3.5 text-[#89bada]" />
                <span>OBSERVATION</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#f1aa6f] font-semibold">Detected Oil Slick</span>
                  <input
                    type="checkbox"
                    checked={layers.slickPolygon}
                    onChange={() => toggleLayer('slickPolygon')}
                    className="accent-[#f1aa6f] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* RECONSTRUCTION (Backward Hindcast) */}
            <div className="border-t border-[#1168a0]/60 pt-2.5">
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Layers className="w-3.5 h-3.5 text-[#89bada]" />
                <span>RECONSTRUCTION (HINDCAST)</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#edf4fd]">Backward Particles (1,750)</span>
                  <input
                    type="checkbox"
                    checked={layers.particles}
                    onChange={() => toggleLayer('particles')}
                    className="accent-[#89bada] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#edf4fd]">KDE Density Surface</span>
                  <input
                    type="checkbox"
                    checked={layers.kdeDensity}
                    onChange={() => toggleLayer('kdeDensity')}
                    className="accent-[#89bada] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#edf4fd]">95% KDE Envelopes</span>
                  <input
                    type="checkbox"
                    checked={layers.kdeEnvelopes}
                    onChange={() => toggleLayer('kdeEnvelopes')}
                    className="accent-[#89bada] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#89bada] font-semibold">Origin Drift Track</span>
                  <input
                    type="checkbox"
                    checked={layers.originDriftTrack}
                    onChange={() => toggleLayer('originDriftTrack')}
                    className="accent-[#89bada] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* FORECAST (Forward Forecast) */}
            <div className="border-t border-[#1168a0]/60 pt-2.5">
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Wind className="w-3.5 h-3.5 text-[#f1aa6f]" />
                <span>FORECAST (FORWARD)</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#edf4fd]">Forward Particles (1,000)</span>
                  <input
                    type="checkbox"
                    checked={layers.forecastParticles}
                    onChange={() => toggleLayer('forecastParticles')}
                    className="accent-[#f1aa6f] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#f1aa6f] font-semibold">Forecast Drift Track</span>
                  <input
                    type="checkbox"
                    checked={layers.forecastDriftTrack}
                    onChange={() => toggleLayer('forecastDriftTrack')}
                    className="accent-[#f1aa6f] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* VESSEL TRAFFIC */}
            <div className="border-t border-[#1168a0]/60 pt-2.5">
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-bold">
                <Ship className="w-3.5 h-3.5 text-[#89bada]" />
                <span>VESSEL TRAFFIC</span>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#edf4fd] font-semibold">Candidate Vessels (Top 5)</span>
                  <input
                    type="checkbox"
                    checked={layers.suspectTracks}
                    onChange={() => toggleLayer('suspectTracks')}
                    className="accent-[#89bada] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <span className="text-[#f1aa6f] font-medium">Closest Approach Vector</span>
                  <input
                    type="checkbox"
                    checked={layers.closestApproachLine}
                    onChange={() => toggleLayer('closestApproachLine')}
                    className="accent-[#f1aa6f] rounded cursor-pointer w-3.5 h-3.5"
                  />
                </label>
              </div>
            </div>

            {/* Opacity & Brightness Sliders */}
            <div className="border-t border-[#1168a0]/60 pt-2.5 space-y-2.5">
              <div className="text-[10px] text-[#89bada] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                <Sliders className="w-3.5 h-3.5 text-[#f1aa6f]" />
                <span>Display Adjustments</span>
              </div>

              {/* Map Canvas Brightness */}
              <div>
                <div className="flex justify-between text-[10px] text-[#edf4fd] font-medium mb-1">
                  <span className="flex items-center gap-1 text-[#89bada]">
                    <Sun className="w-3 h-3 text-[#f1aa6f]" />
                    Map Canvas Brightness
                  </span>
                  <span className="text-[#f1aa6f] font-mono font-bold">{Math.round(mapBrightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.8"
                  step="0.05"
                  value={mapBrightness}
                  onChange={(e) => setMapBrightness(parseFloat(e.target.value))}
                  className="w-full accent-[#f1aa6f] h-1.5 bg-[#082e49] rounded-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
