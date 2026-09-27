import {
  InvestigationCase,
  SlickGeometry,
  SarPhysicalCharacterisation,
  DetectionModelMetrics,
  SimulationConfig,
  KDETimeStep,
  HourlyParticleState,
  KdeEnvelope,
  ForwardForecastState,
  ForecastEnvelope,
  AisScreeningSummary,
  AISVesselTrack,
  SuspectVessel,
  InvestigationDossier,
  OilSpillDetectionResult,
} from '../types';

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_CASE_ID = 'OS-2019-001';

export const DEMO_CASE_METADATA: InvestigationCase = {
  id: DEMO_CASE_ID,
  satellite: 'Sentinel-1B C-SAR',
  region: 'Ionian Sea, Eastern Mediterranean',
  seaName: 'Ionian Sea',
  acquisitionTime: '2019-10-26 05:53 UTC',
  coordinates: {
    lat: 38.0649,
    lon: 18.2066,
  },
  status: 'Analysis Complete',
  thumbnailUrl: '/assets/sar_thumb_ionian.jpg',
  summary:
    'Major elongated radar-dark anomaly identified across Sentinel-1 IW pass in international shipping lane. Wind conditions 4.2 m/s; confirmed biogenic look-alike probability 7.63%. Multi-part slick spanning 17.73 km² with PCA axis aligned 40.8° NE.',
};

// Organic irregular oil slick polygon at T0 (elongated 11.45 km × 2.47 km along 40.8° PCA axis)
export const DEMO_SLICK_GEOMETRY: SlickGeometry = {
  t0Utc: '2019-10-26 05:53 UTC',
  centroid: {
    lon: 18.2066,
    lat: 38.0649,
  },
  numParts: 2,
  areaKm2: 17.7306,
  perimeterKm: 44.3421,
  lengthKm: 11.4553,
  widthKm: 2.4701,
  pcaAxisBearingDeg: 40.806,
  pcaElongationRatio: 4.6274,
  mrrLengthKm: 11.4553,
  mrrWidthKm: 2.4701,
  mrrBearingDeg: 40.5458,
  localCrs: 'EPSG:32634',
  wgs84Bounds: {
    minLon: 18.1638,
    maxLon: 18.2586,
    minLat: 38.0216,
    maxLat: 38.1072,
  },
  sarFootprintBounds: {
    minLon: 18.05,
    maxLon: 18.45,
    minLat: 37.85,
    maxLat: 38.25,
  },
  coordinates: [
    // Main Part 1 (Elongated polygon oriented along 40.8°)
    [
      [18.1682, 38.0245],
      [18.1745, 38.0312],
      [18.1882, 38.0468],
      [18.2015, 38.061],
      [18.2198, 38.0815],
      [18.2384, 38.1012],
      [18.2465, 38.1068],
      [18.2512, 38.1025],
      [18.2415, 38.0892],
      [18.2251, 38.0694],
      [18.2084, 38.051],
      [18.1921, 38.0354],
      [18.1784, 38.0228],
      [18.1682, 38.0245],
    ],
    // Part 2 (Smaller detached patch trailing southwest)
    [
      [18.1638, 38.0216],
      [18.1672, 38.0252],
      [18.171, 38.0238],
      [18.1685, 38.0202],
      [18.1638, 38.0216],
    ],
  ],
};

export const DEMO_SAR_CHARACTERISATION: SarPhysicalCharacterisation = {
  seaMeanDb: -18.4,
  seaStdDb: 1.2,
  slickCoreMeanDb: -27.1,
  slickCoreStdDb: 1.8,
  dampingDeltaSigma0Db: 8.7,
  oilPixels: 177306,
  oilSurfacePct: 4.12,
  dampingRatioVV: 8.7,
  classifiedSubstance: 'Heavy Crude / Bunker-C Sludge',
  confidenceNote:
    'Model-derived inference based on VV backscatter damping (Δσ⁰ = 8.7 dB) under moderate 4.2 m/s surface winds. This represents an empirical physical inference from radar wave suppression and should not be interpreted as chemical laboratory spectroscopy.',
};

export const DEMO_DETECTION_METRICS: DetectionModelMetrics = {
  modelName: 'DeepLabV3+',
  encoder: 'ResNet-50',
  encoderWeights: 'ImageNet Pretrained',
  inputChannels: [
    'Channel 1: VV Polarisation',
    'Channel 2: VH Polarisation',
    'Channel 3: Δ Polarisation (VV - VH)',
  ],
  preprocessing: [
    'Refined Lee Speckle Filtering (7x7 window)',
    'dB normalization: recalibrated [-35 dB, 0 dB]',
    'Min-Max scaling to [0, 1] tensor range',
  ],
  lossFunction: 'Focal Tversky Loss',
  lossParameters: {
    alpha: 0.3,
    beta: 0.7,
    gamma: 1.33,
  },
  optimizer: 'AdamW',
  learningRate: 1.5e-4,
  weightDecay: 1e-3,
  epochs: 30,
  scheduler: 'Cosine Annealing LR (T_max=30, eta_min=1e-6)',
  bestRealOilIoU: 62.58,
  finalRealOilIoU: 62.58,
  finalF1: 79.81,
  finalRecall: 86.2,
  finalPrecision: 74.31,
  finalLookalikeFpr: 7.63,
  validationHistory: [
    { epoch: 1, trainLoss: 0.684, valLoss: 0.612, realOilIoU: 24.12, precision: 45.2, recall: 51.4, f1: 48.09, lookalikeFpr: 28.4 },
    { epoch: 2, trainLoss: 0.542, valLoss: 0.498, realOilIoU: 32.84, precision: 52.8, recall: 60.1, f1: 56.22, lookalikeFpr: 22.1 },
    { epoch: 3, trainLoss: 0.461, valLoss: 0.421, realOilIoU: 39.4, precision: 58.4, recall: 66.8, f1: 62.32, lookalikeFpr: 18.5 },
    { epoch: 5, trainLoss: 0.382, valLoss: 0.354, realOilIoU: 46.15, precision: 63.9, recall: 72.3, f1: 67.84, lookalikeFpr: 15.2 },
    { epoch: 8, trainLoss: 0.312, valLoss: 0.298, realOilIoU: 51.7, precision: 67.5, recall: 76.9, f1: 71.89, lookalikeFpr: 12.8 },
    { epoch: 12, trainLoss: 0.254, valLoss: 0.245, realOilIoU: 55.8, precision: 70.1, recall: 80.4, f1: 74.89, lookalikeFpr: 10.9 },
    { epoch: 16, trainLoss: 0.218, valLoss: 0.211, realOilIoU: 58.62, precision: 72.0, recall: 82.7, f1: 76.98, lookalikeFpr: 9.6 },
    { epoch: 20, trainLoss: 0.189, valLoss: 0.192, realOilIoU: 60.34, precision: 73.2, recall: 84.1, f1: 78.27, lookalikeFpr: 8.8 },
    { epoch: 24, trainLoss: 0.168, valLoss: 0.18, realOilIoU: 61.7, precision: 73.8, recall: 85.3, f1: 79.16, lookalikeFpr: 8.1 },
    { epoch: 27, trainLoss: 0.155, valLoss: 0.174, realOilIoU: 62.25, precision: 74.1, recall: 85.9, f1: 79.58, lookalikeFpr: 7.8 },
    { epoch: 30, trainLoss: 0.149, valLoss: 0.171, realOilIoU: 62.58, precision: 74.31, recall: 86.2, f1: 79.81, lookalikeFpr: 7.63 },
  ],
};

export const DEMO_SIM_CONFIG: SimulationConfig = {
  hindcastHorizonHours: 24,
  timeStepSec: 600,
  direction: 'BACKWARD',
  particleCount: 1750,
  windLeeway: 0.03,
  horizontalDiffusivity: 1.0,
  kdeConfidence: 0.95,
  kdeBandwidth: 'Silverman',
  kdeGrid: 220,
  randomSeed: 42,
  environmentalForcing: {
    windSource: 'ECMWF ERA5 Reanalysis (0.25° Hourly)',
    currentSource: 'Copernicus Marine Service (CMEMS 1/12° Hourly Phys)',
  },
};

// Hindcast timesteps definitions (Every 2-Hour Time Gap)
interface TimestepDef {
  hourBack: number;
  timeUtc: string;
  centroid: { lat: number; lon: number };
  spreadLat: number;
  spreadLon: number;
  areaKm2: number;
  densityPeak: { lat: number; lon: number };
  relativePeak: number;
  isKeyInterception?: boolean;
  contour: [number, number][];
}

function generateHourlyHindcastSteps(): TimestepDef[] {
  const steps: TimestepDef[] = [];
  const baseOffsets: [number, number][] = [
    [-0.038, -0.040],
    [-0.025, -0.024],
    [-0.002, 0.001],
    [0.026, 0.032],
    [0.043, 0.042],
    [0.036, 0.020],
    [0.012, -0.010],
    [-0.017, -0.033],
    [-0.038, -0.040],
  ];

  // Strictly 2-hour time gap intervals: 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
  const TWO_HOUR_GAPS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  for (const h of TWO_HOUR_GAPS) {
    // Exact interpolation through T-16h intercept with suspect vessel
    let centerLon: number;
    let centerLat: number;
    let areaKm2: number;

    if (h <= 16) {
      const w = h / 16;
      centerLon = parseFloat((18.2066 + (18.045 - 18.2066) * w).toFixed(5));
      centerLat = parseFloat((38.0649 + (37.918 - 38.0649) * w).toFixed(5));
      areaKm2 = parseFloat((17.73 + (58.24 - 17.73) * w).toFixed(2));
    } else {
      const w = (h - 16) / 8;
      centerLon = parseFloat((18.045 + (17.952 - 18.045) * w).toFixed(5));
      centerLat = parseFloat((37.918 + (37.834 - 37.918) * w).toFixed(5));
      areaKm2 = parseFloat((58.24 + (92.60 - 58.24) * w).toFixed(2));
    }

    // Steady, gradual hydrodynamic diffusion scale increasing smoothly with elapsed time
    const diffusionScale = 1.0 + (h / 24) * 1.25;
    const date = new Date(Date.UTC(2019, 9, 26, 5, 53) - h * 3600 * 1000);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const timeUtc = `${y}-${m}-${d} ${hh}:${mm} UTC`;

    const spreadLat = 0.038 + 0.05 * (h / 24);
    const spreadLon = 0.042 + 0.053 * (h / 24);

    const contour: [number, number][] = baseOffsets.map(([du, dv]) => [
      parseFloat((centerLon + du * diffusionScale).toFixed(5)),
      parseFloat((centerLat + dv * diffusionScale).toFixed(5)),
    ]);

    steps.push({
      hourBack: h,
      timeUtc,
      centroid: { lat: centerLat, lon: centerLon },
      spreadLat,
      spreadLon,
      areaKm2,
      densityPeak: { lat: centerLat, lon: centerLon },
      relativePeak: parseFloat((1.0 - 0.2 * (h / 24)).toFixed(2)),
      isKeyInterception: h === 16,
      contour,
    });
  }
  return steps;
}

const HINDCAST_STEPS: TimestepDef[] = generateHourlyHindcastSteps();

// Point-in-polygon helper for exact mask containment at T0
function isPointInPolygon(pt: [number, number], vs: [number, number][]): boolean {
  const x = pt[0], y = pt[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Generate base offsets strictly inside detected slick mask at T0 via rejection sampling
function generateBaseParticleOffsets(count: number, seed: number) {
  const rng = createPrng(seed);
  const offsets: { u: number; v: number }[] = [];
  const poly1 = DEMO_SLICK_GEOMETRY.coordinates[0];
  const poly2 = DEMO_SLICK_GEOMETRY.coordinates[1];
  const bounds = DEMO_SLICK_GEOMETRY.wgs84Bounds;
  const centerLon = DEMO_SLICK_GEOMETRY.centroid.lon;
  const centerLat = DEMO_SLICK_GEOMETRY.centroid.lat;

  let attempts = 0;
  while (offsets.length < count && attempts < 200000) {
    attempts++;
    const lon = bounds.minLon + rng() * (bounds.maxLon - bounds.minLon);
    const lat = bounds.minLat + rng() * (bounds.maxLat - bounds.minLat);
    if (isPointInPolygon([lon, lat], poly1) || isPointInPolygon([lon, lat], poly2)) {
      offsets.push({
        u: parseFloat((lon - centerLon).toFixed(6)),
        v: parseFloat((lat - centerLat).toFixed(6)),
      });
    }
  }

  // Fallback in case of bounds edge case
  while (offsets.length < count) {
    offsets.push({ u: 0, v: 0 });
  }

  return offsets;
}

const BASE_PARTICLE_OFFSETS = generateBaseParticleOffsets(1750, 42);

// Generate 25 hourly backward particle states (hours 0 to 24) with natural earlier dispersion
export function generateLagrangianParticles(): HourlyParticleState[] {
  const states: HourlyParticleState[] = [];
  const rng = createPrng(9912);

  for (let h = 0; h <= 24; h++) {
    // Exact backward advection track passing through T-16h intercept
    let centerLon: number;
    let centerLat: number;
    if (h <= 16) {
      const w = h / 16;
      centerLon = 18.2066 + (18.045 - 18.2066) * w;
      centerLat = 38.0649 + (37.918 - 38.0649) * w;
    } else {
      const w = (h - 16) / 8;
      centerLon = 18.045 + (17.952 - 18.045) * w;
      centerLat = 37.918 + (37.834 - 37.918) * w;
    }

    // Steady, gradual hydrodynamic dispersion scale increasing smoothly with elapsed time
    const progress = h / 24;
    const diffusionScale = 1.0 + progress * 1.25;

    const particles = BASE_PARTICLE_OFFSETS.map((bp, idx) => {
      // Smoothly scale random turbulent jitter with elapsed time
      const jitterAmount = 0.0025 * progress;
      const jitterLon = (rng() - 0.5) * jitterAmount;
      const jitterLat = (rng() - 0.5) * jitterAmount;

      return {
        id: idx,
        lon: parseFloat((centerLon + bp.u * diffusionScale + jitterLon).toFixed(5)),
        lat: parseFloat((centerLat + bp.v * diffusionScale + jitterLat).toFixed(5)),
        depth: 0,
      };
    });

    const date = new Date(Date.UTC(2019, 9, 26, 5, 53) - h * 3600 * 1000);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const timeStr = `${y}-${m}-${d} ${hh}:${mm} UTC`;

    states.push({
      hourBack: h,
      timeUtc: timeStr,
      particles,
    });
  }

  return states;
}

export const DEMO_HOURLY_PARTICLES: HourlyParticleState[] = generateLagrangianParticles();

// Deterministic KDE timesteps for the key investigation steps
export const DEMO_KDE_TIMESTEPS: KDETimeStep[] = HINDCAST_STEPS.map((step) => {
  const matchingState =
    DEMO_HOURLY_PARTICLES.find((s) => s.hourBack === step.hourBack) ||
    DEMO_HOURLY_PARTICLES[0];

  const gridRows = 16;
  const gridCols = 16;
  const gridValues: number[][] = [];
  for (let r = 0; r < gridRows; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridCols; c++) {
      const distFromCenter = Math.hypot(
        (r - gridRows / 2) / (gridRows / 2),
        (c - gridCols / 2) / (gridCols / 2)
      );
      const val = Math.max(0, 1 - distFromCenter);
      row.push(parseFloat((val * step.relativePeak).toFixed(3)));
    }
    gridValues.push(row);
  }

  return {
    timeOffsetHours: step.hourBack,
    timeUtc: step.timeUtc,
    particles: matchingState.particles,
    densityGrid: {
      bounds: {
        minLat: step.centroid.lat - step.spreadLat,
        maxLat: step.centroid.lat + step.spreadLat,
        minLon: step.centroid.lon - step.spreadLon,
        maxLon: step.centroid.lon + step.spreadLon,
      },
      rows: gridRows,
      cols: gridCols,
      values: gridValues,
    },
    contour95: step.contour,
    centroid: step.centroid,
    densityPeak: step.densityPeak,
    envelopeAreaKm2: step.areaKm2,
    relativePeakDensity: step.relativePeak,
    isKeyInterception: step.isKeyInterception,
  };
});

// Backward KDE Envelopes
export const DEMO_KDE_ENVELOPES: KdeEnvelope[] = DEMO_KDE_TIMESTEPS.map((kde) => ({
  hourBack: kde.timeOffsetHours,
  timeUtc: kde.timeUtc,
  areaKm2: kde.envelopeAreaKm2,
  centroid: [kde.centroid.lon, kde.centroid.lat],
  polygon: kde.contour95,
  isKeyHour: true,
}));

// Probable Origin Drift Track connecting centroids across all 25 hourly stages
export const DEMO_ORIGIN_DRIFT_TRACK = HINDCAST_STEPS.map((s) => ({
  hourBack: s.hourBack,
  lon: s.centroid.lon,
  lat: s.centroid.lat,
  areaKm2: s.areaKm2,
  timeUtc: s.timeUtc,
}));

// Forward Forecast Envelopes - Removed per user request (no KDE envelopes for forecasting)
export const DEMO_FORECAST_ENVELOPES: ForecastEnvelope[] = [];

// Forward Forecast Drift Track: continuous Northeastward hydrodynamic drift (40.8° axis) across 2-hour timesteps
export const DEMO_FORECAST_DRIFT_TRACK = [
  { hourAhead: 0, lon: 18.2066, lat: 38.0649, areaKm2: 17.73, timeUtc: '2019-10-26 05:53 UTC' },
  { hourAhead: 2, lon: 18.2269, lat: 38.0829, areaKm2: 20.4, timeUtc: '2019-10-26 07:53 UTC' },
  { hourAhead: 4, lon: 18.2472, lat: 38.1009, areaKm2: 22.8, timeUtc: '2019-10-26 09:53 UTC' },
  { hourAhead: 6, lon: 18.2675, lat: 38.1189, areaKm2: 25.7, timeUtc: '2019-10-26 11:53 UTC' },
  { hourAhead: 8, lon: 18.2878, lat: 38.1369, areaKm2: 28.4, timeUtc: '2019-10-26 13:53 UTC' },
  { hourAhead: 10, lon: 18.3081, lat: 38.1549, areaKm2: 31.1, timeUtc: '2019-10-26 15:53 UTC' },
  { hourAhead: 12, lon: 18.3284, lat: 38.173, areaKm2: 33.8, timeUtc: '2019-10-26 17:53 UTC' },
  { hourAhead: 14, lon: 18.3487, lat: 38.191, areaKm2: 36.5, timeUtc: '2019-10-26 19:53 UTC' },
  { hourAhead: 16, lon: 18.369, lat: 38.209, areaKm2: 39.1, timeUtc: '2019-10-26 21:53 UTC' },
  { hourAhead: 18, lon: 18.3893, lat: 38.227, areaKm2: 41.8, timeUtc: '2019-10-26 23:53 UTC' },
  { hourAhead: 20, lon: 18.4095, lat: 38.245, areaKm2: 44.5, timeUtc: '2019-10-27 01:53 UTC' },
  { hourAhead: 22, lon: 18.4298, lat: 38.263, areaKm2: 47.1, timeUtc: '2019-10-27 03:53 UTC' },
  { hourAhead: 24, lon: 18.45, lat: 38.281, areaKm2: 49.8, timeUtc: '2019-10-27 05:53 UTC' },
];

// Generate 1,000 particles moving FORWARD in time (Forecast Horizon 24h, 25 hourly states)
// Continues smoothly along prevailing 40.8° Northeast drift vector with earlier natural dispersion
const FORECAST_PARTICLE_OFFSETS = generateBaseParticleOffsets(1000, 88);

export function generateForwardForecastParticles(): ForwardForecastState[] {
  const states: ForwardForecastState[] = [];
  const rng = createPrng(6612);

  for (let h = 0; h <= 24; h++) {
    const progress = h / 24;
    // Advection forward: continuous Northeastward drift along 40.8° PCA axis
    const centerLon = 18.2066 + (18.45 - 18.2066) * progress;
    const centerLat = 38.0649 + (38.281 - 38.0649) * progress;

    // Fay spreading and turbulent dispersion increasing smoothly with elapsed time
    const diffusionScale = 1.0 + progress * 1.25;

    const particles = FORECAST_PARTICLE_OFFSETS.map((bp, idx) => {
      const jitterAmount = 0.0025 * progress;
      const jitterLon = (rng() - 0.5) * jitterAmount;
      const jitterLat = (rng() - 0.5) * jitterAmount;

      return {
        id: idx,
        lon: parseFloat((centerLon + bp.u * diffusionScale + jitterLon).toFixed(5)),
        lat: parseFloat((centerLat + bp.v * diffusionScale + jitterLat).toFixed(5)),
        depth: 0,
      };
    });

    const date = new Date(Date.UTC(2019, 9, 26, 5, 53) + h * 3600 * 1000);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const timeStr = `${y}-${m}-${d} ${hh}:${mm} UTC`;

    // Weathering kinetics
    const evaporatedPct = Math.min(25.1, Math.log(1 + h) * 7.8);
    const dispersedPct = Math.min(11.4, h * 0.475);
    const surfaceRemainingPct = Math.max(63.5, 100 - evaporatedPct - dispersedPct);
    const areaKm2 = 17.73 + (49.8 - 17.73) * progress;

    states.push({
      hourAhead: h,
      timeUtc: timeStr,
      particles,
      centroid: [parseFloat(centerLon.toFixed(4)), parseFloat(centerLat.toFixed(4))],
      areaKm2: parseFloat(areaKm2.toFixed(1)),
      evaporatedPct: parseFloat(evaporatedPct.toFixed(1)),
      dispersedPct: parseFloat(dispersedPct.toFixed(1)),
      surfaceRemainingPct: parseFloat(surfaceRemainingPct.toFixed(1)),
    });
  }

  return states;
}

export const DEMO_FORECAST_PARTICLES: ForwardForecastState[] = generateForwardForecastParticles();

// AIS Screening Summary matching research model output
export const DEMO_AIS_SUMMARY: AisScreeningSummary = {
  totalPings: 3069,
  uniqueVessels: 30,
  interpolableVessels: 28,
  vesselsEnteringOriginEnvelope: 1,
  queryEngine: 'DuckDB In-Memory Parquet Engine',
  searchWindowHours: 24,
};

// Top 10 Vessels from the notebook model output
export const DEMO_SUSPECTS: SuspectVessel[] = [
  {
    rank: 1,
    mmsi: '253452137',
    vesselName: 'M/T PACIFIC VALOUR',
    vesselType: 'Crude Oil Tanker',
    culpritScorePct: 81.2,
    mdoKm: 0.544,
    closestHourBack: 16,
    timeClosestApproach: '2019-10-25 13:53 UTC',
    lonClosest: 18.0421,
    latClosest: 37.9152,
    sogKn: 10.8,
    cogDeg: 219,
    cogVsSlickAxisDeg: 1.9,
    hoursInsideEnvelope: 1,
    pingGapSec: 0,
    manoeuvreFlag: 'cruising',
    spatialScore: 0.844,
    temporalScore: 0.733,
    courseScore: 0.979,
    speedScore: 0.6,
    timeMatchPct: 73.3,
    weights: { spatial: 0.45, temporal: 0.2, course: 0.2, speed: 0.15 },
    track: [
      { hourBack: 24, timeUtc: '2019-10-25 05:53 UTC', lon: 18.281, lat: 38.162, sog: 11.0, cog: 218 },
      { hourBack: 20, timeUtc: '2019-10-25 09:53 UTC', lon: 18.162, lat: 38.038, sog: 10.9, cog: 219 },
      { hourBack: 18, timeUtc: '2019-10-25 11:53 UTC', lon: 18.102, lat: 37.976, sog: 10.8, cog: 219 },
      { hourBack: 16, timeUtc: '2019-10-25 13:53 UTC', lon: 18.0421, lat: 37.9152, sog: 10.8, cog: 219 },
      { hourBack: 12, timeUtc: '2019-10-25 17:53 UTC', lon: 17.921, lat: 37.791, sog: 10.7, cog: 220 },
      { hourBack: 8, timeUtc: '2019-10-25 21:53 UTC', lon: 17.801, lat: 37.668, sog: 10.8, cog: 219 },
      { hourBack: 4, timeUtc: '2019-10-26 01:53 UTC', lon: 17.681, lat: 37.545, sog: 10.9, cog: 218 },
      { hourBack: 0, timeUtc: '2019-10-26 05:53 UTC', lon: 17.561, lat: 37.422, sog: 11.0, cog: 219 },
    ],
  },
  {
    rank: 2,
    mmsi: '219448784',
    vesselName: 'M/V NORDIC CROWN',
    vesselType: 'Bulk Carrier',
    culpritScorePct: 43.0,
    mdoKm: 8.904,
    closestHourBack: 10,
    timeClosestApproach: '2019-10-25 19:53 UTC',
    lonClosest: 18.152,
    latClosest: 37.982,
    sogKn: 12.4,
    cogDeg: 195,
    cogVsSlickAxisDeg: 22.1,
    hoursInsideEnvelope: 0,
    pingGapSec: 18,
    manoeuvreFlag: 'cruising',
    spatialScore: 0.42,
    temporalScore: 0.51,
    courseScore: 0.45,
    speedScore: 0.35,
    timeMatchPct: 51.0,
    weights: { spatial: 0.45, temporal: 0.2, course: 0.2, speed: 0.15 },
    track: [
      { hourBack: 16, timeUtc: '2019-10-25 13:53 UTC', lon: 18.25, lat: 38.15, sog: 12.3, cog: 195 },
      { hourBack: 10, timeUtc: '2019-10-25 19:53 UTC', lon: 18.152, lat: 37.982, sog: 12.4, cog: 195 },
      { hourBack: 4, timeUtc: '2019-10-26 01:53 UTC', lon: 18.054, lat: 37.814, sog: 12.5, cog: 194 },
    ],
  },
  {
    rank: 3,
    mmsi: '245387639',
    vesselName: 'M/T CHEM ATLANTIC',
    vesselType: 'Chemical Tanker',
    culpritScorePct: 40.6,
    mdoKm: 113.59,
    closestHourBack: 14,
    timeClosestApproach: '2019-10-25 15:53 UTC',
    lonClosest: 18.48,
    latClosest: 38.32,
    sogKn: 14.1,
    cogDeg: 240,
    cogVsSlickAxisDeg: 18.0,
    hoursInsideEnvelope: 0,
    pingGapSec: 42,
    manoeuvreFlag: 'cruising',
    spatialScore: 0.18,
    temporalScore: 0.62,
    courseScore: 0.74,
    speedScore: 0.52,
    timeMatchPct: 62.0,
    weights: { spatial: 0.45, temporal: 0.2, course: 0.2, speed: 0.15 },
    track: [
      { hourBack: 20, timeUtc: '2019-10-25 09:53 UTC', lon: 18.82, lat: 38.52, sog: 14.0, cog: 240 },
      { hourBack: 14, timeUtc: '2019-10-25 15:53 UTC', lon: 18.48, lat: 38.32, sog: 14.1, cog: 240 },
      { hourBack: 8, timeUtc: '2019-10-25 21:53 UTC', lon: 18.14, lat: 38.12, sog: 14.2, cog: 239 },
    ],
  },
  {
    rank: 4,
    mmsi: '220615352',
    vesselName: 'C/V AEGEAN STAR',
    vesselType: 'Container Ship',
    culpritScorePct: 39.1,
    mdoKm: 50.358,
    closestHourBack: 8,
    timeClosestApproach: '2019-10-25 21:53 UTC',
    lonClosest: 18.41,
    latClosest: 37.81,
    sogKn: 9.5,
    cogDeg: 180,
    cogVsSlickAxisDeg: 40.8,
    hoursInsideEnvelope: 0,
    pingGapSec: 12,
    manoeuvreFlag: 'cruising',
    spatialScore: 0.29,
    temporalScore: 0.48,
    courseScore: 0.51,
    speedScore: 0.41,
    timeMatchPct: 48.0,
    weights: { spatial: 0.45, temporal: 0.2, course: 0.2, speed: 0.15 },
    track: [
      { hourBack: 12, timeUtc: '2019-10-25 17:53 UTC', lon: 18.41, lat: 38.05, sog: 9.4, cog: 180 },
      { hourBack: 8, timeUtc: '2019-10-25 21:53 UTC', lon: 18.41, lat: 37.81, sog: 9.5, cog: 180 },
      { hourBack: 2, timeUtc: '2019-10-26 03:53 UTC', lon: 18.41, lat: 37.45, sog: 9.6, cog: 180 },
    ],
  },
  {
    rank: 5,
    mmsi: '283519204',
    vesselName: 'M/V IONIAN TRADER',
    vesselType: 'General Cargo',
    culpritScorePct: 38.2,
    mdoKm: 35.127,
    closestHourBack: 18,
    timeClosestApproach: '2019-10-25 11:53 UTC',
    lonClosest: 17.85,
    latClosest: 37.99,
    sogKn: 11.2,
    cogDeg: 210,
    cogVsSlickAxisDeg: 10.2,
    hoursInsideEnvelope: 0,
    pingGapSec: 30,
    manoeuvreFlag: 'cruising',
    spatialScore: 0.32,
    temporalScore: 0.41,
    courseScore: 0.62,
    speedScore: 0.33,
    timeMatchPct: 41.0,
    weights: { spatial: 0.45, temporal: 0.2, course: 0.2, speed: 0.15 },
    track: [
      { hourBack: 24, timeUtc: '2019-10-25 05:53 UTC', lon: 18.12, lat: 38.16, sog: 11.1, cog: 210 },
      { hourBack: 18, timeUtc: '2019-10-25 11:53 UTC', lon: 17.85, lat: 37.99, sog: 11.2, cog: 210 },
      { hourBack: 12, timeUtc: '2019-10-25 17:53 UTC', lon: 17.58, lat: 37.82, sog: 11.3, cog: 211 },
    ],
  },
];

export const DEMO_ALL_AIS_VESSELS: AISVesselTrack[] = DEMO_SUSPECTS.map((s) => ({
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

export const DEMO_PROBABLE_ORIGIN_REGION = {
  lon: 18.045,
  lat: 37.918,
  timeOffset: 'T-16h (2019-10-25 13:53 UTC)',
  confidenceKde: '95% Non-Parametric Kernel Density Envelope',
  areaKm2: 58.24,
  description:
    'Spatio-temporal intersection peak between backward-diffused particle ensemble and historical AIS vessel tracks. Centered at 37.918° N, 18.045° E, spanning 58.24 km² 95% KDE boundary.',
};

export const DEMO_INVESTIGATION_DOSSIER: InvestigationDossier = {
  caseId: DEMO_CASE_ID,
  caseMetadata: DEMO_CASE_METADATA,
  geometry: DEMO_SLICK_GEOMETRY,
  detectionMetrics: DEMO_DETECTION_METRICS,
  sarCharacterisation: DEMO_SAR_CHARACTERISATION,
  simulationConfig: DEMO_SIM_CONFIG,
  aisSummary: DEMO_AIS_SUMMARY,
  topSuspects: DEMO_SUSPECTS,
  kdeEnvelopes: DEMO_KDE_ENVELOPES,
  kdeHistory: DEMO_KDE_TIMESTEPS,
  probableOriginRegion: DEMO_PROBABLE_ORIGIN_REGION,
};

export const DEMO_DETECTION_RESULT: OilSpillDetectionResult = {
  caseId: DEMO_CASE_ID,
  mask: '',
  areaKm2: DEMO_SLICK_GEOMETRY.areaKm2,
  perimeterKm: DEMO_SLICK_GEOMETRY.perimeterKm,
  lengthKm: DEMO_SLICK_GEOMETRY.lengthKm,
  widthKm: DEMO_SLICK_GEOMETRY.widthKm,
  elongationRatio: DEMO_SLICK_GEOMETRY.pcaElongationRatio,
  centroid: {
    lat: DEMO_SLICK_GEOMETRY.centroid.lat,
    lon: DEMO_SLICK_GEOMETRY.centroid.lon,
  },
  captureTime: DEMO_CASE_METADATA.acquisitionTime,
  satellite: DEMO_CASE_METADATA.satellite,
  estimatedType: 'Crude Oil',
  confidencePct: 94.2,
  geometry: DEMO_SLICK_GEOMETRY,
  sarCharacterisation: DEMO_SAR_CHARACTERISATION,
  detectionMetrics: DEMO_DETECTION_METRICS,
};
