import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useInvestigation } from '../../context/InvestigationContext';
import { LayerControl } from './LayerControl';
import { KdeLegend } from './KdeLegend';
import { KdeInfoPanel } from './KdeInfoPanel';
import { Crosshair } from 'lucide-react';

export const GisMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const kdeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Layer groups
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const slickLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const kdeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const aisLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const forecastLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    geometry,
    kdeHistory,
    currentKdeStep,
    kdeHistoryMode,
    originDriftTrack,
    forecastEnvelopes,
    forecastDriftTrack,
    currentForecastState,
    forecastHourAhead,
    suspects,
    allAisVessels,
    selectedVessel,
    setSelectedVessel,
    aisTrafficFilter,
    currentParticles,
    simDirection,
    layers,
    slickOpacity,
    particleOpacity,
    mapBrightness,
    mapStyle,
    resetMapFocusTrigger,
    setSelectedKdeInfo,
    setSimHourBack,
    hoveredDensity,
    setHoveredDensity,
    activeStep,
    attributionMeta,
  } = useInvestigation();

  const isLive = Boolean(attributionMeta?.isLive);
  const fmtLat = (v: number) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'N' : 'S'}`;
  const fmtLon = (v: number) => `${Math.abs(v).toFixed(4)}°${v >= 0 ? 'E' : 'W'}`;
  const topMdoKm = suspects[0]?.mdoKm;

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number } | null>(null);

  const centerLat = geometry.centroid.lat;
  const centerLon = geometry.centroid.lon;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLon],
      zoom: 11,
      minZoom: 7,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial base tile layer (defaults to Esri World Imagery Satellite)
    const initialTileUrl =
      mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : mapStyle === 'ocean'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 18,
      maxNativeZoom: 11,
      attribution:
        'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Invalidate map size after layout stabilizes
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    slickLayerGroupRef.current = L.layerGroup().addTo(map);
    kdeLayerGroupRef.current = L.layerGroup().addTo(map);
    forecastLayerGroupRef.current = L.layerGroup().addTo(map);
    aisLayerGroupRef.current = L.layerGroup().addTo(map);

    // Mousemove tracking & KDE density hover calculation
    map.on('mousemove', (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lon = parseFloat(e.latlng.lng.toFixed(4));
      setMouseCoords({ lat, lon });

      // Calculate relative density to current KDE centroid
      const c = currentKdeStep.centroid;
      const d = Math.hypot(lat - c.lat, lon - c.lon);
      if (d < 0.05) {
        const dens = Math.max(0, 1 - d / 0.05) * currentKdeStep.relativePeakDensity;
        setHoveredDensity(parseFloat(dens.toFixed(2)));
      } else {
        setHoveredDensity(null);
      }
    });

    map.on('mouseout', () => {
      setHoveredDensity(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLon]);

  // Basemap style updates
  useEffect(() => {
    if (!tileLayerRef.current) return;
    let url =
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    if (mapStyle === 'satellite') {
      url =
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapStyle === 'ocean') {
      url =
        'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}';
    }
    tileLayerRef.current.setUrl(url);
  }, [mapStyle]);

  // Apply Map Canvas Brightness dynamically to Tile Layer pane & container
  useEffect(() => {
    if (mapContainerRef.current) {
      mapContainerRef.current.style.setProperty('--map-tile-brightness', mapBrightness.toString());
    }
    if (mapInstanceRef.current) {
      const tilePane = mapInstanceRef.current.getPane('tilePane');
      if (tilePane) {
        tilePane.style.filter = `brightness(${mapBrightness}) contrast(1.15) saturate(1.08)`;
      }
    }
  }, [mapBrightness, mapStyle]);

  // Reset focus
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([centerLat, centerLon], 11, { animate: true });
  }, [resetMapFocusTrigger, centerLat, centerLon]);

  // Focus on selected vessel
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedVessel) return;
    mapInstanceRef.current.panTo([selectedVessel.latClosest, selectedVessel.lonClosest], {
      animate: true,
      duration: 0.6,
    });
  }, [selectedVessel?.mmsi]);

  // 1. OBSERVATION: SAR Image & Detected Slick
  useEffect(() => {
    const slickGroup = slickLayerGroupRef.current;
    if (!slickGroup) return;
    slickGroup.clearLayers();

    // SAR Footprint (Square, Theme Orange #f1aa6f)
    if (layers.sarImage) {
      const halfLat = 0.20; // ~22.2 km
      const halfLon = halfLat / Math.cos((centerLat * Math.PI) / 180); // ~28.2 km for perfect square in Mercator
      const fb = geometry.sarFootprintBounds;
      const squareBounds: [[number, number], [number, number]] = isLive
        ? [
            [fb.minLat, fb.minLon],
            [fb.maxLat, fb.maxLon],
          ]
        : [
            [centerLat - halfLat, centerLon - halfLon],
            [centerLat + halfLat, centerLon + halfLon],
          ];
      const footprint = L.rectangle(squareBounds, {
        color: '#f1aa6f',
        weight: 2.0,
        dashArray: '6, 6',
        fillColor: '#f1aa6f',
        fillOpacity: 0.10,
      });
      footprint.bindTooltip(
        isLive
          ? `SAR Scene Footprint • ${geometry.t0Utc}`
          : 'Sentinel-1 SAR Footprint (Orange Square • 2019-10-26 05:53 UTC)',
        { sticky: true }
      );
      slickGroup.addLayer(footprint);
    }

    // Detected Slick Polygon (Light Opacity Orange Inside)
    if (layers.slickPolygon) {
      geometry.coordinates.forEach((partCoords) => {
        const latLngs = partCoords.map(([lon, lat]) => [lat, lon] as [number, number]);
        const polygon = L.polygon(latLngs, {
          color: '#f1aa6f',
          weight: 2.2,
          fillColor: '#f1aa6f',
          fillOpacity: 0.28,
        });

        polygon.bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px; padding: 2px;">
            <div style="color: #f1aa6f; font-weight: bold; margin-bottom: 2px;">Detected Oil Slick (T0)</div>
            <div>Area: <b>${isLive ? geometry.areaKm2.toFixed(2) : '17.73'} km²</b></div>
            ${isLive ? '' : '<div>Confidence: <b>94.2%</b></div>'}
            <div>Centroid: <b>${fmtLat(centerLat)}, ${fmtLon(centerLon)}</b></div>
            <div style="color: #89bada; margin-top: 2px;">${isLive ? `T0 • ${geometry.t0Utc}` : 'Sentinel-1 C-SAR • 05:53 UTC'}</div>
          </div>
        `);
        slickGroup.addLayer(polygon);
      });
    }

    // Centroid Marker
    if (layers.centroid) {
      const marker = L.circleMarker([centerLat, centerLon], {
        radius: 5.5,
        color: '#fbbf24',
        weight: 2,
        fillColor: '#d97706',
        fillOpacity: 0.95,
      });
      marker.bindTooltip(`Observed Centroid (T0): ${fmtLat(centerLat)}, ${fmtLon(centerLon)}`, {
        sticky: true,
      });
      slickGroup.addLayer(marker);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.sarImage, layers.slickPolygon, layers.centroid, geometry, slickOpacity, centerLat, centerLon, isLive]);

  // 2. RECONSTRUCTION: Multi-Timestep 95% KDE Envelopes, Centroids & Origin Track
  useEffect(() => {
    const kdeGroup = kdeLayerGroupRef.current;
    if (!kdeGroup) return;
    kdeGroup.clearLayers();

    if (simDirection === 'FORWARD') return;

    // Origin Drift Track line (connecting origin centroids T0 -> T-24h)
    if (layers.originDriftTrack) {
      const latLngs = originDriftTrack.map((p) => [p.lat, p.lon] as [number, number]);
      const driftLine = L.polyline(latLngs, {
        color: '#89bada',
        weight: 2.5,
        dashArray: '5, 5',
      });
      driftLine.bindTooltip('RECONSTRUCTED ORIGIN TRAJECTORY (T0 → T-24h)', { sticky: true });
      kdeGroup.addLayer(driftLine);
    }

    // Determine which envelopes to display based on kdeHistoryMode
    const envelopesToRender: {
      step: (typeof kdeHistory)[0];
      isCurrent: boolean;
      opacity: number;
      weight: number;
    }[] = [];

    if (kdeHistoryMode === 'current') {
      envelopesToRender.push({
        step: currentKdeStep,
        isCurrent: true,
        opacity: 0.35,
        weight: 2.2,
      });
    } else if (kdeHistoryMode === 'previous') {
      kdeHistory.forEach((k) => {
        const isCurrent = k.timeOffsetHours === currentKdeStep.timeOffsetHours;
        const isPastOrEqual = k.timeOffsetHours <= currentKdeStep.timeOffsetHours;
        if (isCurrent) {
          envelopesToRender.push({ step: k, isCurrent: true, opacity: 0.35, weight: 2.2 });
        } else if (isPastOrEqual) {
          envelopesToRender.push({ step: k, isCurrent: false, opacity: 0.12, weight: 1.2 });
        }
      });
    } else if (kdeHistoryMode === 'all') {
      kdeHistory.forEach((k) => {
        const isCurrent = Math.round(k.timeOffsetHours) === Math.round(currentKdeStep.timeOffsetHours);
        envelopesToRender.push({
          step: k,
          isCurrent,
          opacity: isCurrent ? 0.32 : 0.1,
          weight: isCurrent ? 3.0 : 1.6,
        });
      });
    }

    // 2-hour interval color gradient mapping for 95% KDE envelopes (Dark blue to Light blue)
    const getKdeColor = (h: number) => {
      const colorMap: Record<number, string> = {
        0: '#0c2e59',  // 0h: deep dark blue (at observation)
        2: '#0e3d74',  // 2h
        4: '#104d8e',  // 4h
        6: '#1168a0',  // 6h: dark blue (primary theme)
        8: '#147cb8',  // 8h
        10: '#1a91cf', // 10h
        12: '#2aa6e3', // 12h: clear azure
        14: '#45baf2', // 14h: vibrant cerulean
        16: '#63cdfa', // 16h: bright sky blue (interception peak window)
        18: '#89bada', // 18h: light blue (primary theme)
        20: '#a8d1ed', // 20h
        22: '#c9e4f7', // 22h
        24: '#e4f3fd', // 24h: soft lightest blue
      };
      const closestEven = Math.max(0, Math.min(24, Math.round(h / 2) * 2));
      return colorMap[closestEven] || '#1168a0';
    };

    // Render 95% KDE envelopes
    if (layers.kdeEnvelopes) {
      envelopesToRender.forEach(({ step, isCurrent, opacity, weight }) => {
        const latLngs = step.contour95.map(([lon, lat]) => [lat, lon] as [number, number]);
        const color = getKdeColor(step.timeOffsetHours);

        const poly = L.polygon(latLngs, {
          color,
          weight: isCurrent ? 3.2 : weight,
          opacity: isCurrent ? 1 : 0.85,
          fillColor: color,
          fillOpacity: opacity,
          dashArray: undefined,
        });

        poly.on('click', () => {
          setSelectedKdeInfo(step);
          setSimHourBack(step.timeOffsetHours);
        });

        poly.bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px; padding: 2px;">
            <div style="color: ${color}; font-weight: bold; margin-bottom: 2px;">
              95% KDE PROBABLE ORIGIN ENVELOPE (T-${step.timeOffsetHours}h)
            </div>
            <div>Time: <b>${step.timeUtc}</b></div>
            <div>Envelope Area: <b>${step.envelopeAreaKm2.toFixed(1)} km²</b></div>
            <div>Centroid: <b>${fmtLat(step.centroid.lat)}, ${fmtLon(step.centroid.lon)}</b></div>
            ${isLive ? '' : `<div>Density Peak: <b>${fmtLat(step.densityPeak.lat)}, ${fmtLon(step.densityPeak.lon)}</b></div>`}
            ${step.isKeyInterception ? `<div style="color: #f1aa6f; font-weight: bold; margin-top: 4px;">★ PEAK AIS SPATIO-TEMPORAL INTERSECTION (${isLive && topMdoKm !== undefined ? topMdoKm.toFixed(2) : '0.54'} km MDO)</div>` : ''}
          </div>
        `);

        poly.bindTooltip(`95% KDE Origin Envelope (T-${step.timeOffsetHours}h)`, { sticky: true });
        kdeGroup.addLayer(poly);
      });
    }

    // KDE Centroid markers (Permanently enabled)
    const activeColor = getKdeColor(currentKdeStep.timeOffsetHours);
    const activeMarker = L.circleMarker([currentKdeStep.centroid.lat, currentKdeStep.centroid.lon], {
      radius: 6,
      color: activeColor,
      weight: 2,
      fillColor: currentKdeStep.isKeyInterception ? '#f1aa6f' : '#0c2e59',
      fillOpacity: 0.95,
    });

    activeMarker.on('click', () => {
      setSelectedKdeInfo(currentKdeStep);
    });

    activeMarker.bindPopup(`
      <div style="font-family: Poppins, sans-serif; font-size: 11px; padding: 2px;">
        <div style="color: ${activeColor}; font-weight: bold; margin-bottom: 2px;">
          KDE Centroid (T-${currentKdeStep.timeOffsetHours}h)
        </div>
        <div>Coordinates: <b>${fmtLat(currentKdeStep.centroid.lat)}, ${fmtLon(currentKdeStep.centroid.lon)}</b></div>
        <div>Envelope Area: <b>${currentKdeStep.envelopeAreaKm2} km²</b></div>
        ${currentKdeStep.isKeyInterception ? '<div style="color: #f1aa6f; font-weight: bold; margin-top: 4px;">★ PEAK AIS SPATIO-TEMPORAL INTERSECTION</div>' : ''}
      </div>
    `);

    kdeGroup.addLayer(activeMarker);

    // If showing all or previous, show past centroids too
    if (kdeHistoryMode === 'all') {
      kdeHistory.forEach((k) => {
        if (k.timeOffsetHours !== currentKdeStep.timeOffsetHours) {
          const marker = L.circleMarker([k.centroid.lat, k.centroid.lon], {
            radius: 4,
            color: getKdeColor(k.timeOffsetHours),
            weight: 1.5,
            fillColor: '#0a1d33',
            fillOpacity: 0.85,
          });
          kdeGroup.addLayer(marker);
        }
      });
    }
  }, [
    layers.originDriftTrack,
    layers.kdeEnvelopes,
    kdeHistory,
    currentKdeStep,
    kdeHistoryMode,
    simDirection,
    originDriftTrack,
    setSelectedKdeInfo,
    setSimHourBack,
    isLive,
    topMdoKm,
  ]);

  // 3. FORECAST: Forward Dispersion Envelopes & Forward Drift Track (T0 → T+24h)
  useEffect(() => {
    const fGroup = forecastLayerGroupRef.current;
    if (!fGroup) return;
    fGroup.clearLayers();

    if (simDirection !== 'FORWARD') return;

    // Forward Dispersion Envelopes removed per user requirement (particles and drift track only)

    // Forward Drift Track connecting predicted centroids
    if (layers.forecastDriftTrack && forecastDriftTrack) {
      const trackLatLngs = forecastDriftTrack.map((pt) => [pt.lat, pt.lon] as [number, number]);
      const driftLine = L.polyline(trackLatLngs, {
        color: '#f97316',
        weight: 2.5,
        dashArray: '5, 5',
      });
      driftLine.bindTooltip('PREDICTED FORWARD TRAJECTORY (T0 → T+24h)', { sticky: true });
      fGroup.addLayer(driftLine);

      // Centroid markers along forward track
      forecastDriftTrack.forEach((pt) => {
        const isSelected = Math.abs(forecastHourAhead - pt.hourAhead) < 1.5;
        const marker = L.circleMarker([pt.lat, pt.lon], {
          radius: isSelected ? 6 : 4,
          color: '#f97316',
          weight: 2,
          fillColor: isSelected ? '#fbbf24' : '#7c2d12',
          fillOpacity: 0.9,
        });

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <div style="color: #f97316; font-weight: bold;">FORECAST CENTROID T+${pt.hourAhead}h</div>
            <div>Time: <b>${pt.timeUtc}</b></div>
            <div>Centroid: <b>${pt.lat.toFixed(4)}°N, ${pt.lon.toFixed(4)}°E</b></div>
            <div>Area Expansion: <b>${pt.areaKm2.toFixed(1)} km²</b></div>
          </div>
        `);

        fGroup.addLayer(marker);
      });
    }
  }, [
    simDirection,
    layers.forecastDriftTrack,
    layers.forecastEnvelopes,
    forecastDriftTrack,
    forecastEnvelopes,
    forecastHourAhead,
  ]);

  // 4. VESSEL TRAFFIC: AIS Tracks, Candidate Vessels & Closest Approach Vector
  useEffect(() => {
    const aisGroup = aisLayerGroupRef.current;
    if (!aisGroup) return;
    aisGroup.clearLayers();

    // Only render AIS ships paths and markers when on AIS Screening step
    const isAisScreeningActive = activeStep === 5 || activeStep === 6;
    if (!isAisScreeningActive) return;

    const vesselsToRender =
      aisTrafficFilter === 'all'
        ? allAisVessels
        : suspects.map((s) => ({
            mmsi: s.mmsi,
            name: s.vesselName,
            vesselType: s.vesselType,
            flag: 'PA',
            isRelevant: s.rank <= 3,
            closestApproachKm: s.mdoKm,
            closestHourBack: s.closestHourBack,
            sogKn: s.sogKn,
            cogDeg: s.cogDeg,
            lastPosition: { lat: s.latClosest, lon: s.lonClosest },
            track: s.track,
          }));

    if (layers.aisTraffic || layers.suspectTracks) {
      vesselsToRender.forEach((vessel) => {
        const isSelected = selectedVessel?.mmsi === vessel.mmsi;
        const matchingSuspect = suspects.find((s) => s.mmsi === vessel.mmsi);
        const isRank1 = matchingSuspect?.rank === 1;

        const trackLatLngs = vessel.track.map((pt) => [pt.lat, pt.lon] as [number, number]);

        // Line color: crimson red for rank 1 (matching notebook Folium), vibrant orange for other candidates
        const trackColor = isRank1 ? '#ef4444' : isSelected ? '#fbbf24' : '#f97316';

        const trackLine = L.polyline(trackLatLngs, {
          color: trackColor,
          weight: isRank1 ? 3 : isSelected ? 2.5 : 1.8,
          opacity: isRank1 ? 0.95 : isSelected ? 0.9 : 0.75,
          dashArray: isRank1 ? undefined : '5, 5',
        });

        trackLine.on('click', () => {
          if (matchingSuspect) setSelectedVessel(matchingSuspect);
        });

        aisGroup.addLayer(trackLine);

        // Vessel approach marker
        const markerColor = isRank1 ? '#ef4444' : '#f97316';
        const marker = L.circleMarker([vessel.lastPosition.lat, vessel.lastPosition.lon], {
          radius: isRank1 ? 6 : 4.5,
          color: '#ffffff',
          weight: 1.5,
          fillColor: markerColor,
          fillOpacity: 1,
        });

        marker.on('click', () => {
          if (matchingSuspect) setSelectedVessel(matchingSuspect);
        });

        if (matchingSuspect) {
          marker.bindTooltip(
            `<span style="color: ${isRank1 ? '#fca5a5' : '#fdba74'}; font-weight: bold;">#${matchingSuspect.rank} ${matchingSuspect.mmsi}</span>`,
            {
              permanent: isRank1 || isSelected,
              direction: 'right',
              offset: [8, 0],
              className: 'vessel-track-badge',
            }
          );
        }

        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <div style="color: ${isRank1 ? '#ef4444' : '#f97316'}; font-weight: bold; margin-bottom: 2px;">
              ${matchingSuspect ? `RANK #${matchingSuspect.rank} • ` : ''}${vessel.name}
            </div>
            <div>MMSI: <b>${vessel.mmsi}</b></div>
            <div>Type: <b>${vessel.vesselType}</b></div>
            <div>Speed / Course: <b>${vessel.sogKn} kn @ ${vessel.cogDeg}°</b></div>
            <div>Closest Approach: <b>${vessel.closestApproachKm} km (T-${vessel.closestHourBack}h)</b></div>
            ${matchingSuspect ? `<div style="color: #10b981; margin-top: 4px; font-weight: bold;">Attribution Score: ${matchingSuspect.culpritScorePct}%</div>` : ''}
          </div>
        `);

        aisGroup.addLayer(marker);
      });
    }

    // Closest Approach Vector Line (between selected vessel and T-16h origin centroid)
    if (layers.closestApproachLine && selectedVessel) {
      const targetCentroid =
        kdeHistory.find((k) => k.timeOffsetHours === selectedVessel.closestHourBack)?.centroid ||
        (kdeHistory[3] ?? kdeHistory[0]).centroid; // T-16h default

      const connectionLine = L.polyline(
        [
          [selectedVessel.latClosest, selectedVessel.lonClosest],
          [targetCentroid.lat, targetCentroid.lon],
        ],
        {
          color: '#fbbf24',
          weight: 2,
          dashArray: '4, 4',
        }
      );

      connectionLine.bindTooltip(
        `CLOSEST APPROACH: ${selectedVessel.mdoKm} km at T-${selectedVessel.closestHourBack}h`,
        { permanent: true, direction: 'center', className: 'tactical-tooltip' }
      );

      aisGroup.addLayer(connectionLine);
    }
  }, [
    layers.aisTraffic,
    layers.suspectTracks,
    layers.closestApproachLine,
    aisTrafficFilter,
    allAisVessels,
    suspects,
    selectedVessel,
    kdeHistory,
    setSelectedVessel,
    activeStep,
  ]);

  // 5. HTML5 Canvas: Smooth KDE Density Surface
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = kdeCanvasRef.current;
    if (!map || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    };
    updateCanvasSize();

    const drawKdeDensity = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!layers.kdeDensity || simDirection === 'FORWARD') return;

      const c = currentKdeStep.centroid;
      const pt = map.latLngToContainerPoint([c.lat, c.lon]);

      const zoom = map.getZoom();
      const radiusPx = Math.max(25, 45 * Math.pow(2, zoom - 11));

      // Radial gradient representing smooth KDE probability density
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, radiusPx);
      gradient.addColorStop(0, 'rgba(168, 85, 247, 0.42)');
      gradient.addColorStop(0.35, 'rgba(168, 85, 247, 0.28)');
      gradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.12)');
      gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    };

    drawKdeDensity();

    map.on('move', drawKdeDensity);
    map.on('zoom', drawKdeDensity);
    map.on('resize', updateCanvasSize);

    return () => {
      map.off('move', drawKdeDensity);
      map.off('zoom', drawKdeDensity);
      map.off('resize', updateCanvasSize);
    };
  }, [currentKdeStep, layers.kdeDensity, simDirection]);

  // 6. HTML5 Canvas: 1,750 Lagrangian Particles Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = particleCanvasRef.current;
    if (!map || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    };
    updateCanvasSize();

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isForward = simDirection === 'FORWARD';
      const shouldDraw = isForward ? layers.forecastParticles : layers.particles;
      if (!shouldDraw || particleOpacity <= 0) return;

      const particles = isForward ? currentForecastState.particles : currentParticles.particles;
      if (!particles || particles.length === 0) return;

      // Particle styling with high-performance canvas shadow glow (Theme Orange #f1aa6f)
      ctx.shadowBlur = 4.0;
      ctx.shadowColor = 'rgba(241, 170, 111, 0.75)';
      ctx.fillStyle = `rgba(241, 170, 111, ${particleOpacity * 0.95})`;

      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const point = map.latLngToContainerPoint([pt.lat, pt.lon]);

        if (
          point.x >= -10 &&
          point.x <= canvas.width + 10 &&
          point.y >= -10 &&
          point.y <= canvas.height + 10
        ) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    drawParticles();

    map.on('move', drawParticles);
    map.on('zoom', drawParticles);
    map.on('resize', updateCanvasSize);

    return () => {
      map.off('move', drawParticles);
      map.off('zoom', drawParticles);
      map.off('resize', updateCanvasSize);
    };
  }, [
    currentParticles,
    currentForecastState,
    simDirection,
    layers.particles,
    layers.forecastParticles,
    particleOpacity,
  ]);

  return (
    <div className="relative w-full h-full bg-[#090b10] overflow-hidden select-none font-mono">
      {/* Leaflet map */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* KDE Density Canvas */}
      <canvas
        ref={kdeCanvasRef}
        className="absolute inset-0 pointer-events-none z-[350]"
      />

      {/* 1,750 Particles Canvas */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 pointer-events-none z-[400]"
      />

      {/* Structured Tactical Layer Control */}
      <LayerControl />

      {/* Floating Forward Forecast Mode HUD (Top Right) */}
      {simDirection === 'FORWARD' && (
        <div className="absolute top-4 right-4 z-[450] bg-slate-950/92 border border-amber-500/50 px-3.5 py-2 rounded-lg backdrop-blur-md text-xs font-mono shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold text-amber-300 tracking-wide">FORWARD SPILL FORECAST</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              T+{forecastHourAhead.toFixed(1)}h
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-0.5">
            <span>
              Particles: <b className="text-[#f1aa6f]">1,000</b>
            </span>
            <span>•</span>
            <span>
              Area: <b className="text-white">{currentForecastState.areaKm2.toFixed(1)} km²</b>
            </span>
            <span>•</span>
            <span>
              Evap: <b className="text-amber-400">{currentForecastState.evaporatedPct.toFixed(1)}%</b>
            </span>
            <span>•</span>
            <span>
              Disp: <b className="text-emerald-400">{currentForecastState.dispersedPct.toFixed(1)}%</b>
            </span>
          </div>
        </div>
      )}

      {/* Interactive KDE Origin Information Panel */}
      <KdeInfoPanel />

      {/* KDE Map Legend */}
      <KdeLegend />

      {/* Bottom-Left Coordinate & Hover Density HUD */}
      <div className="absolute bottom-4 left-4 z-[450] bg-[#0d0f17]/92 border border-slate-800/90 px-3 py-1.5 rounded text-[11px] font-mono text-slate-300 pointer-events-none flex items-center gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          <span>CURSOR:</span>
          <span className="text-slate-100 font-semibold">
            {mouseCoords ? `${fmtLat(mouseCoords.lat)}, ${fmtLon(mouseCoords.lon)}` : `${fmtLat(centerLat)}, ${fmtLon(centerLon)}`}
          </span>
        </div>

        {hoveredDensity !== null && (
          <>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 text-[#89bada]">
              <span>Relative density:</span>
              <span className="font-bold text-white">{Math.round(hoveredDensity * 100)}%</span>
            </div>
          </>
        )}

        <div className="h-3 w-px bg-slate-700 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <span>REGION:</span>
          <span className="text-slate-200">{isLive ? `LIVE MODEL / ${geometry.localCrs}` : 'IONIAN SEA / EPSG:32634'}</span>
        </div>
      </div>
    </div>
  );
};
