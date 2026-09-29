import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useInvestigation } from '../context/InvestigationContext';
import { SlickPreviewCanvas } from '../components/detection/SlickPreviewCanvas';
import { useLiveDetection, useLiveDetectionError } from '../services/detectionService';
import {
  RotateCcw,
  Crosshair,
  ArrowRight,
  Loader2,
  Info,
  AlertTriangle,
} from 'lucide-react';

export const DetectionPage: React.FC = () => {
  const {
    geometry,
    sarPreviewMode,
    setSarPreviewMode,
    startSlickAnalysis,
    processingState,
    analysisStepIndex,
    analysisTotalSteps,
    goToRoute,
  } = useInvestigation();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Map layer toggles for Detection Page
  const [showFootprint, setShowFootprint] = useState(true);
  const [showSlick, setShowSlick] = useState(true);
  const [showCentroid, setShowCentroid] = useState(true);

  // References to Leaflet layers
  const footprintLayerRef = useRef<L.Rectangle | null>(null);
  const slickLayerRef = useRef<L.LayerGroup | null>(null);
  const centroidMarkerRef = useRef<L.CircleMarker | null>(null);

  // ---- Live model output (Colab) overrides the demo geometry when available
  const live = useLiveDetection();
  const liveError = useLiveDetectionError();
  const liveGeo = live?.geometry;
  const hasLiveMap = Boolean(live && liveGeo?.georeferenced && liveGeo.centroid);
  const noSlick = Boolean(live && !liveGeo?.detected);

  const displayGeometry = useMemo(() => {
    if (!hasLiveMap || !liveGeo) return geometry;
    // GeoJSON (Multi)Polygon -> list of outer rings [[lon, lat], ...]
    const rings: [number, number][][] = [];
    liveGeo.geojson.features.forEach((f) => {
      const g = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
      if (g.type === 'Polygon') rings.push(g.coordinates[0] as [number, number][]);
      if (g.type === 'MultiPolygon') g.coordinates.forEach((poly) => rings.push(poly[0] as [number, number][]));
    });
    return {
      ...geometry,
      centroid: { lat: liveGeo.centroid!.lat, lon: liveGeo.centroid!.lon },
      coordinates: rings,
    } as typeof geometry;
  }, [geometry, hasLiveMap, liveGeo]);

  const centerLat = displayGeometry.centroid.lat;
  const centerLon = displayGeometry.centroid.lon;

  const fmtLat = (v: number) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? 'N' : 'S'}`;
  const fmtLon = (v: number) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? 'E' : 'W'}`;
  const num = (v: number | null | undefined, d: number, unit = '') =>
    v === null || v === undefined ? '—' : `${v.toFixed(d)}${unit}`;

  // Values shown in the side panel and popup (demo values when not live)
  const stats = live
    ? {
        area: num(liveGeo?.areaKm2, 2, ' km²'),
        perimeter: num(liveGeo?.perimeterKm, 2, ' km'),
        length: num(liveGeo?.mrrLengthKm, 1, ' km'),
        width: num(liveGeo?.mrrWidthKm, 1, ' km'),
        elongation: num(liveGeo?.elongation ?? null, 1),
        lat: liveGeo?.centroid ? fmtLat(liveGeo.centroid.lat) : '—',
        lon: liveGeo?.centroid ? fmtLon(liveGeo.centroid.lon) : '—',
        confidence: `${(live.inference.meanConfidence * 100).toFixed(1)}%`,
        captureLabel: 'Scene',
        capture: live.scene.name,
      }
    : {
        area: '17.73 km²',
        perimeter: '31.42 km',
        length: '12.8 km',
        width: '1.9 km',
        elongation: '6.7',
        lat: '35.5240° N',
        lon: '18.4520° E',
        confidence: '94.2%',
        captureLabel: 'Capture time',
        capture: '26 Oct 2019 • 05:53 UTC',
      };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLon],
      zoom: 11,
      minZoom: 8,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Satellite Basemap with 125% brightness matching investigation page
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        maxNativeZoom: 11,
        attribution: 'Tiles © Esri',
      }
    ).addTo(map);

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const applyBrightness = () => {
      const container = tileLayer.getContainer();
      if (container) {
        container.style.filter = 'brightness(125%)';
      }
    };
    applyBrightness();
    tileLayer.on('load', applyBrightness);

    // Track coordinates
    map.on('mousemove', (e) => {
      setMouseCoords({
        lat: parseFloat(e.latlng.lat.toFixed(5)),
        lon: parseFloat(e.latlng.lng.toFixed(5)),
      });
    });

    // 1. SAR Footprint layer (Square, Theme Orange #D95800)
    const halfLat = 0.20; // ~22.2 km
    const halfLon = halfLat / Math.cos((centerLat * Math.PI) / 180); // ~28.2 km for perfect square in Mercator
    const squareBounds: [[number, number], [number, number]] =
      hasLiveMap && live?.scene.leafletBounds
        ? live.scene.leafletBounds
        : [
            [centerLat - halfLat, centerLon - halfLon],
            [centerLat + halfLat, centerLon + halfLon],
          ];
    const footprint = L.rectangle(squareBounds, {
      color: '#D95800',
      weight: 2.0,
      dashArray: '6, 6',
      fillColor: '#D95800',
      fillOpacity: 0.10,
    }).addTo(map);
    footprint.bindTooltip(
      hasLiveMap && live ? `SAR Footprint • ${live.scene.name}` : 'Sentinel-1 SAR Footprint (Orange Square • 2019-10-26 05:53 UTC)',
      { sticky: true }
    );
    footprintLayerRef.current = footprint;

    // 2. Oil Slick Layer Group (Theme Orange #D95800)
    const slickGroup = L.layerGroup().addTo(map);
    displayGeometry.coordinates.forEach((partCoords) => {
      const latLngs = partCoords.map(([lon, lat]) => [lat, lon] as [number, number]);
      const polygon = L.polygon(latLngs, {
        color: '#D95800',
        weight: 2.5,
        fillColor: '#D95800',
        fillOpacity: 0.28,
      });

      polygon.bindPopup(`
        <div style="font-family: 'Poppins', sans-serif; font-size: 11px; padding: 6px; background: #ffffff; color: #1e293b; border-radius: 8px;">
          <div style="color: #d95800; font-weight: bold; margin-bottom: 4px; font-size: 12px;">Detected Oil Slick</div>
          <div style="margin-bottom: 2px;">Area: <b style="color: #1e293b;">${stats.area}</b></div>
          <div style="margin-bottom: 2px;">Confidence: <b style="color: #0f62fe;">${stats.confidence}</b></div>
          <div style="color: #64748b; margin-top: 4px;">Centroid:</div>
          <div style="color: #1e293b; font-weight: bold;">${fmtLat(centerLat)}, ${fmtLon(centerLon)}</div>
        </div>
      `);

      slickGroup.addLayer(polygon);
    });
    slickLayerRef.current = slickGroup;

    // 3. Centroid Marker (Theme Blue #0F62FE)
    const centroidMarker = L.circleMarker([centerLat, centerLon], {
      radius: 6,
      color: '#ffffff',
      weight: 2,
      fillColor: '#0F62FE',
      fillOpacity: 0.95,
    }).addTo(map);
    centroidMarker.bindTooltip(
      `Slick Centroid: ${fmtLat(centerLat)}, ${fmtLon(centerLon)}`,
      { sticky: true }
    );
    centroidMarkerRef.current = centroidMarker;

    if (hasLiveMap) map.fitBounds(footprint.getBounds(), { padding: [20, 20] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLon, displayGeometry, live]);

  // Handle layer toggles
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (footprintLayerRef.current) {
      if (showFootprint) {
        footprintLayerRef.current.addTo(mapInstanceRef.current);
      } else {
        footprintLayerRef.current.remove();
      }
    }
    if (slickLayerRef.current) {
      if (showSlick) {
        slickLayerRef.current.addTo(mapInstanceRef.current);
      } else {
        slickLayerRef.current.remove();
      }
    }
    if (centroidMarkerRef.current) {
      if (showCentroid) {
        centroidMarkerRef.current.addTo(mapInstanceRef.current);
      } else {
        centroidMarkerRef.current.remove();
      }
    }
  }, [showFootprint, showSlick, showCentroid]);

  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    if (hasLiveMap && footprintLayerRef.current) {
      mapInstanceRef.current.fitBounds(footprintLayerRef.current.getBounds(), { padding: [20, 20] });
    } else {
      mapInstanceRef.current.setView([centerLat, centerLon], 11, { animate: true });
    }
  };

  const isAnalysingSlick = processingState === 'analysing-slick';

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-3.5rem)] bg-[#F4F6F8] text-[#1E293B] overflow-hidden select-none font-sans">
      {/* LEFT MAP PANE */}
      <div className="relative flex-1 h-full bg-[#E2E8F0] overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Top-Left Floating Map Controls */}
        <div className="absolute top-4 left-4 z-[400] flex items-center gap-2">
          {/* Layer toggles dropdown/pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/95 border border-slate-200 text-xs text-[#1E293B] backdrop-blur-md shadow-md">
            <button
              onClick={() => setShowFootprint(!showFootprint)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                showFootprint
                  ? 'bg-[#0F62FE] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
              }`}
            >
              SAR Footprint
            </button>
            <button
              onClick={() => setShowSlick(!showSlick)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                showSlick
                  ? 'bg-[#D95800] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
              }`}
            >
              Oil Slick
            </button>
            <button
              onClick={() => setShowCentroid(!showCentroid)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                showCentroid
                  ? 'bg-[#0F62FE] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100'
              }`}
            >
              Centroid
            </button>
          </div>

          {/* Reset view button */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-white/95 border border-slate-200 text-[#64748B] hover:text-[#1E293B] hover:border-slate-400 backdrop-blur-md shadow-md transition-colors cursor-pointer"
            title="Reset Map View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom-Left Coordinate Readout */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] text-[#64748B] backdrop-blur-md shadow-md flex items-center gap-2 pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-[#D95800]" />
          <span>CURSOR:</span>
          <span className="text-[#1E293B] font-bold">
            {mouseCoords ? `${fmtLat(mouseCoords.lat)}, ${fmtLon(mouseCoords.lon)}` : `${fmtLat(centerLat)}, ${fmtLon(centerLon)}`}
          </span>
        </div>
      </div>

      {/* RIGHT ANALYSIS PANEL (Width: 440px matching Investigation workspace) */}
      <div className="w-full md:w-96 lg:w-[440px] h-full bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between shrink-0 overflow-y-auto text-[#1E293B] shadow-xl">
        <div className="p-5 space-y-4">
          {/* Header & Status */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#1E293B] tracking-wide">
                Slick Detection
              </h2>
              <p className="text-[10px] text-[#64748B]">
                DeepLabV3+ ResNet-50 Segmentation
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div
                className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-wider shadow-xs ${
                  noSlick ? 'bg-slate-100 border-slate-300 text-[#64748B]' : 'bg-orange-50 border-[#D95800]/40 text-[#D95800]'
                }`}
              >
                {noSlick ? 'NO SLICK' : 'DETECTED'}
              </div>
              <div className="text-[9px] font-bold tracking-wider text-[#64748B]">
                {live ? `● LIVE MODEL • ${live.inference.device.toUpperCase()} • ${live.inference.runtimeSec}s` : '● DEMO DATA'}
              </div>
            </div>
          </div>

          {liveError && !live && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-orange-50 border border-[#D95800]/40 text-[10px] text-[#D95800]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Model backend unreachable — showing demo data. {liveError}</span>
            </div>
          )}

          {/* Compact Measurements Rows */}
          <div className="space-y-1.5 text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Area</span>
              <span className="text-[#1E293B] font-bold">{stats.area}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Perimeter</span>
              <span className="text-[#1E293B] font-bold">{stats.perimeter}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Length</span>
              <span className="text-[#1E293B] font-bold">{stats.length}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Width</span>
              <span className="text-[#1E293B] font-bold">{stats.width}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Elongation</span>
              <span className="text-[#1E293B] font-bold">{stats.elongation}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Latitude</span>
              <span className="text-[#1E293B] font-bold">{stats.lat}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-[#64748B]">Longitude</span>
              <span className="text-[#1E293B] font-bold">{stats.lon}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#64748B]">{stats.captureLabel}</span>
              <span className="text-[#1E293B] font-medium">{stats.capture}</span>
            </div>
          </div>

          {/* Estimated Slick Type */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-xs space-y-1">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wide font-bold">
              Estimated Slick Type
            </div>
            <div className="text-xs font-extrabold text-[#D95800]">
              Biogenic / Petroleum-like
            </div>
            <div className="text-[10px] text-[#64748B] flex items-center gap-1 mt-1 font-medium">
              <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span>Wave damping classification</span>
            </div>
          </div>

          {/* Slick Image Preview with SAR / MASK / OVERLAY Toggle */}
          <SlickPreviewCanvas
            mode={sarPreviewMode}
            onModeChange={setSarPreviewMode}
            images={live?.images}
          />
        </div>

        {/* Bottom Section: Action Button or Simulated Attribution State */}
        <div className="p-4 border-t border-slate-200 bg-white">
          {isAnalysingSlick ? (
            <div className="space-y-3 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-[#1E293B] font-bold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#D95800] animate-spin" />
                  Reconstructing spill origin
                </span>
                <span className="text-[10px] text-[#0F62FE] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                  STAGE {analysisStepIndex}/{analysisTotalSteps}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-[#1E293B]">
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 1 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Seeding particles
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex > 1 ? '✓' : analysisStepIndex === 1 ? '•' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 2 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Loading ocean forcing
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex > 2 ? '✓' : analysisStepIndex === 2 ? '•' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 3 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Reverse Lagrangian simulation
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex > 3 ? '✓' : analysisStepIndex === 3 ? '•' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 4 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Computing KDE envelope
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex > 4 ? '✓' : analysisStepIndex === 4 ? '•' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 5 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Checking AIS traffic
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex > 5 ? '✓' : analysisStepIndex === 5 ? '•' : '○'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={analysisStepIndex >= 6 ? 'text-[#1E293B] font-bold' : 'text-[#64748B]/60'}>
                    Scoring candidate vessels
                  </span>
                  <span className="text-[#D95800] font-bold">
                    {analysisStepIndex >= 6 ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={startSlickAnalysis}
                className="w-full py-3 px-4 rounded-xl bg-[#0F62FE] hover:bg-[#0050E6] text-white font-extrabold text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                <span>Analyse Slick</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => goToRoute('landing')}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[#1E293B] font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Analyse Another Image</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};