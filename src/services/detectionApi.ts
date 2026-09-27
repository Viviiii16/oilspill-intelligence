// src/services/detectionApi.ts
// Client for the Colab detection backend (oilspill_detection_api.ipynb).
// Only the Detection step talks to Colab; every other step keeps using mock data.

const BASE = (import.meta.env.VITE_DETECTION_API_URL as string | undefined)?.replace(/\/$/, '');

export const isDetectionLive = (): boolean => Boolean(BASE);

export interface DetectionMetrics {
  architecture: string;
  encoder: string;
  inputChannels: string[];
  loss: string;
  epochs: number;
  realOilIoU: number;
  f1: number;
  recall: number;
  precision: number;
  lookalikeFPR: number;
  threshold: number;
}

export interface DetectedGeometry {
  detected: boolean;
  georeferenced?: boolean;
  areaKm2: number;
  perimeterKm?: number;
  parts: number;
  pixelCount: number;
  centroid?: { lon: number; lat: number } | null;
  bbox?: [number, number, number, number] | null; // [minLon, minLat, maxLon, maxLat]
  mrrLengthKm?: number;
  mrrWidthKm?: number;
  elongation?: number | null;
  pcaAxisDeg?: number;
  geojson: GeoJSON.FeatureCollection;
}

export interface DetectionResult {
  caseId: string;
  runId: string;
  scene: {
    name: string;
    width: number;
    height: number;
    crs: string | null;
    leafletBounds: [[number, number], [number, number]] | null; // for L.imageOverlay
  };
  metrics: DetectionMetrics;
  geometry: DetectedGeometry;
  inference: { meanConfidence: number; maxConfidence: number; device: string; runtimeSec: number };
  images: { sarPng: string; maskPng: string; probabilityPng: string }; // data: URLs
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error('VITE_DETECTION_API_URL is not set');
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Detection API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const detectionApi = {
  health: () => call<{ status: string; device: string; cases: string[] }>('/api/health'),

  /** Run detection on the scene mapped to this case in the Colab notebook (CASE_SCENES). */
  detectCase: (caseId: string) =>
    call<DetectionResult>('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    }),

  /** Run detection on a user-supplied Sentinel-1 GeoTIFF (dB) or .npy patch. */
  detectUpload: (file: File, caseId = 'ADHOC') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caseId', caseId);
    return call<DetectionResult>('/api/detect/upload', { method: 'POST', body: fd });
  },
};