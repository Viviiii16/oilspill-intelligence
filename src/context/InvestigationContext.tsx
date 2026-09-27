import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  InvestigationCase,
  InvestigationStepId,
  SuspectVessel,
  SlickGeometry,
  DetectionModelMetrics,
  SarPhysicalCharacterisation,
  SimulationConfig,
  KdeEnvelope,
  KDETimeStep,
  ForecastEnvelope,
  ForwardForecastState,
  AisScreeningSummary,
  HourlyParticleState,
  AISVesselTrack,
  ProcessingState,
  AppRoute,
  SARPreviewMode,
  KDEHistoryMode,
  AISTrafficFilter,
  LayerVisibility,
  AttributionResult,
  AttributionMeta,
} from '../types';
import {
  DEMO_CASE_METADATA,
  DEMO_SLICK_GEOMETRY,
  DEMO_DETECTION_METRICS,
  DEMO_SAR_CHARACTERISATION,
  DEMO_SIM_CONFIG,
  DEMO_KDE_TIMESTEPS,
  DEMO_ORIGIN_DRIFT_TRACK,
  DEMO_FORECAST_PARTICLES,
  DEMO_FORECAST_DRIFT_TRACK,
  DEMO_SUSPECTS,
} from '../data/demoData';
import { detectOilSpill } from '../services/detectionService';
import { analyseSlick, getDemoAttribution } from '../services/attributionService';

export interface UploadedFileInfo {
  name: string;
  sizeFormatted: string;
  type: string;
  file?: File;
}

export interface InvestigationContextType {
  // Routing & Workflow
  currentRoute: AppRoute;
  setCurrentRoute: (route: AppRoute) => void;
  goToRoute: (route: AppRoute) => void;
  routeLoadingTarget: AppRoute | null;
  processingState: ProcessingState;
  setProcessingState: (state: ProcessingState) => void;

  // Case Metadata
  currentCase: InvestigationCase;
  setCurrentCase: (c: InvestigationCase) => void;
  activeStep: InvestigationStepId;
  setActiveStep: (step: InvestigationStepId) => void;

  // File Upload State
  uploadedFile: UploadedFileInfo | null;
  setUploadedFile: (file: UploadedFileInfo | null) => void;
  uploadError: string | null;
  setUploadError: (err: string | null) => void;

  // Progress Trackers
  analysisStepName: string;
  analysisStepIndex: number;
  analysisTotalSteps: number;

  // Scientific Data
  geometry: SlickGeometry;
  detectionMetrics: DetectionModelMetrics;
  sarCharacterisation: SarPhysicalCharacterisation;
  simulationConfig: SimulationConfig;
  setSimulationConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  aisSummary: AisScreeningSummary;
  suspects: SuspectVessel[];
  allAisVessels: AISVesselTrack[];
  selectedVessel: SuspectVessel | null;
  setSelectedVessel: (v: SuspectVessel | null) => void;
  aisTrafficFilter: AISTrafficFilter;
  setAisTrafficFilter: (filter: AISTrafficFilter) => void;

  // KDE & Timestep Evolution
  kdeHistory: KDETimeStep[];
  currentKdeStep: KDETimeStep;
  kdeHistoryMode: KDEHistoryMode;
  setKdeHistoryMode: (mode: KDEHistoryMode) => void;
  kdeEnvelopes: KdeEnvelope[];
  originDriftTrack: typeof DEMO_ORIGIN_DRIFT_TRACK;
  selectedKdeInfo: KDETimeStep | null;
  setSelectedKdeInfo: (step: KDETimeStep | null) => void;
  hoveredDensity: number | null;
  setHoveredDensity: (val: number | null) => void;

  // Simulation & Playback
  simHourBack: number;
  setSimHourBack: (h: number) => void;
  forecastHourAhead: number;
  setForecastHourAhead: (h: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  simDirection: 'BACKWARD' | 'FORWARD';
  setSimDirection: (dir: 'BACKWARD' | 'FORWARD') => void;
  currentParticles: HourlyParticleState;
  currentForecastState: ForwardForecastState;
  forecastEnvelopes: ForecastEnvelope[];
  forecastDriftTrack: typeof DEMO_FORECAST_DRIFT_TRACK;

  // Layers & Previews
  layers: LayerVisibility;
  toggleLayer: (layerName: keyof LayerVisibility) => void;
  setLayer: (layerName: keyof LayerVisibility, val: boolean) => void;
  sarPreviewMode: SARPreviewMode;
  setSarPreviewMode: (mode: SARPreviewMode) => void;
  slickOpacity: number;
  setSlickOpacity: (val: number) => void;
  particleOpacity: number;
  setParticleOpacity: (val: number) => void;
  mapBrightness: number;
  setMapBrightness: (val: number) => void;
  mapStyle: 'dark' | 'satellite' | 'ocean';
  setMapStyle: (style: 'dark' | 'satellite' | 'ocean') => void;
  resetMapFocusTrigger: number;
  triggerResetView: () => void;

  // Live model provenance (null = demo data)
  attributionMeta: AttributionMeta | null;
  keyHourBack: number;

  // Modals
  demoModeModalOpen: boolean;
  setDemoModeModalOpen: (open: boolean) => void;

  // Orchestration Methods
  startImageAnalysis: () => Promise<void>;
  startSlickAnalysis: () => Promise<void>;
}

const defaultLayers: LayerVisibility = {
  // OBSERVATION
  sarImage: true,
  slickPolygon: true,
  centroid: true,
  // RECONSTRUCTION
  particles: true,
  kdeDensity: true,
  kdeEnvelopes: true,
  kdeCentroids: true,
  originDriftTrack: true,
  // FORECAST
  forecastParticles: true,
  forecastKde: true,
  forecastEnvelopes: true,
  forecastDriftTrack: true,
  // VESSEL TRAFFIC
  aisTraffic: true,
  suspectTracks: true,
  closestApproachLine: true,
};

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Routing & Processing
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('landing');
  const [visitedRoutes, setVisitedRoutes] = useState<Record<AppRoute, boolean>>({
    landing: true,
    detection: true,
    investigation: false,
    report: false,
  });
  const [routeLoadingTarget, setRouteLoadingTarget] = useState<AppRoute | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');

  // Case
  const [currentCase, setCurrentCase] = useState<InvestigationCase>(DEMO_CASE_METADATA);
  const [activeStep, setActiveStep] = useState<InvestigationStepId>(1);

  // File upload
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Progress indicators
  const [analysisStepName, setAnalysisStepName] = useState<string>('');
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);
  const [analysisTotalSteps, setAnalysisTotalSteps] = useState<number>(4);

  // Attribution result (demo until a live model run replaces it)
  const [attribution, setAttribution] = useState<AttributionResult>(getDemoAttribution());
  const attributionMeta: AttributionMeta | null = attribution.meta ?? null;
  const keyHourBack = attributionMeta ? attributionMeta.keyHourBack : 16; // demo key hour = T-16h

  // Scientific data
  const [geometry, setGeometry] = useState<SlickGeometry>(DEMO_SLICK_GEOMETRY);
  const [detectionMetrics] = useState<DetectionModelMetrics>(DEMO_DETECTION_METRICS);
  const [sarCharacterisation] = useState<SarPhysicalCharacterisation>(DEMO_SAR_CHARACTERISATION);
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>(DEMO_SIM_CONFIG);
  const aisSummary: AisScreeningSummary = attribution.aisSummary;
  const suspects: SuspectVessel[] = attribution.suspects;
  const allAisVessels: AISVesselTrack[] = attribution.aisVessels;
  const [selectedVessel, setSelectedVessel] = useState<SuspectVessel | null>(DEMO_SUSPECTS[0]);
  const [aisTrafficFilter, setAisTrafficFilter] = useState<AISTrafficFilter>('relevant');

  // KDE & Timestep Evolution
  const kdeHistory: KDETimeStep[] = attribution.kdeHistory.length ? attribution.kdeHistory : DEMO_KDE_TIMESTEPS;
  const [kdeHistoryMode, setKdeHistoryMode] = useState<KDEHistoryMode>('all');
  const kdeEnvelopes: KdeEnvelope[] = attribution.kdeEnvelopes;
  const originDriftTrack: typeof DEMO_ORIGIN_DRIFT_TRACK = attribution.originDriftTrack;
  const [selectedKdeInfo, setSelectedKdeInfo] = useState<KDETimeStep | null>(
    DEMO_KDE_TIMESTEPS.find((k) => k.timeOffsetHours === 16) || DEMO_KDE_TIMESTEPS[0]
  ); // default T-16h intercept
  const [hoveredDensity, setHoveredDensity] = useState<number | null>(null);

  // Simulation & Timeline
  const [simHourBack, setSimHourBack] = useState<number>(0);
  const [forecastHourAhead, setForecastHourAhead] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simDirection, setSimDirection] = useState<'BACKWARD' | 'FORWARD'>('BACKWARD');

  // Layers & Cartography
  const [layers, setLayers] = useState<LayerVisibility>(defaultLayers);
  const [sarPreviewMode, setSarPreviewMode] = useState<SARPreviewMode>('overlay');
  const [slickOpacity, setSlickOpacity] = useState<number>(0.85);
  const [particleOpacity, setParticleOpacity] = useState<number>(0.8);
  const [mapBrightness, setMapBrightness] = useState<number>(1.25);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'ocean'>('satellite');
  const [resetMapFocusTrigger, setResetMapFocusTrigger] = useState<number>(0);

  // Modal
  const [demoModeModalOpen, setDemoModeModalOpen] = useState<boolean>(false);

  // Find current KDE Step based on simHourBack
  const currentKdeStep =
    kdeHistory.find((k) => k.timeOffsetHours === Math.round(simHourBack)) ||
    kdeHistory.reduce((prev, curr) =>
      Math.abs(curr.timeOffsetHours - simHourBack) < Math.abs(prev.timeOffsetHours - simHourBack)
        ? curr
        : prev
    );

  // Current hourly particle state (live or demo)
  const currentHindcastHour = Math.max(0, Math.min(24, Math.round(simHourBack)));
  const currentParticles: HourlyParticleState =
    attribution.particles.find((p) => p.hourBack === currentHindcastHour) ||
    attribution.particles[currentHindcastHour] || {
      hourBack: currentKdeStep.timeOffsetHours,
      timeUtc: currentKdeStep.timeUtc,
      particles: currentKdeStep.particles,
    };

  // Current forecast state (smooth lookup from DEMO_FORECAST_PARTICLES)
  const currentForecastHour = Math.max(0, Math.min(24, Math.round(forecastHourAhead)));
  const currentForecastState: ForwardForecastState =
    attribution.forecastParticles[currentForecastHour] ||
    attribution.forecastParticles[0] ||
    DEMO_FORECAST_PARTICLES[0];

  const forecastEnvelopes: ForecastEnvelope[] = attribution.forecastEnvelopes;
  const forecastDriftTrack: typeof DEMO_FORECAST_DRIFT_TRACK = attribution.forecastDriftTrack;

  // Toggle & Layer helpers
  const toggleLayer = useCallback((layerName: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  }, []);

  const setLayer = useCallback((layerName: keyof LayerVisibility, val: boolean) => {
    setLayers((prev) => ({ ...prev, [layerName]: val }));
  }, []);

  const triggerResetView = useCallback(() => {
    setResetMapFocusTrigger((prev) => prev + 1);
  }, []);

  const goToRoute = useCallback(
    (route: AppRoute) => {
      if ((route === 'investigation' || route === 'report') && !visitedRoutes[route]) {
        setRouteLoadingTarget(route);
        setVisitedRoutes((prev) => ({ ...prev, [route]: true }));
        setTimeout(() => {
          setCurrentRoute(route);
          setRouteLoadingTarget(null);
        }, 1200);
      } else {
        setCurrentRoute(route);
      }
    },
    [visitedRoutes]
  );

  // Execution: Start SAR Image Analysis (Landing -> Detection)
  const startImageAnalysis = async () => {
    setProcessingState('analysing-image');
    setAnalysisTotalSteps(4);

    try {
      await detectOilSpill(uploadedFile?.file, (stepName, stepIdx, total) => {
        setAnalysisStepName(stepName);
        setAnalysisStepIndex(stepIdx);
        setAnalysisTotalSteps(total);
      });
      setProcessingState('image-complete');
      setActiveStep(1);
      setCurrentRoute('detection');
    } catch {
      setProcessingState('idle');
      setUploadError('Analysis could not be completed. Please try again.');
    }
  };

  // Execution: Start Reverse-Lagrangian Spill Analysis (Detection -> Investigation)
  const startSlickAnalysis = async () => {
    setProcessingState('analysing-slick');
    setAnalysisTotalSteps(5);

    try {
      const result = await analyseSlick(geometry, simulationConfig, (stepName: string, stepIdx: number, total: number) => {
        setAnalysisStepName(stepName);
        setAnalysisStepIndex(stepIdx);
        setAnalysisTotalSteps(total);
      });
      setAttribution(result);
      if (result.slickGeometry) setGeometry(result.slickGeometry);
      setSelectedVessel(result.suspects[0] ?? null);
      const keyH = result.meta ? result.meta.keyHourBack : 16;
      setSelectedKdeInfo(
        result.kdeHistory.find((k) => k.timeOffsetHours === keyH) || result.kdeHistory[0] || null
      );
      setSimHourBack(0);
      setForecastHourAhead(0);
      setSimDirection('BACKWARD');
      setIsPlaying(false);
      setProcessingState('investigation-ready');
      setActiveStep(3);
      setVisitedRoutes((prev) => ({ ...prev, investigation: true }));
      setCurrentRoute('investigation');
    } catch {
      setProcessingState('image-complete');
      setUploadError('Attribution reconstruction failed. Please try again.');
    }
  };

  // Playback timer ticker (bidirectional, pauses gracefully at 24h horizon)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (simDirection === 'BACKWARD') {
        setSimHourBack((prev) => {
          if (prev >= 24) {
            setIsPlaying(false);
            return 24;
          }
          return Math.min(24, parseFloat((prev + 0.5 * playbackSpeed).toFixed(1)));
        });
      } else {
        setForecastHourAhead((prev) => {
          if (prev >= 24) {
            setIsPlaying(false);
            return 24;
          }
          return Math.min(24, parseFloat((prev + 0.5 * playbackSpeed).toFixed(1)));
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, simDirection]);

  return (
    <InvestigationContext.Provider
      value={{
        currentRoute,
        setCurrentRoute,
        goToRoute,
        routeLoadingTarget,
        processingState,
        setProcessingState,

        currentCase,
        setCurrentCase,
        activeStep,
        setActiveStep,

        uploadedFile,
        setUploadedFile,
        uploadError,
        setUploadError,

        analysisStepName,
        analysisStepIndex,
        analysisTotalSteps,

        geometry,
        detectionMetrics,
        sarCharacterisation,
        simulationConfig,
        setSimulationConfig,
        aisSummary,
        suspects,
        allAisVessels,
        selectedVessel,
        setSelectedVessel,
        aisTrafficFilter,
        setAisTrafficFilter,

        kdeHistory,
        currentKdeStep,
        kdeHistoryMode,
        setKdeHistoryMode,
        kdeEnvelopes,
        originDriftTrack,
        selectedKdeInfo,
        setSelectedKdeInfo,
        hoveredDensity,
        setHoveredDensity,

        simHourBack,
        setSimHourBack,
        forecastHourAhead,
        setForecastHourAhead,
        isPlaying,
        setIsPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        simDirection,
        setSimDirection,
        currentParticles,
        currentForecastState,
        forecastEnvelopes,
        forecastDriftTrack,

        layers,
        toggleLayer,
        setLayer,
        sarPreviewMode,
        setSarPreviewMode,
        slickOpacity,
        setSlickOpacity,
        particleOpacity,
        setParticleOpacity,
        mapBrightness,
        setMapBrightness,
        mapStyle,
        setMapStyle,
        resetMapFocusTrigger,
        triggerResetView,

        attributionMeta,
        keyHourBack,

        demoModeModalOpen,
        setDemoModeModalOpen,

        startImageAnalysis,
        startSlickAnalysis,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = (): InvestigationContextType => {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
