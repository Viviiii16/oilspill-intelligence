export type InvestigationStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ProcessingState =
  | 'idle'
  | 'uploading'
  | 'analysing-image'
  | 'image-complete'
  | 'analysing-slick'
  | 'investigation-ready';

export type AppRoute = 'landing' | 'detection' | 'investigation' | 'report';

export type SARPreviewMode = 'sar' | 'mask' | 'overlay';

export type KDEHistoryMode = 'current' | 'previous' | 'all';

export type AISTrafficFilter = 'relevant' | 'all';

export interface InvestigationStep {
  id: InvestigationStepId;
  code: 'detection' | 'characterisation' | 'hindcast' | 'origin' | 'ais' | 'attribution' | 'report';
  label: string;
  title: string;
  subtitle: string;
  statusBadge: string;
}

export interface InvestigationCase {
  id: string;
  satellite: string;
  region: string;
  seaName: string;
  acquisitionTime: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  status: 'Analysis Complete' | 'Under Review' | 'Processing';
  thumbnailUrl: string;
  summary: string;
}

export interface EpochMetric {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  realOilIoU: number;
  precision: number;
  recall: number;
  f1: number;
  lookalikeFpr: number;
}

export interface DetectionModelMetrics {
  modelName: string;
  encoder: string;
  encoderWeights: string;
  inputChannels: string[];
  preprocessing: string[];
  lossFunction: string;
  lossParameters: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  optimizer: string;
  learningRate: number;
  weightDecay: number;
  epochs: number;
  scheduler: string;
  bestRealOilIoU: number;
  finalRealOilIoU: number;
  finalF1: number;
  finalRecall: number;
  finalPrecision: number;
  finalLookalikeFpr: number;
  validationHistory: EpochMetric[];
}

export interface SlickGeometry {
  t0Utc: string;
  centroid: {
    lon: number;
    lat: number;
  };
  numParts: number;
  areaKm2: number;
  perimeterKm: number;
  lengthKm: number;
  widthKm: number;
  pcaAxisBearingDeg: number;
  pcaElongationRatio: number;
  mrrLengthKm: number;
  mrrWidthKm: number;
  mrrBearingDeg: number;
  localCrs: string;
  wgs84Bounds: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  };
  sarFootprintBounds: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  };
  coordinates: [number, number][][];
}

export interface SarPhysicalCharacterisation {
  seaMeanDb: number;
  seaStdDb: number;
  slickCoreMeanDb: number;
  slickCoreStdDb: number;
  dampingDeltaSigma0Db: number;
  oilPixels: number;
  oilSurfacePct: number;
  dampingRatioVV: number;
  classifiedSubstance: string;
  confidenceNote: string;
}

export interface SimulationConfig {
  hindcastHorizonHours: number;
  timeStepSec: number;
  direction: 'BACKWARD' | 'FORWARD';
  particleCount: number;
  windLeeway: number;
  horizontalDiffusivity: number;
  kdeConfidence: number;
  kdeBandwidth: string;
  kdeGrid: number;
  randomSeed: number;
  environmentalForcing: {
    windSource: string;
    currentSource: string;
  };
}

export interface ParticlePoint {
  id: number;
  lon: number;
  lat: number;
  depth?: number;
}

export interface HourlyParticleState {
  hourBack: number;
  timeUtc: string;
  particles: ParticlePoint[];
}

export interface KDETimeStep {
  timeOffsetHours: number;
  timeUtc: string;
  particles: ParticlePoint[];
  densityGrid: {
    bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    rows: number;
    cols: number;
    values: number[][]; // normalized 0..1
  };
  contour95: [number, number][]; // [lon, lat][]
  centroid: {
    lat: number;
    lon: number;
  };
  densityPeak: {
    lat: number;
    lon: number;
  };
  envelopeAreaKm2: number;
  relativePeakDensity: number;
  isKeyInterception?: boolean;
}

export interface ForwardForecastState {
  hourAhead: number;
  timeUtc: string;
  particles: ParticlePoint[];
  centroid: [number, number]; // [lon, lat]
  areaKm2: number;
  evaporatedPct: number;
  dispersedPct: number;
  surfaceRemainingPct: number;
}

export interface ForecastEnvelope {
  hourAhead: number;
  timeUtc: string;
  areaKm2: number;
  centroid: [number, number];
  polygon: [number, number][];
  isKeyHour: boolean;
}

export interface KdeEnvelope {
  hourBack: number;
  timeUtc: string;
  areaKm2: number;
  centroid: [number, number]; // [lon, lat]
  polygon: [number, number][]; // [[lon, lat], ...]
  isKeyHour: boolean;
}

export interface EnvironmentalForcingData {
  timestampUtc: string;
  windSpeedKn: number;
  windDirectionDeg: number;
  currentSpeedKn: number;
  currentDirectionDeg: number;
  waveHeightM?: number;
  waveDirectionDeg?: number;
  windSource: string;
  currentSource: string;
  seaSurfaceTempC?: number;
}

export interface AisScreeningSummary {
  totalPings: number;
  uniqueVessels: number;
  interpolableVessels: number;
  vesselsEnteringOriginEnvelope: number;
  queryEngine: string;
  searchWindowHours: number;
}

export type ManoeuvreType = 'cruising' | 'loitering' | 'speed_deviation' | 'course_turn';

export interface AISVesselTrack {
  mmsi: string;
  name: string;
  vesselType: string;
  flag: string;
  isRelevant: boolean;
  closestApproachKm: number;
  closestHourBack: number;
  sogKn: number;
  cogDeg: number;
  lastPosition: { lat: number; lon: number };
  track: {
    hourBack: number;
    timeUtc: string;
    lon: number;
    lat: number;
    sog: number;
    cog: number;
  }[];
}

export interface SuspectVessel {
  rank: number;
  mmsi: string;
  vesselName: string;
  vesselType: string;
  culpritScorePct: number;
  mdoKm: number;
  closestHourBack: number;
  timeClosestApproach: string;
  lonClosest: number;
  latClosest: number;
  sogKn: number;
  cogDeg: number;
  cogVsSlickAxisDeg: number;
  hoursInsideEnvelope: number;
  pingGapSec: number;
  manoeuvreFlag: ManoeuvreType;
  spatialScore: number;
  temporalScore: number;
  courseScore: number;
  speedScore: number;
  timeMatchPct: number;
  weights: {
    spatial: number;
    temporal: number;
    course: number;
    speed: number;
  };
  track: {
    hourBack: number;
    timeUtc: string;
    lon: number;
    lat: number;
    sog: number;
    cog: number;
  }[];
}

export interface OilSpillDetectionResult {
  caseId: string;
  mask: string;
  areaKm2: number;
  perimeterKm: number;
  lengthKm: number;
  widthKm: number;
  elongationRatio: number;
  centroid: {
    lat: number;
    lon: number;
  };
  captureTime: string;
  satellite: string;
  estimatedType: string;
  confidencePct: number;
  geometry: SlickGeometry;
  sarCharacterisation: SarPhysicalCharacterisation;
  detectionMetrics: DetectionModelMetrics;
}

/** Hourly wind / current sampled along the reconstructed drift track (m/s). */
export interface ForcingSample {
  hourBack: number;
  windU: number;
  windV: number;
  currentU: number;
  currentV: number;
}

/** Provenance of a live (model-server) attribution run. Absent in demo mode. */
export interface AttributionMeta {
  isLive: boolean;
  t0Utc: string;
  t0Source: string | null;
  windSource: string; // 'ERA5' | 'SYNTHETIC_wind'
  currentSource: string; // 'CMEMS:<dataset>' | 'SYNTHETIC_current'
  aisSource: 'file' | 'DEMO_SYNTHETIC';
  keyHourBack: number; // hour of closest approach of the rank-1 vessel
  forcingSeries: ForcingSample[];
  videoUrls: { backward?: string; forward?: string };
  warnings: string[];
  disclaimer: string;
}

export interface AttributionResult {
  particles: HourlyParticleState[];
  kdeHistory: KDETimeStep[];
  kdeEnvelopes: KdeEnvelope[];
  originDriftTrack: {
    hourBack: number;
    timeUtc: string;
    lat: number;
    lon: number;
    areaKm2: number;
  }[];
  forecastParticles: ForwardForecastState[];
  forecastEnvelopes: ForecastEnvelope[];
  forecastDriftTrack: {
    hourAhead: number;
    timeUtc: string;
    lat: number;
    lon: number;
    areaKm2: number;
  }[];
  aisSummary: AisScreeningSummary;
  aisVessels: AISVesselTrack[];
  suspects: SuspectVessel[];
  /** Live runs only: slick geometry recomputed by the attribution model */
  slickGeometry?: SlickGeometry;
  /** Live runs only: data provenance, warnings, videos */
  meta?: AttributionMeta;
}

export interface LayerVisibility {
  // OBSERVATION
  sarImage: boolean;
  slickPolygon: boolean;
  centroid: boolean;
  // RECONSTRUCTION
  particles: boolean;
  kdeDensity: boolean;
  kdeEnvelopes: boolean;
  kdeCentroids: boolean;
  originDriftTrack: boolean;
  // FORECAST
  forecastParticles: boolean;
  forecastKde: boolean;
  forecastEnvelopes: boolean;
  forecastDriftTrack: boolean;
  // VESSEL TRAFFIC
  aisTraffic: boolean;
  suspectTracks: boolean;
  closestApproachLine: boolean;
}

export interface InvestigationDossier {
  caseId: string;
  caseMetadata: InvestigationCase;
  geometry: SlickGeometry;
  detectionMetrics: DetectionModelMetrics;
  sarCharacterisation: SarPhysicalCharacterisation;
  simulationConfig: SimulationConfig;
  aisSummary: AisScreeningSummary;
  topSuspects: SuspectVessel[];
  kdeEnvelopes: KdeEnvelope[];
  kdeHistory: KDETimeStep[];
  probableOriginRegion: {
    lon: number;
    lat: number;
    timeOffset: string;
    confidenceKde: string;
    areaKm2: number;
    description: string;
  };
}
