// src/services/detectionApi.ts
// Client for the detection backend (Hugging Face Space).
// Only the Detection step calls it; every other step keeps using demo data.

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
    georefSource?: 'file' | 'SYNTHETIC_ASSUMED';
    captureTime?: string | null; // UTC ISO parsed from GeoTIFF tags / filename
    captureTimeSource?: string | null;
  };
  metrics: DetectionMetrics;
  geometry: DetectedGeometry;
  inference: { meanConfidence: number; maxConfidence: number; device: string; runtimeSec: number };
  /** Sanity check of the uploaded raster (is it calibrated SAR in dB?) */
  input?: {
    bands: number;
    dtype: string;
    p1?: number;
    median?: number;
    p99?: number;
    uniqueValues?: number;
    warnings: string[];
  };
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

export interface HealthResponse {
  status: 'ok' | 'error';
  device: string;
  modelLoaded: boolean;
  error: string | null;
  cases: string[];
}

/**
 * Free Hugging Face Spaces sleep after ~48 h idle; the first request wakes them
 * (can take ~1–2 min). Poll /api/health until the model is loaded.
 */
async function waitUntilReady(maxMs = 180_000, onWaiting?: (secs: number) => void): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(`${BASE}/api/health`, { cache: 'no-store' });
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.includes('application/json')) {
        const h = (await res.json()) as HealthResponse;
        if (h.modelLoaded) return;
        if (h.error) throw new Error(`Model server error: ${h.error}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Model server error')) throw e;
      // network error / waking up — keep polling
    }
    const waited = Math.round((Date.now() - start) / 1000);
    if (Date.now() - start > maxMs) throw new Error(`Model server did not wake up within ${waited}s`);
    onWaiting?.(waited);
    await new Promise((r) => setTimeout(r, 4000));
  }
}

export const detectionApi = {
  health: () => call<HealthResponse>('/api/health'),
  waitUntilReady,

  /** Run detection on the scene mapped to this case in the Colab notebook (CASE_SCENES). */
  detectCase: (caseId: string) =>
    call<DetectionResult>('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    }),

  /** Run detection on a user-supplied Sentinel-1 GeoTIFF (dB) or .npy patch. */
  /**
   * Upload a scene and wait for the result. Runs as a background job on the server and
   * polls, so long CPU inference never hits the browser's request timeout (Safari ≈ 60 s).
   */
  detectUpload: async (
    file: File,
    caseId = 'ADHOC',
    onWaiting?: (elapsedSec: number) => void,
    timeoutMs = 15 * 60_000
  ): Promise<DetectionResult> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('caseId', caseId);

    const start = await fetch(`${BASE}/api/detect/jobs`, { method: 'POST', body: fd });
    if (start.status === 404) {
      // older backend without job support → single long request
      const fd2 = new FormData();
      fd2.append('file', file);
      fd2.append('caseId', caseId);
      return call<DetectionResult>('/api/detect/upload', { method: 'POST', body: fd2 });
    }
    if (!start.ok) {
      const body = await start.json().catch(() => ({}));
      throw new Error(body.detail ?? `Detection API ${start.status}`);
    }
    const { jobId } = (await start.json()) as { jobId: string };

    const t0 = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, 1500));
      const job = await call<{ status: string; elapsedSec: number; result?: DetectionResult; error?: string }>(
        `/api/detect/jobs/${jobId}`,
        { cache: 'no-store' }
      );
      if (job.status === 'done' && job.result) return job.result;
      if (job.status === 'error') throw new Error(job.error ?? 'Detection failed on the server');
      onWaiting?.(job.elapsedSec);
      if (Date.now() - t0 > timeoutMs) throw new Error('Detection timed out');
    }
  },
};