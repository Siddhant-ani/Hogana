# HOGANA — Smart Bus Operations & Mobility Intelligence Platform

> **Bengaluru Outer Ring Road Corridor:** Silk Board ↔ Hebbal (19.8 km)  
> **Demonstration Baseline:** 10 March 2025  
> **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS, React  
> **Repository:** [https://github.com/Siddhant-ani/Hogana.git](https://github.com/Siddhant-ani/Hogana.git)

HOGANA is an enterprise-grade operational intelligence and decision-support web application for urban bus transit operations. Built on a canonical synthetic demonstration dataset calibrated for Bengaluru's Outer Ring Road, HOGANA demonstrates real-time corridor monitoring, automated bus bunching detection, service gap relief feasibility, passenger crowding analysis, human-in-the-loop dispatcher interventions, deterministic scenario simulation, and illustrative commuter survey research.

---

## 🚀 Key Modules & Capabilities

1. **Public Marketing Landing Page (`/`)**
   - High-impact value proposition: *"A bus can be tracked. A service gap needs to be managed."*
   - Interactive platform previews (Dashboard, Interventions, Simulation).
   - Reference corridor spotlight: Silk Board ↔ Hebbal (19.8 km, 24 stops, 86 slots, 13 buses).
   - 6-Week Structured Transit Agency Pilot Roadmap and FAQ.
   - Working Pilot Enquiry submission intake API (`/api/pilot-enquiry`).

2. **Operations Dashboard (`/dashboard`)**
   - Corridor-wide operational KPIs: 86 scheduled slots, 77 operated trips, cancellations, and resource shortfalls.
   - Headway regularity & On-Time Performance (OTP) tracking across key corridor stops.
   - Bus bunching detection with advisory holding recommendations.
   - Large service gap alerts with standby vehicle and crew relief feasibility analysis.
   - Passenger crowding monitoring against 60-passenger design capacity (40 seated + 20 standing).
   - Evaluation view switcher (End-of-Day Audit, Morning Peak 08:24 Replay, Evening Peak 18:15 Replay).

3. **Data Centre (`/data`)**
   - Automated 56-check dataset integrity and validation audit with granular pass/fail reporting.
   - Interactive data table browser for all canonical CSV datasets with search, pagination, and direction filtering.
   - **Commuter Insights Case Study**: Analyzes 10 core pain points, 88% peak commute ratio, 77% seat scarcity, and 100 individual illustrative commuter profiles.
   - Complete data provenance and synthetic demonstration disclosures.

4. **Dispatcher Interventions (`/interventions`)**
   - Human-in-the-loop operational decision support.
   - Inspect advisory recommendations (`REC-HOLD-0824`, `REC-RELIEF-1815`, `REC-FREQ-CROWD`).
   - Approve / Reject workflows with mandatory operational justification notes.
   - Safe local browser persistence with validation against corrupt records.

5. **Scenario Simulator (`/simulation`)**
   - Pure, deterministic simulation sandbox (no black-box AI).
   - Trailing bus holding slider (0s to 300s) evaluating projected separation and headway restoration.
   - Terminal standby relief deployment sandbox testing staged buses and on-shift drivers.
   - Crowding policy sandbox evaluating the 3-consecutive-stop frequency increase rule.

6. **Operational Reports & Audit Exports (`/reports`)**
   - Formal audit reports for End-of-Day, Morning Peak Replay, Evening Peak Replay, and Simulation comparison.
   - Tabular CSV downloads and structured JSON exports.
   - Print & PDF stylesheet optimization.

---

## 🎨 Design System & Palette

- **Primary Navy (`#12233F`)**: Typography headings, primary metrics, command bar & footer backgrounds.
- **Brand Teal (`#0F8278`)**: Primary CTA buttons, active state indicators, accent badges.
- **Soft Blue (`#EAF4F7`)**: Alternating section backgrounds, active nav pill fills.
- **Background (`#F5F7FA`)**: Canvas background across public landing page and internal operations routes.
- **Card Border (`#DCE5ED`)**: Clean, subtle card boundaries and table dividers.
- **Warning Amber (`#D97706`)**: Reserved exclusively for operational warnings (e.g. synthetic data banner, 100% capacity threshold).
- **Critical Red (`#DC2626`)**: Reserved exclusively for operational critical alerts (bunching violations `< 120s`, severe crowding `> 150%`).
- **White (`#FFFFFF`)**: Card surfaces, container surfaces, input backgrounds.

---

## 🛠️ Project Structure

```text
├── data/
│   ├── demo/                     # Canonical 9-file synthetic dataset
│   │   ├── bus_positions.csv     # GPS telemetry
│   │   ├── crew_availability.csv # Driver shifts
│   │   ├── demo_assumptions.json # Operational thresholds
│   │   ├── passenger_loads.csv   # Boardings/alightings
│   │   ├── routes.csv            # Route definition
│   │   ├── scheduled_trips.csv   # Timetable slots
│   │   ├── stop_times.csv        # Schedule arrival/departures
│   │   ├── stops.csv             # Corridor stops
│   │   └── vehicles.csv          # Fleet records & capacities
│   └── research/                 # Commuter experience research
│       ├── commuter_insights.json# 10 pain points, 100 profiles, distributions
│       └── pilot_enquiries.json  # Recorded pilot enquiry submissions
├── docs/                         # Specification & architecture documents
│   ├── OPERATIONAL_DATASET_SPEC.md
│   └── PROJECT_SPEC.md
├── web/                          # Next.js web application
│   ├── app/                      # App router pages & UI primitives
│   ├── lib/                      # Backend engine & dataset access layer
│   ├── scripts/                  # Automated verification & test suites
│   ├── tests/                    # Playwright end-to-end browser tests
│   └── playwright.config.ts      # Playwright test configuration
├── HOGANA_FINAL_RELEASE_REPORT.md# Complete test and verification audit
├── hogana-final-release.zip      # Canonical delivery archive
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

### Run Backend & Integration Test Suites
```bash
cd web
npm test
```
Runs 295 automated checks across 4 test suites:
- `npm run test:dataset`: Step 1 parser & schema validation (83 checks)
- `npm run test:engine`: Step 2 operational intelligence models (75 checks)
- `npm run test:step3`: Step 3 dashboard & data centre features (42 checks)
- `npm run test:integrated`: Steps 4, 5, 6 & hardening regression (95 checks)

### Run Playwright Browser E2E Tests
```bash
cd web
npm run test:e2e
```

### Start Development Server
```bash
cd web
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment (Vercel)

1. Connect your GitHub repository to Vercel.
2. In Project Settings, set **Root Directory** to `web`.
3. Build command: `next build --webpack`.
4. (Optional) Set `PILOT_ENQUIRY_WEBHOOK_URL` in Environment Variables to forward pilot enquiries to a Slack/Zapier webhook.
