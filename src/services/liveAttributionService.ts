// src/services/liveAttributionService.ts
// Runs the reverse-hindcast + AIS attribution model on the backend, using the
// slick polygon produced by the detection model as input.
import { useSyncExternalStore } from 'react';
import { isDetectionLive } from './detectionApi';
import { getLiveDetection } from './detectionService';

// Attribution can run on its own server (VITE_ATTRIBUTION_API_URL); falls back to the detection server
const BASE = (
  (import.meta.env.VITE_ATTRIBUTION_API_URL as string | undefined) ||
  (import.meta.env.VITE_DETECTION_API_URL as string | undefined)
)?.replace(/\/$/, '');

// ----------------------------------------------------------------------------- types
export interface AttributionSuspect {
  rank: number;
  mmsi: string;
  mdoKm: number;
  closestHourBack: number;
  timeClosestApproach: string;
  lonClosest: number;
  latClosest: number;
  sogKn: number;
  cogDeg: number;
  cogVsSlickAxisDeg: number;
  hoursInsideEnvelope: number;
  pingGapS: number;
  manoeuvreFlag: string;
  sSpatial: number;
  sTemporal: number;
  sCourse: number;
  sSpeed: number;
  culpritScorePct: number;
  isPlantedDemoCulprit: boolean;
}

export interface AttributionEnvelope {
  hourBack: number;
  timestamp: string;
  centroidLon: number;
  centroidLat: number;
  areaKm2: number;
  method: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface AttributionResult {
  t0: string;
  t0Source: string | null;
  config: Record<string, number | string>;
  slick: {
    t0: string;
    centroidLon: number;
    centroidLat: number;
    nParts: number;
    areaKm2: number;
    perimeterKm: number;
    pcaAxisBearingDeg: number;
    pcaElongationRatio: number;
    mrrLengthKm: number;
    mrrWidthKm: number;
    mrrBearingDeg: number;
    geojson: GeoJSON.MultiPolygon;
  };
  forcing: {
    wind: string; // 'ERA5' | 'SYNTHETIC_wind'
    current: string; // 'CMEMS:<dataset>' | 'SYNTHETIC_current'
    window: { start: string; end: string };
    bbox: { lat_min: number; lat_max: number; lon_min: number; lon_max: number };
  };
  particles: { hourBack: number; timestamp: string; positions: [number, number][] }[];
  envelopes: AttributionEnvelope[];
  driftTrack: [number, number][]; // [lon, lat] per hour back
  forcingSeries: { hourBack: number; windU: number; windV: number; currentU: number; currentV: number }[];
  ais: {
    source: 'file' | 'DEMO_SYNTHETIC';
    pings: number;
    vessels: number;
    interpolableVessels: number;
    flaggedVessels: number;
    window: { start: string; end: string };
  };
  suspects: AttributionSuspect[];
  allSuspectsCount: number;
  tracks: Record<string, [number, number, string][]>; // mmsi -> [lon, lat, isoTime][]
  /** Simulation videos (notebook Cell 12): relative server paths */
  videos: { backward?: string; forward?: string };
  videoUrls: { backward?: string; forward?: string };
  warnings: string[];
  disclaimer: string;
}

interface JobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  stageIndex: number;
  totalStages: number;
  stage: string;
  stages: string[];
  result?: AttributionResult;
  error?: string;
}

// ----------------------------------------------------------------------------- store
let liveAttribution: AttributionResult | null = null;
let liveAttributionError: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useLiveAttribution = () => useSyncExternalStore(subscribe, () => liveAttribution);
export const useLiveAttributionError = () => useSyncExternalStore(subscribe, () => liveAttributionError);
export const getLiveAttribution = () => liveAttribution;

// ----------------------------------------------------------------------------- run
export interface RunAttributionOptions {
  /** Called with 1..7 as the backend moves through the stages (1–6 match the UI checklist; 7 = rendering videos). */
  onStage?: (stageIndex: number, totalStages: number, stageName: string) => void;
  /** Override the capture time (UTC ISO). Defaults to the time read from the GeoTIFF. */
  t0?: string;
  /** Optional AIS file (.parquet / .csv with mmsi,timestamp,latitude,longitude,sog,cog). */
  aisFile?: File;
  hoursBack?: number;
  /** Simulation videos to render: 'both' (default) | 'forward' | 'backward' | 'none' */
  videos?: 'both' | 'forward' | 'backward' | 'none';
  pollMs?: number;
  timeoutMs?: number;
}

/**
 * Starts the attribution job with the slick from the last live detection and
 * resolves with the result. Returns null (demo mode) when no live detection exists.
 */
export async function runAttribution(opts: RunAttributionOptions = {}): Promise<AttributionResult | null> {
  const detection = getLiveDetection();
  if (!isDetectionLive() || !BASE || !detection) return null;
  if (!detection.geometry.detected) {
    liveAttributionError = 'No slick was detected — nothing to hindcast.';
    liveAttribution = null;
    emit();
    return null;
  }

  const { onStage, aisFile, hoursBack, videos, pollMs = 2000, timeoutMs = 15 * 60_000 } = opts;
  const t0 = opts.t0 ?? detection.scene.captureTime ?? undefined;

  try {
    const fd = new FormData();
    fd.append('slick', JSON.stringify(detection.geometry.geojson));
    if (t0) fd.append('t0', t0);
    if (hoursBack) fd.append('hoursBack', String(hoursBack));
    if (aisFile) fd.append('ais', aisFile);
    if (videos) fd.append('videos', videos);

    const startRes = await fetch(`${BASE}/api/attribution`, { method: 'POST', body: fd });
    if (!startRes.ok) throw new Error((await startRes.json().catch(() => ({}))).detail ?? `HTTP ${startRes.status}`);
    const { jobId } = (await startRes.json()) as { jobId: string };

    const started = Date.now();
    let lastStage = -1;
    for (;;) {
      await new Promise((r) => setTimeout(r, pollMs));
      const res = await fetch(`${BASE}/api/attribution/${jobId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `HTTP ${res.status}`);
      const job = (await res.json()) as JobStatus;

      if (job.stageIndex !== lastStage && job.stageIndex > 0) {
        lastStage = job.stageIndex;
        onStage?.(job.stageIndex, job.totalStages, job.stage);
      }
      if (job.status === 'done' && job.result) {
        console.log('[Attribution] live result', job.result);
        liveAttribution = job.result;
        liveAttributionError = null;
        emit();
        return job.result;
      }
      if (job.status === 'error') throw new Error(job.error ?? 'Attribution failed');
      if (Date.now() - started > timeoutMs) throw new Error('Attribution timed out');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Attribution] failed — falling back to demo data:', msg);
    liveAttribution = null;
    liveAttributionError = msg;
    emit();
    return null;
  }
}

export function clearAttribution() {
  liveAttribution = null;
  liveAttributionError = null;
  emit();
}

/** Absolute URL for a simulation video, usable directly in <video src={...}>. */
export function attributionVideoUrl(kind: 'backward' | 'forward', result = liveAttribution): string | null {
  const rel = result?.videoUrls?.[kind];
  return rel && BASE ? `${BASE}${rel}` : null;
}
