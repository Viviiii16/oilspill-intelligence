# OILSPILL INTELLIGENCE

> **"From satellite detection to probable source."**  
> *Detect • Reconstruct • Attribute*

A high-end, interactive, production-quality maritime intelligence and satellite operations web platform for satellite SAR oil-slick detection, physical slick characterisation, reverse Lagrangian trajectory hindcasting, 95% KDE probable origin envelope reconstruction, historical AIS spatio-temporal correlation, and multi-criteria vessel attribution ranking.

---

## 1. Product Concept & Investigation Workflow

The platform visually operationalizes the complete analytical intelligence chain:

```
SATELLITE SAR (Sentinel-1 C-SAR IW)
       ↓
OIL SLICK DETECTION (DeepLabV3+ ResNet-50)
       ↓
SLICK CHARACTERISATION (Geometry & Wave Damping Δσ⁰)
       ↓
REVERSE LAGRANGIAN HINDCAST (2,500 Particles, RK4, ERA5 + CMEMS)
       ↓
PROBABLE ORIGIN ENVELOPES (Rolling 95% KDE & Centroid Drift Track)
       ↓
HISTORICAL AIS CORRELATION (DuckDB Spatio-Temporal Interception)
       ↓
VESSEL SCREENING & MANOEUVRE ANALYSIS
       ↓
SUSPECT RANKING (4-Pillar Weighted Attribution Matrix)
       ↓
INVESTIGATION REPORT (Analytical Evidence Dossier, PDF/JSON/CSV Export)
```

---

## 2. Key Operational Principles & Scientific Rigor

1. **Zero Age Estimation**: Oil-spill age estimation is strictly excluded per operational guidelines.
2. **Historical/Static Data Only**: No live feeds or simulated real-time data. All datasets are marked with `● HISTORICAL DATA` and `● DEMO CASE`.
3. **Probabilistic Non-Accusatory Terminology**: Ships are designated as **"Vessels of Interest"** with **"Attribution Scores"** rather than "culprits". Prominent legal disclaimers state that model correlations provide analytical decision-support and do not constitute legal proof of discharge responsibility.
4. **Physical Damping Caveats**: SAR VV wave damping differences (Δσ⁰) classify slicks into *Heavy Crude / Bunker-C Sludge*, *Medium Crude*, or *Light Fuel / Sheen* as an empirical backscatter suppression indicator, not a definitive chemical test.
5. **Exact Notebook Model Outputs**: Every scientific metric (Real Oil IoU 62.58%, F1 79.81%, Recall 86.20%, Precision 74.31%, Look-alike FPR 7.63%, 17.7306 km² area, Rank #1 MMSI 253452137 Score 81.2% at MDO 0.544 km at T-16h) directly maps to notebook results.

---

## 3. Tech Stack & Architecture

- **Frontend Framework**: React 19 + TypeScript + Vite 8
- **Styling & Theme**: Tailwind CSS v4 + Custom Maritime Obsidian HUD Theme
- **GIS Cartography**: Leaflet with custom CartoDB Dark Matter tiles, vector overlays, and HTML5 Canvas particle rendering (60 FPS)
- **3D Ocean Visualization**: Three.js WebGL canvas with curved bathymetric ocean surface, 3D particle ensemble, wind/current 3D vector arrows, and orbit controls
- **Data Visualizations**: Recharts for epoch-by-epoch model validation curves & score decompositions
- **Icons**: Lucide React
- **Geospatial Tools**: Turf.js (`@turf/turf`)

### Project Structure

```
oilspill-intelligence/
├── public/
│   └── satellite.svg            # Favicon and tactical sensor iconography
├── src/
│   ├── types/
│   │   └── index.ts             # Complete TypeScript schemas matching Python models
│   ├── data/
│   │   └── mockData.ts          # Static demo fixtures matching notebook exports
│   ├── services/
│   │   └── modelService.ts      # Clean service abstraction layer (Mock / REST API)
│   ├── context/
│   │   └── InvestigationContext.tsx # Central app state (Step, layers, simulation, filters)
│   ├── components/
│   │   ├── common/
│   │   │   ├── TopBar.tsx       # Header with historical badge, search, 2D/3D toggle
│   │   │   ├── PipelineNav.tsx  # Left 7-step investigation rail with status checks
│   │   │   └── InvestigationTimeline.tsx # Bottom persistent timeline with speed controls
│   │   ├── map/
│   │   │   ├── GisMap.tsx       # Interactive 2D Leaflet map + 2,500 canvas particles
│   │   │   ├── Ocean3D.tsx      # Three.js 3D ocean vector space & orbit controls
│   │   │   └── LayerControl.tsx # Floating tactical layer toggles & opacity sliders
│   │   ├── detection/
│   │   │   └── DetectionStep.tsx # Interactive split before/after slider & DeepLabV3+ specs
│   │   ├── characterisation/
│   │   │   └── CharacterisationStep.tsx # 3-panel view, geometry cards, SAR damping
│   │   ├── simulation/
│   │   │   └── HindcastStep.tsx # Lagrangian RK4 controls, config drawer, forcing cards
│   │   ├── origin/
│   │   │   └── OriginStep.tsx   # 95% KDE envelopes table, probable origin coordinates
│   │   ├── ais/
│   │   │   └── AisStep.tsx      # DuckDB screening stats, dynamic vessel filters
│   │   ├── attribution/
│   │   │   └── AttributionStep.tsx # 10-vessel ranking table & score breakdowns
│   │   ├── reports/
│   │   │   └── ReportStep.tsx   # Evidence checklist, JSON/CSV exports
│   │   └── modals/
│   │       ├── ModelPerformanceModal.tsx # Recharts 30-epoch validation history
│   │       ├── WhyThisVesselModal.tsx    # 4-pillar horizontal score decomposition
│   │       ├── MethodologyModal.tsx     # Scientific documentation deep-dive
│   │       ├── SimulationVideoModal.tsx # Forward/backward simulation player
│   │       └── InvestigationReportModal.tsx # Printable official dossier & PDF export
│   ├── pages/
│   │   ├── LandingPage.tsx      # Cinematic hero, orbital radar grid, capability cards
│   │   ├── CaseSelection.tsx    # Investigation case archive selector
│   │   └── Workspace.tsx        # 3-pane tactical command center layout
│   ├── App.tsx                  # Main router and provider root
│   ├── index.css                # Tactical maritime theme, radar sweeps, glassmorphism
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 4. Connecting Python / Jupyter Models (Backend Integration)

The application includes a clean service abstraction in `src/services/modelService.ts`.

### Switching from Demo Mode to Real Python Backend

1. In the project root, create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
2. When `VITE_API_URL` is present, `modelService.ts` automatically redirects all requests from the static mock data to your FastAPI / Flask endpoints.

### Expected REST API Endpoints & Schemas

| Method | Endpoint | Description | Input Payload / Query | Output Format |
|---|---|---|---|---|
| `POST` | `/api/detect` | Execute DeepLabV3+ segmentation | `{ "caseId": "OS-2026-001" }` | `{ "metrics": DetectionModelMetrics, "geometry": SlickGeometry }` |
| `POST` | `/api/characterize` | Calculate physical wave damping | `{ "caseId": "OS-2026-001" }` | `SarPhysicalCharacterisation` |
| `POST` | `/api/hindcast` | Run Lagrangian RK4 hindcast | `{ "caseId": string, "config": SimulationConfig }` | `{ "particleStates": HourlyParticleState[], "originEnvelopes": KdeEnvelope[] }` |
| `GET` | `/api/hindcast/particles` | Get particles for given hour | `?caseId=...&hourBack=16` | `HourlyParticleState` |
| `GET` | `/api/hindcast/envelopes` | Get 95% KDE envelopes | `?caseId=...` | `KdeEnvelope[]` |
| `GET` | `/api/ais/summary` | DuckDB AIS screening overview | `?caseId=...` | `AisScreeningSummary` |
| `GET` | `/api/attribution` | Filtered & ranked suspects | `?caseId=...&minScore=40&maxDistanceKm=50` | `SuspectVessel[]` |
| `GET` | `/api/report` | Complete investigation dossier | `?caseId=...` | `InvestigationDossier` |

### Mapping Python Notebook File Outputs to Frontend Components

| Notebook Data Product | Schema / Format | Frontend Component Consumer |
|---|---|---|
| `suspects_ranked.csv` | `rank, mmsi, MDO_km, closest_hour_back, time_closest_approach, lon_closest, lat_closest, sog_kn, cog_deg, cog_vs_slick_axis_deg, hours_inside_envelope, ping_gap_s, manoeuvre_flag, S_spatial, S_temporal, S_course, S_speed, culprit_score_pct` | `AttributionStep.tsx`, `SuspectTable.tsx`, CSV Export |
| `vessel_hourly_matrix.csv` | Hourly AIS positions and interpolated tracks | `GisMap.tsx` AIS vector layers, `InvestigationTimeline.tsx` |
| `kde_envelopes.geojson` | Hourly 95% KDE polygons with `hour_back`, `area_km2`, `centroid` | `GisMap.tsx` polygons, `OriginStep.tsx` |
| `slick_polygon.geojson` | MultiPolygon with parts=2, EPSG:32634, MRR, PCA axis | `GisMap.tsx` amber polygon, `CharacterisationStep.tsx` |
| `particles_hourly.parquet` | `hour_back, lon, lat` (2,500 particles across 24h) | `GisMap.tsx` HTML5 Canvas layer, `Ocean3D.tsx` WebGL points |
| `backward_simulation.mp4` | Video stream of backward transport | `SimulationVideoModal.tsx` |
| `forward_simulation.mp4` | Video stream of forward forecast | `SimulationVideoModal.tsx` |

---

## 5. Running the Application Locally

```bash
# Navigate to project directory
cd /Users/vishesh/.gemini/antigravity/scratch/oilspill-intelligence

# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 6. Demonstration Case Walkthrough (Case #OS-2026-001)

1. **Launch**: Click `[ START INVESTIGATION ]` or `[ EXPLORE DEMO CASE ]`.
2. **Detection (01)**: Drag the split slider between Raw SAR and Predicted Mask; toggle VV, VH, and ΔPol channels; view DeepLabV3+ specs and click `[ EPOCH HISTORY ]` to inspect validation curves.
3. **Characterisation (02)**: Review extracted area (`17.7306 km²`), PCA axis (`40.806°`), MRR dimensions, and VV damping ratio (`8.7 dB`) classifying the substance as Heavy Crude.
4. **Hindcast (03)**: Press `PLAY` to observe 2,500 particles drifting backward over 24 hours under ERA5 winds and CMEMS currents; adjust speed to `4×` or jump directly to `T-16h`.
5. **Origin (04)**: Inspect rolling 95% KDE envelopes and click `T-16h (58.24 km²)` to highlight the peak interception envelope and centroid drift track.
6. **AIS (05)**: Review DuckDB screening of 3,069 pings and 28 interpolable vessels; adjust MDO and score filters.
7. **Attribution (06)**: Inspect the ranked table; click Rank #1 MMSI `253452137` (Score `81.2%`, MDO `0.544 km` at `T-16h`); click `[ WHY THIS VESSEL? ]` to view the 4-pillar horizontal score decomposition and cruising manoeuvre verification.
8. **3D Ocean**: Switch to `[ 3D OCEAN ]` in the top bar to inspect the curved ocean surface, 3D particle ensemble, current vector arrows, and vessel approach beacon.
9. **Dossier & Export (07)**: Click `[ REPORT ]` to review the official dossier and export as PDF, JSON, or CSV (`suspects_ranked.csv`).
