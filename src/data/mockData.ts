import {
  DEMO_CASE_METADATA,
  DEMO_SLICK_GEOMETRY,
  DEMO_DETECTION_METRICS,
  DEMO_SAR_CHARACTERISATION,
  DEMO_SIM_CONFIG,
  DEMO_HOURLY_PARTICLES,
  DEMO_KDE_ENVELOPES,
  DEMO_ORIGIN_DRIFT_TRACK,
  DEMO_FORECAST_PARTICLES,
  DEMO_FORECAST_ENVELOPES,
  DEMO_FORECAST_DRIFT_TRACK,
  DEMO_AIS_SUMMARY,
  DEMO_SUSPECTS,
  DEMO_INVESTIGATION_DOSSIER,
} from './demoData';
import { EnvironmentalForcingData, InvestigationCase } from '../types';

export const DEMO_CASE: InvestigationCase = DEMO_CASE_METADATA;

export const OTHER_CASES: InvestigationCase[] = [
  {
    id: 'OS-2019-002',
    satellite: 'Sentinel-1A C-SAR',
    region: 'Strait of Sicily',
    seaName: 'Central Mediterranean',
    acquisitionTime: '2019-10-14 05:42 UTC',
    coordinates: { lat: 36.412, lon: 13.521 },
    status: 'Analysis Complete',
    thumbnailUrl: '/assets/case_sicily.jpg',
    summary: 'Discontinuous ribbon slick identified along major westbound tanker shipping lane.',
  },
];

export const DETECTION_METRICS = DEMO_DETECTION_METRICS;
export const SLICK_GEOMETRY = DEMO_SLICK_GEOMETRY;
export const SAR_CHARACTERISATION = DEMO_SAR_CHARACTERISATION;
export const SIMULATION_CONFIG = DEMO_SIM_CONFIG;
export const HOURLY_PARTICLE_STATES = DEMO_HOURLY_PARTICLES;
export const KDE_ENVELOPES = DEMO_KDE_ENVELOPES;
export const ORIGIN_DRIFT_TRACK = DEMO_ORIGIN_DRIFT_TRACK;
export const FORECAST_ENVELOPES = DEMO_FORECAST_ENVELOPES;
export const FORECAST_DRIFT_TRACK = DEMO_FORECAST_DRIFT_TRACK;
export const FORWARD_FORECAST_STATES = DEMO_FORECAST_PARTICLES;
export const AIS_SUMMARY = DEMO_AIS_SUMMARY;
export const SUSPECT_VESSELS = DEMO_SUSPECTS;
export const INVESTIGATION_DOSSIER = DEMO_INVESTIGATION_DOSSIER;
export const PROBABLE_ORIGIN_REGION = DEMO_INVESTIGATION_DOSSIER.probableOriginRegion;

export const ENVIRONMENTAL_DATA: EnvironmentalForcingData = {
  timestampUtc: '2019-10-25 13:53 UTC',
  windSpeedKn: 8.2,
  windDirectionDeg: 215,
  currentSpeedKn: 0.45,
  currentDirectionDeg: 42,
  waveHeightM: 0.8,
  windSource: 'ERA5 Reanalysis (0.25°)',
  currentSource: 'CMEMS Mediterranean Analysis (0.04°)',
  seaSurfaceTempC: 24.8,
};
