import {
  AttributionResult,
  SlickGeometry,
  SimulationConfig,
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

export interface AttributionProgressCallback {
  (stepName: string, stepIndex: number, totalSteps: number, isComplete: boolean): void;
}

/**
 * Service to execute Reverse-Lagrangian Spill Attribution Pipeline.
 * Currently uses deterministic synthetic data.
 * Ready for future backend integration via POST /api/attribution.
 */
export async function analyseSlick(
  geometry: SlickGeometry,
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

  // In future production:
  // const response = await fetch('/api/attribution', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ geometry, config }),
  // });
  // return await response.json();

  // Simulated progressive execution (4.8 seconds total)
  for (let i = 0; i < steps.length; i++) {
    if (onProgress) {
      onProgress(steps[i], i + 1, steps.length, false);
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  if (onProgress) {
    onProgress('Attribution Ready', steps.length, steps.length, true);
  }

  return {
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
}
