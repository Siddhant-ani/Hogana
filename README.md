# HOGANA — Smart Bus Operations & Mobility Intelligence Platform

> **Bengaluru Outer Ring Road Corridor:** Silk Board ↔ Hebbal (19.8 km)  
> **Demonstration Baseline:** 10 March 2025  
> **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS, React  

HOGANA is an enterprise-grade operational intelligence and decision-support web application for urban bus transit operations. Built on a canonical synthetic dataset, HOGANA demonstrates real-time corridor monitoring, automated bus bunching detection, service gap relief feasibility, passenger occupancy analysis, dispatcher intervention workflows, and scenario simulation.

---

## 🚀 Key Modules & Capabilities

1. **Operations Dashboard (`/dashboard`)**
   - Corridor-wide operational KPIs: 86 scheduled slots, 77 operated trips, cancellations, and resource shortfalls.
   - Headway regularity & On-Time Performance (OTP) tracking across key corridor stops.
   - Bus bunching detection with advisory holding recommendations.
   - Large service gap alerts with standby vehicle and crew relief feasibility analysis.
   - Passenger crowding monitoring against 60-passenger design capacity (40 seated + 20 standing).

2. **Data Centre (`/data`)**
   - Automated 56-check dataset integrity and validation audit.
   - Interactive data table browser for all canonical CSV datasets with search, pagination, and direction filtering.
   - Complete data provenance and synthetic demonstration disclosures.

3. **Dispatcher Interventions (`/interventions`)**
   - Human-in-the-loop operational decision support.
   - Inspect advisory recommendations (`REC-HOLD-0824`, `REC-RELIEF-1815`, `REC-FREQ-CROWD`).
   - Approve / Reject workflows with mandatory operational justification notes.
   - Safe local browser persistence with validation against corrupt records.

4. **Scenario Simulator (`/simulation`)**
   - Pure, deterministic simulation sandbox (no black-box AI).
   - Trailing bus holding slider (0s to 300s) evaluating projected separation and headway restoration.
   - Terminal standby relief deployment sandbox testing staged buses and on-shift drivers.
   - Crowding policy sandbox evaluating the 3-consecutive-stop frequency increase rule.

5. **Operational Reports & Audit Exports (`/reports`)**
   - Formal audit reports for End-of-Day, Morning Peak Replay, Evening Peak Replay, and Simulation comparison.
   - Tabular CSV downloads and structured JSON exports.
   - Print & PDF stylesheet optimization.

---

## 🛠️ Project Structure

```text
├── data/
│   └── demo/                     # Canonical 9-file synthetic dataset
│       ├── bus_positions.csv     # GPS telemetry
│       ├── crew_availability.csv # Driver shifts
│       ├── demo_assumptions.json # Operational thresholds
│       ├── passenger_loads.csv   # Boardings/alightings
│       ├── routes.csv            # Route definition
│       ├── scheduled_trips.csv   # Timetable slots
│       ├── stop_times.csv        # Schedule arrival/departures
│       ├── stops.csv             # Corridor stops
│       └── vehicles.csv          # Fleet records & capacities
├── docs/                         # Specification & architecture documents
│   ├── OPERATIONAL_DATASET_SPEC.md
│   └── PROJECT_SPEC.md
├── web/                          # Next.js web application
│   ├── app/                      # App router pages & components
│   ├── lib/                      # Backend engine & dataset access layer
│   └── scripts/                  # Automated verification & test suites
├── HOGANA_FINAL_RELEASE_REPORT.md# Complete test and verification audit
└── README.md
```

---

## 💻 Local Setup & Execution

### Prerequisites
- Node.js 18+ (tested on Node 20 / 22 / 26)
- npm or pnpm

### Installation
```bash
cd web
npm install
```

### Run Automated Test Suite
```bash
cd web
npm test
```
Runs 295 automated checks across 4 test suites:
- `npm run test:dataset`: Step 1 parser & schema validation (83 checks)
- `npm run test:engine`: Step 2 operational intelligence models (75 checks)
- `npm run test:step3`: Step 3 dashboard & data centre features (42 checks)
- `npm run test:integrated`: Steps 4, 5, 6 & hardening regression (95 checks)

### Start Development Server
```bash
cd web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
cd web
npm run build
npm start
```

---

## ☁️ Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project in Vercel (`https://vercel.com/new`).
3. Set **Root Directory** to `web`.
4. Framework Preset will automatically detect **Next.js**.
5. Click **Deploy**.

> **Note:** The Next.js configuration (`web/next.config.ts`) includes `outputFileTracingRoot` and `outputFileTracingIncludes`, ensuring the repository-level `data/demo/` dataset files are bundled in the serverless deployment.

---

## ⚠️ Demonstration Scope & Disclaimer

All operational data in this repository is synthetic demonstration data calibrated for the Silk Board ↔ Hebbal corridor on 10 March 2025. HOGANA is not connected to live BMTC dispatch, automated passenger counting (APC), or GPS systems. Holding and relief recommendations are advisory decision-support proposals.
