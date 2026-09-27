import {
  AttributionResult,
  SlickGeometry,
  SimulationConfig,
  HourlyParticleState,
  KDETimeStep,
  KdeEnvelope,
  SuspectVessel,
  AISVesselTrack,
  AisScreeningSummary,
  ManoeuvreType,
} from '../types';
import {
  DEMO_SIM_CONFIG,
  DEMO_HOURLY_PARTICLES,
  DEMO_KDE_TIMESTEPS,
  DEMO_KDE_ENVELOPES,
  DEMO_ORIGIN_DRIFT_TRACK,
  DEMO_FORECAST_PARTICLES,
  DEMO_FORECAST_ENVELOPES,
  DEMO_FORECAST_DRIFT_TRACK,
  DEMO_AIS_SUMMARY,
  DEMO_ALL_AIS_VESSELS,
  DEMO_SUSPECTS,
} from '../data/demoData';
import {
  runAttribution,
  attributionVideoUrl,
  AttributionResult as LiveResult,
} from './liveAttributionService';
import { getLiveDetection } from './detectionService';

export interface AttributionProgressCallback {
  (stepName: string, stepIndex: number, totalSteps: number, isComplete: boolean): void;
}

const DEMO_RESULT: AttributionResult = {
  particles: DEMO_HOURLY_PARTICLES,
  kdeHistory: DEMO_KDE_TIMESTEPS,
  kdeEnvelopes: DEMO_KDE_ENVELOPES,
  originDriftTrack: DEMO_ORIGIN_DRIFT_TRACK,
  forecastParticles: DEMO_FORECAST_PARTICLES,
  forecastEnvelopes: DEMO_FORECAST_ENVELOPES,
  forecastDriftTrack: DEMO_FORECAST_DRIFT_TRACK,
  aisSummary: DEMO_AIS_SUMMARY,
  aisVessels: DEMO_ALL_AIS_VESSELS,
  suspects: DEMO_SUSPECTS,
};

export const getDemoAttribution = (): AttributionResult => DEMO_RESULT;

/**
 * Reverse-Lagrangian spill attribution.
 * - Live: when the detection model produced a slick and a model server is configured
 *   (VITE_ATTRIBUTION_API_URL / VITE_DETECTION_API_URL), runs the real hindcast + AIS
 *   attribution on the backend and converts the result to the app's data model.
 * - Otherwise (or if the server fails): deterministic demo data, as before.
 */
export async function analyseSlick(
  _geometry: SlickGeometry,
  config: SimulationConfig = DEMO_SIM_CONFIG,
  onProgress?: AttributionProgressCallback
): Promise<AttributionResult> {
  const steps = [
    'Seeding particles',
    'Loading ocean forcing',
    'Reverse Lagrangian simulation',
    'Computing KDE envelope',
    'Checking AIS traffic',
    'Scoring candidate vessels',
  ];

  // ------------------------------------------------------------------ LIVE MODEL
  if (getLiveDetection()) {
    onProgress?.('Submitting slick to model server', 0, steps.length, false);
    const live = await runAttribution({
      hoursBack: config.hindcastHorizonHours,
      // stage 7 (rendering videos) is shown on the last checklist item
      onStage: (i, _total, name) => onProgress?.(name, Math.min(i, steps.length), steps.length, false),
    });
    if (live) {
      onProgress?.('Attribution Ready', steps.length, steps.length, true);
      return toAppModel(live);
    }
    console.warn('[Attribution] live run unavailable — using demo data');
  }

  // ------------------------------------------------------------------ DEMO MODE
  for (let i = 0; i < steps.length; i++) {
    onProgress?.(steps[i], i + 1, steps.length, false);
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  onProgress?.('Attribution Ready', steps.length, steps.length, true);
  return DEMO_RESULT;
}

// =============================================================================
// Backend result  →  app data model (types/index.ts)
// =============================================================================
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2019-10-26T05:53:00Z' → '26 Oct 05:53 UTC' (same style as the demo data) */
export function fmtUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

type Ring = [number, number][];

/** Outer rings of a (Multi)Polygon, largest first */
function outerRings(g: GeoJSON.Polygon | GeoJSON.MultiPolygon): Ring[] {
  const rings: Ring[] =
    g.type === 'Polygon' ? [g.coordinates[0] as Ring] : g.coordinates.map((poly) => poly[0] as Ring);
  const area = (r: Ring) =>
    Math.abs(
      r.reduce((s, [x1, y1], i) => {
        const [x2, y2] = r[(i + 1) % r.length];
        return s + (x1 * y2 - x2 * y1);
      }, 0)
    ) / 2;
  return rings.sort((a, b) => area(b) - area(a));
}

function bounds(rings: Ring[]) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  rings.forEach((r) =>
    r.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    })
  );
  return { minLon, maxLon, minLat, maxLat };
}

function manoeuvre(flag: string): ManoeuvreType {
  if (flag.includes('loiter')) return 'loitering';
  if (flag.includes('speed_dev')) return 'speed_deviation';
  if (flag.includes('turn')) return 'course_turn';
  return 'cruising';
}

function toAppModel(r: LiveResult): AttributionResult {
  const t0 = new Date(r.t0).getTime();
  const hourBackOf = (iso: string) => Math.round(((t0 - new Date(iso).getTime()) / 3600_000) * 10) / 10;
  const keyHour = r.suspects[0]?.closestHourBack ?? -1;

  // ---- slick geometry (drives map centre, polygon, popups)
  const slickRings = outerRings(r.slick.geojson);
  const lb = getLiveDetection()?.scene.leafletBounds;
  const slickGeometry: SlickGeometry = {
    t0Utc: fmtUtc(r.t0),
    centroid: { lon: r.slick.centroidLon, lat: r.slick.centroidLat },
    numParts: r.slick.nParts,
    areaKm2: r.slick.areaKm2,
    perimeterKm: r.slick.perimeterKm,
    lengthKm: r.slick.mrrLengthKm,
    widthKm: r.slick.mrrWidthKm,
    pcaAxisBearingDeg: r.slick.pcaAxisBearingDeg,
    pcaElongationRatio: r.slick.pcaElongationRatio,
    mrrLengthKm: r.slick.mrrLengthKm,
    mrrWidthKm: r.slick.mrrWidthKm,
    mrrBearingDeg: r.slick.mrrBearingDeg,
    localCrs: (r.slick as { localCrs?: string }).localCrs ?? 'UTM',
    wgs84Bounds: bounds(slickRings),
    sarFootprintBounds: lb
      ? { minLat: lb[0][0], minLon: lb[0][1], maxLat: lb[1][0], maxLon: lb[1][1] }
      : bounds(slickRings),
    coordinates: slickRings,
  };

  // ---- particles per hour
  const particles: HourlyParticleState[] = r.particles.map((p) => ({
    hourBack: p.hourBack,
    timeUtc: fmtUtc(p.timestamp),
    particles: p.positions.map(([lon, lat], id) => ({ id, lon, lat })),
  }));
  const particlesByHour = new Map(particles.map((p) => [p.hourBack, p.particles]));

  // ---- KDE history & envelopes
  const minArea = Math.min(...r.envelopes.map((e) => e.areaKm2));
  const kdeHistory: KDETimeStep[] = r.envelopes.map((e) => {
    const ring = outerRings(e.geometry)[0] ?? [];
    return {
      timeOffsetHours: e.hourBack,
      timeUtc: fmtUtc(e.timestamp),
      particles: particlesByHour.get(e.hourBack) ?? [],
      densityGrid: { bounds: bounds([ring]), rows: 0, cols: 0, values: [] },
      contour95: ring,
      centroid: { lat: e.centroidLat, lon: e.centroidLon },
      densityPeak: { lat: e.centroidLat, lon: e.centroidLon },
      envelopeAreaKm2: Math.round(e.areaKm2 * 100) / 100,
      // denser (smaller) envelopes → higher relative peak density
      relativePeakDensity: Math.round((minArea / Math.max(e.areaKm2, 1e-6)) * 100) / 100,
      isKeyInterception: e.hourBack === keyHour,
    };
  });
  const kdeEnvelopes: KdeEnvelope[] = r.envelopes.map((e) => ({
    hourBack: e.hourBack,
    timeUtc: fmtUtc(e.timestamp),
    areaKm2: e.areaKm2,
    centroid: [e.centroidLon, e.centroidLat],
    polygon: outerRings(e.geometry)[0] ?? [],
    isKeyHour: e.hourBack === keyHour,
  }));
  const originDriftTrack = r.envelopes.map((e) => ({
    hourBack: e.hourBack,
    timeUtc: fmtUtc(e.timestamp),
    lat: e.centroidLat,
    lon: e.centroidLon,
    areaKm2: e.areaKm2,
  }));

  // ---- AIS summary
  const aisSummary: AisScreeningSummary = {
    totalPings: r.ais.pings,
    uniqueVessels: r.ais.vessels,
    interpolableVessels: r.ais.interpolableVessels,
    vesselsEnteringOriginEnvelope: r.ais.flaggedVessels,
    queryEngine: r.ais.source === 'file' ? 'DuckDB (uploaded AIS)' : 'Synthetic demo AIS',
    searchWindowHours: Number(r.config.HOURS_BACK ?? 24) + 2,
  };

  // ---- suspects (AIS positions carry no vessel names/types)
  const weights = {
    spatial: Number(r.config.W_SPATIAL ?? 0.45),
    temporal: Number(r.config.W_TEMPORAL ?? 0.2),
    course: Number(r.config.W_COURSE ?? 0.2),
    speed: Number(r.config.W_SPEED ?? 0.15),
  };
  const suspects: SuspectVessel[] = r.suspects.map((s) => ({
    rank: s.rank,
    mmsi: s.mmsi,
    vesselName: s.isPlantedDemoCulprit ? `MMSI ${s.mmsi} (demo planted)` : `MMSI ${s.mmsi}`,
    vesselType: r.ais.source === 'file' ? 'Unknown (no AIS static data)' : 'Synthetic demo vessel',
    culpritScorePct: s.culpritScorePct,
    mdoKm: s.mdoKm,
    closestHourBack: s.closestHourBack,
    timeClosestApproach: fmtUtc(s.timeClosestApproach),
    lonClosest: s.lonClosest,
    latClosest: s.latClosest,
    sogKn: s.sogKn,
    cogDeg: s.cogDeg,
    cogVsSlickAxisDeg: s.cogVsSlickAxisDeg,
    hoursInsideEnvelope: s.hoursInsideEnvelope,
    pingGapSec: s.pingGapS,
    manoeuvreFlag: manoeuvre(s.manoeuvreFlag),
    spatialScore: s.sSpatial,
    temporalScore: s.sTemporal,
    courseScore: s.sCourse,
    speedScore: s.sSpeed,
    timeMatchPct: Math.round(s.sTemporal * 100),
    weights,
    track: (r.tracks[s.mmsi] ?? []).map(([lon, lat, iso]) => ({
      hourBack: hourBackOf(iso),
      timeUtc: fmtUtc(iso),
      lon,
      lat,
      sog: s.sogKn,
      cog: s.cogDeg,
    })),
  }));
  const aisVessels: AISVesselTrack[] = suspects.map((s) => ({
    mmsi: s.mmsi,
    name: s.vesselName,
    vesselType: s.vesselType,
    flag: '—',
    isRelevant: s.hoursInsideEnvelope > 0 || s.rank <= 3,
    closestApproachKm: s.mdoKm,
    closestHourBack: s.closestHourBack,
    sogKn: s.sogKn,
    cogDeg: s.cogDeg,
    lastPosition: { lat: s.latClosest, lon: s.lonClosest },
    track: s.track,
  }));

  return {
    particles,
    kdeHistory,
    kdeEnvelopes,
    originDriftTrack,
    // The attribution notebook has no T0 → T+24h forecast: the Forecast tab keeps demo data
    forecastParticles: DEMO_FORECAST_PARTICLES,
    forecastEnvelopes: DEMO_FORECAST_ENVELOPES,
    forecastDriftTrack: DEMO_FORECAST_DRIFT_TRACK,
    aisSummary,
    aisVessels,
    suspects,
    slickGeometry,
    meta: {
      isLive: true,
      t0Utc: fmtUtc(r.t0),
      t0Source: r.t0Source,
      windSource: r.forcing.wind,
      currentSource: r.forcing.current,
      aisSource: r.ais.source,
      keyHourBack: keyHour,
      forcingSeries: r.forcingSeries ?? [],
      videoUrls: {
        backward: attributionVideoUrl('backward', r) ?? undefined,
        forward: attributionVideoUrl('forward', r) ?? undefined,
      },
      warnings: r.warnings,
      disclaimer: r.disclaimer,
    },
  };
}
