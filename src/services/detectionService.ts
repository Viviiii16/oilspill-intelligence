import { useSyncExternalStore } from 'react';
import {
  OilSpillDetectionResult,
} from '../types';
import { DEMO_DETECTION_RESULT } from '../data/demoData';
import { detectionApi, isDetectionLive, DetectionResult } from './detectionApi';

export interface DetectionProgressCallback {
  (stepName: string, stepIndex: number, totalSteps: number, isComplete: boolean): void;
}

// -----------------------------------------------------------------------------
// Live result store — holds the latest output of the Colab DeepLabV3+ model
// (real slick polygons, area, centroid, SAR/mask images). Pages read it with
// useLiveDetection(). null = demo mode (Colab not configured / not run yet).
// -----------------------------------------------------------------------------
let liveDetection: DetectionResult | null = null;
let liveDetectionError: string | null = null;
const listeners = new Set<() => void>();

const setLive = (result: DetectionResult | null, error: string | null = null) => {
  liveDetection = result;
  liveDetectionError = error;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useLiveDetection = () => useSyncExternalStore(subscribe, () => liveDetection);
export const useLiveDetectionError = () => useSyncExternalStore(subscribe, () => liveDetectionError);
export const getLiveDetection = () => liveDetection;

/**
 * Service to execute SAR Oil Spill Segmentation.
 * - VITE_DETECTION_API_URL set + a file uploaded → runs the real model on Colab.
 * - Otherwise → deterministic demo data (unchanged behaviour).
 */
export async function detectOilSpill(
  file?: File,
  onProgress?: DetectionProgressCallback
): Promise<OilSpillDetectionResult> {
  const steps = [
    'Reading GeoTIFF',
    'Preparing VV / VH channels',
    'Running oil-slick segmentation',
    'Extracting slick geometry',
  ];

  // ---------------------------------------------------------------- LIVE MODEL
  if (isDetectionLive() && file) {
    onProgress?.(steps[0], 1, steps.length, false);
    try {
      // Advance the progress steps while the model runs on the GPU
      let i = 1;
      const ticker = setInterval(() => {
        if (i < steps.length - 1) {
          i++;
          onProgress?.(steps[i - 1], i, steps.length, false);
        }
      }, 1500);

      const result = await detectionApi.detectUpload(file, 'UPLOAD');
      clearInterval(ticker);

      onProgress?.(steps[3], steps.length, steps.length, false);
      console.log('[Detection] live result from Colab model', result);
      setLive(result);
      onProgress?.('Detection Complete', steps.length, steps.length, true);

      // Rest of the app (hindcast, AIS, attribution) still runs on demo data
      return { ...DEMO_DETECTION_RESULT };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Detection] Colab model call failed — falling back to demo data:', msg);
      setLive(null, msg);
      // fall through to demo mode below
    }
  } else if (isDetectionLive() && !file) {
    console.warn('[Detection] VITE_DETECTION_API_URL is set but no file was passed to detectOilSpill()');
  }

  // ----------------------------------------------------------------- DEMO MODE
  if (!liveDetectionError) setLive(null);

  // Simulated progressive execution (2.4 seconds total)
  for (let i = 0; i < steps.length; i++) {
    onProgress?.(steps[i], i + 1, steps.length, false);
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  onProgress?.('Detection Complete', steps.length, steps.length, true);

  return {
    ...DEMO_DETECTION_RESULT,
    captureTime: DEMO_DETECTION_RESULT.captureTime,
  };
}