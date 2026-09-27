import {
  InvestigationCase,
  DetectionModelMetrics,
  SlickGeometry,
  SarPhysicalCharacterisation,
  SimulationConfig,
  HourlyParticleState,
  KdeEnvelope,
  AisScreeningSummary,
  SuspectVessel,
  InvestigationDossier,
  EnvironmentalForcingData,
} from '../types';
import {
  DEMO_CASE,
  OTHER_CASES,
  DETECTION_METRICS,
  SLICK_GEOMETRY,
  SAR_CHARACTERISATION,
  SIMULATION_CONFIG,
  HOURLY_PARTICLE_STATES,
  KDE_ENVELOPES,
  ORIGIN_DRIFT_TRACK,
  AIS_SUMMARY,
  SUSPECT_VESSELS,
  PROBABLE_ORIGIN_REGION,
  INVESTIGATION_DOSSIER,
  ENVIRONMENTAL_DATA,
} from '../data/mockData';
import { detectionApi, isDetectionLive, DetectionResult } from './detectionApi';

// API Environment configuration
// When connecting to real Python backend, set VITE_API_URL in .env
const API_BASE_URL = import.meta.env.VITE_API_URL || null;
export const IS_DEMO_MODE = !API_BASE_URL;

export interface VesselFilterParams {
  minScore?: number;
  maxDistanceKm?: number;
  manoeuvre?: string;
  searchQuery?: string;
}

class ModelService {
  /**
   * Fetch all available investigation cases
   */
  async getCases(): Promise<InvestigationCase[]> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/cases`);
      if (!res.ok) throw new Error('Failed to fetch cases from API');
      return res.json();
    }
    // Simulate slight async response
    await new Promise((resolve) => setTimeout(resolve, 80));
    return [DEMO_CASE, ...OTHER_CASES];
  }

  /**
   * Fetch details for a specific case
   */
  async getCaseById(caseId: string): Promise<InvestigationCase> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/cases/${caseId}`);
      if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 60));
    if (caseId === DEMO_CASE.id) return DEMO_CASE;
    const found = OTHER_CASES.find((c) => c.id === caseId);
    return found || DEMO_CASE;
  }

  /**
   * Execute or retrieve DeepLabV3+ slick detection
   */
    /** Last raw result from the Colab model (mask/SAR preview images, GeoJSON, map bounds) */
  lastDetection: DetectionResult | null = null;

  /**
   * Execute or retrieve DeepLabV3+ slick detection
   */
  async detectSlick(caseId: string): Promise<{
    metrics: DetectionModelMetrics;
    geometry: SlickGeometry;
  }> {
    // 1) Live model on Colab (only detection uses this)
    if (isDetectionLive()) {
      const r = await detectionApi.detectCase(caseId);
      this.lastDetection = r;
      console.log('[Detection] live result from Colab model', r);
      return {
        // Start from the demo objects so every field the UI needs exists,
        // then overwrite with the model's real values where names match
        metrics: { ...DETECTION_METRICS, ...r.metrics } as DetectionModelMetrics,
        geometry: { ...SLICK_GEOMETRY, ...r.geometry } as SlickGeometry,
      };
    }

    // 2) Full Python backend (unchanged)
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error('Failed to run detection API');
      return res.json();
    }

    // 3) Demo mode (unchanged)
    await new Promise((resolve) => setTimeout(resolve, 350));
    return {
      metrics: DETECTION_METRICS,
      geometry: SLICK_GEOMETRY,
    };
  }

  /**
   * Retrieve physical SAR backscatter damping & substance classification
   */
  async getSlickCharacterization(caseId: string): Promise<SarPhysicalCharacterisation> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/characterize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error('Failed to fetch characterization');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
    return SAR_CHARACTERISATION;
  }

  /**
   * Execute or retrieve Reverse Lagrangian Hindcast
   */
  async runHindcast(
    caseId: string,
    config: Partial<SimulationConfig> = {}
  ): Promise<{
    config: SimulationConfig;
    particleStates: HourlyParticleState[];
    originEnvelopes: KdeEnvelope[];
    originDriftTrack: typeof ORIGIN_DRIFT_TRACK;
  }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/hindcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, config }),
      });
      if (!res.ok) throw new Error('Failed to run hindcast API');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      config: { ...SIMULATION_CONFIG, ...config },
      particleStates: HOURLY_PARTICLE_STATES,
      originEnvelopes: KDE_ENVELOPES,
      originDriftTrack: ORIGIN_DRIFT_TRACK,
    };
  }

  /**
   * Retrieve particle array for a given hour
   */
  async getParticles(caseId: string, hourBack: number): Promise<HourlyParticleState> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/hindcast/particles?caseId=${caseId}&hourBack=${hourBack}`);
      if (!res.ok) throw new Error('Failed to fetch particles');
      return res.json();
    }
    const clampedHour = Math.max(0, Math.min(24, Math.round(hourBack)));
    return HOURLY_PARTICLE_STATES[clampedHour] || HOURLY_PARTICLE_STATES[0];
  }

  /**
   * Retrieve rolling 95% KDE origin envelopes
   */
  async getOriginEnvelopes(caseId: string): Promise<{
    envelopes: KdeEnvelope[];
    driftTrack: typeof ORIGIN_DRIFT_TRACK;
    probableOriginRegion: typeof PROBABLE_ORIGIN_REGION;
  }> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/hindcast/envelopes?caseId=${caseId}`);
      if (!res.ok) throw new Error('Failed to fetch envelopes');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return {
      envelopes: KDE_ENVELOPES,
      driftTrack: ORIGIN_DRIFT_TRACK,
      probableOriginRegion: PROBABLE_ORIGIN_REGION,
    };
  }

  /**
   * Retrieve AIS screening overview & metadata
   */
  async getAIS(caseId: string): Promise<AisScreeningSummary> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/ais/summary?caseId=${caseId}`);
      if (!res.ok) throw new Error('Failed to fetch AIS summary');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
    return AIS_SUMMARY;
  }

  /**
   * Retrieve screened and ranked suspect vessels of interest
   */
  async getSuspects(caseId: string, filters: VesselFilterParams = {}): Promise<SuspectVessel[]> {
    if (API_BASE_URL) {
      const query = new URLSearchParams({ caseId, ...filters as any }).toString();
      const res = await fetch(`${API_BASE_URL}/api/attribution?${query}`);
      if (!res.ok) throw new Error('Failed to fetch suspects');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 150));

    let results = [...SUSPECT_VESSELS];

    if (filters.minScore !== undefined) {
      results = results.filter((v) => v.culpritScorePct >= (filters.minScore ?? 0));
    }
    if (filters.maxDistanceKm !== undefined) {
      results = results.filter((v) => v.mdoKm <= (filters.maxDistanceKm ?? 200));
    }
    if (filters.manoeuvre && filters.manoeuvre !== 'all') {
      results = results.filter((v) => v.manoeuvreFlag === filters.manoeuvre);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      results = results.filter(
        (v) =>
          v.mmsi.includes(q) ||
          (v.vesselType && v.vesselType.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Retrieve complete investigation dossier for reporting
   */
  async getInvestigationReport(caseId: string): Promise<InvestigationDossier> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/report?caseId=${caseId}`);
      if (!res.ok) throw new Error('Failed to generate report');
      return res.json();
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return INVESTIGATION_DOSSIER;
  }

  /**
   * Retrieve environmental forcing context (ERA5 & CMEMS)
   */
  async getEnvironmentalForcing(caseId: string): Promise<EnvironmentalForcingData> {
    if (API_BASE_URL) {
      const res = await fetch(`${API_BASE_URL}/api/environmental?caseId=${caseId}`);
      if (!res.ok) throw new Error('Failed to fetch environmental data');
      return res.json();
    }
    return ENVIRONMENTAL_DATA;
  }
}

export const modelService = new ModelService();
