# HOGANA — Step 3: Dashboard + Data Centre
## Final Verification & Acceptance Report

**Date:** 2026-11-02  
**Corridor:** Silk Board ↔ Hebbal | Bengaluru (19.8 km Outer Ring Road)  
**Dataset Date:** 10 March 2025  
**Specification:** `docs/OPERATIONAL_DATASET_SPEC.md`  
**Approved Demonstration Dataset:** `data/demo/` (9 synthetic files)  
**Status:** **Step 3 Implementation Complete & Verified**

---

### 1. Implemented Pages & Features

#### A. Main Navigation & Application Identity
- **Application Identity:** **HOGANA — Smart Bus Operations & Mobility Intelligence**
- **Corridor Display:** **Silk Board ↔ Hebbal | Bengaluru**
- **Persistent Disclaimer:** **"Synthetic demonstration data — not connected to live BMTC systems."**
- **Dataset Date:** **10 March 2025**
- **Scoped Navigation:** Strictly limited to the two approved sections:
  1. **Dashboard** (`/dashboard`)
  2. **Data Centre** (`/data`)
- Root URL (`/`) automatically redirects to `/dashboard`. Unimplemented future phase routes (`/forecast`, `/interventions`, `/simulation`, `/reports`, `/admin/settings`) are excluded from navigation.

#### B. Dashboard (`/dashboard`)
- **Evaluation View Selector (§5.A):**
  1. **End-of-day audit:** Historical final-outcome baseline across all 86 planned corridor trips for 10 March 2025.
  2. **Morning replay:** As-of corridor evaluation at **08:24:00 (Morning Peak)**.
  3. **Evening replay:** As-of corridor evaluation at **18:15:00 (Evening Peak)**.
- **Strict Anti-Lookahead:** In replay modes, historical final outcomes and events occurring after $T_{\text{eval}}$ are strictly excluded.
- **KPI Overview Grid (§5.B):**
  - **86 Scheduled Trips** (43 UP / 43 DOWN) in denominator for all views.
  - **77 Operated Trips** in End-of-Day audit (**89.53% fulfilment rate**).
  - In replay mode, only **completed trips** are counted as fulfilled; **active in-progress trips** are clearly distinguished and never counted as completed.
  - **2 Cancelled Trips (2.33%)**: T-UP-008 (mechanical breakdown) and T-DN-033 (driver sickness).
  - **7 Resource Shortfall Trips (8.14%)**: Unserviced planned timetable slots.
  - **Combined Non-Operated Rate (10.47%)**.
  - **Replay Lifecycle Breakdown:** Active (in-progress), completed, scheduled (future), cancelled so far, and shortfall logged.
- **Operational Intelligence Modules (§5.C):**
  1. **Headway Regularity & Monitoring:**
     - Target peak: 12 min (720s); Target off-peak: 15 min (900s).
     - Key stop observations at Marathahalli UP, Silk Board UP, and Hebbal DOWN.
     - Irregularity Coefficient of Variation ($CV = \sigma/\mu$) using deterministic population standard deviation.
     - Corridor On-Time Performance (OTP) within $\pm 120\text{ s}$ tolerance (924 operated visits).
  2. **Bus Bunching & Dispatcher Holding:**
     - Evaluates detected arrival and dwelling separation bunching ($< 120\text{ s}$ threshold).
     - **Morning Demo (08:24:00 at Marathahalli UP):** Detects **75-second elapsed departure separation** between leading `BUS-06` (departed 08:22:45) and dwelling trailing `BUS-07` (arrived 08:23:45).
     - **Advisory Hold Recommendation:** Generates **300-second feasible hold** (capped by $300\text{ s}$ delay allowance), projecting a **375-second separation** with explicit **partial correction disclosure**.
     - **Advisory Disclaimer:** Clearly discloses that holding advice is decision-support only; manual dispatcher approval is required and automatic dispatch is prohibited.
  3. **Large Service Gaps & Standby Relief:**
     - Evaluates departure and arrival gaps ($> 1.5\times$ nominal scheduled interval).
     - **Evening Demo (18:15:00 at Hebbal DOWN):** Detects **1,440-second terminal departure gap** between `BUS-06` (T-DN-032, departed 17:36:00) and `BUS-07` (T-DN-034, departed 18:00:00), caused by cancelled slot `T-DN-033`.
     - **Advisory Relief Bus Recommendation:** Feasible deployment with standby `BUS-13` staged at Hebbal DOWN and standby driver `CREW-24` on Shift 2 $[14:00, 22:00)$.
     - **Advisory Disclaimer:** Deadhead transit travel time, depot clearance, and corridor traffic conditions are not modeled in this release.
  4. **Passenger Crowding & Capacity:**
     - Baseline: 60-passenger design capacity (40 seated + 20 standing, matching `vehicles.csv`).
     - 100% Warning Threshold: 60 passengers.
     - 150% Severe Threshold: 90 passengers (accurately labelled as **150% of capacity**, not 150% above capacity).
     - Peak occupancy observed: **153.3% (92 passengers on trip T-UP-006 at Kadubeesanahalli UP)**, derived strictly from `passenger_loads.csv`.
     - Severe Overcrowding Observations (Observed on or before evaluation timestamp, $\ge 150\%$ of capacity) with verified actual timestamps.
  5. **Fleet & Crew Availability:**
     - Total 13 synthetic demonstration vehicles: **9 active**, **2 standby** (BUS-12 @ Silk Board, BUS-13 @ Hebbal), **2 maintenance** (BUS-05 @ Hebbal, BUS-08 @ Silk Board; reason not recorded in dataset).
     - 24 synthetic driver shift records verified across start-inclusive, end-exclusive shift bounds $[start, end)$.

#### C. Data Centre (`/data`)
- **Dataset Overview Card (§6.A):**
  - Dataset metadata, 10 March 2025 date, Silk Board ↔ Hebbal corridor.
  - Validation status badge driven dynamically by `validationReport.valid`: displays green **Validation Passed (56 of 56 Checks Verified)** when valid, or rose **Validation Failed** with failure counts and disclosure banner when invalid.
  - 9 source files inventory with neutral descriptions and exact record counts.
  - Persistent synthetic demonstration data disclaimer.
- **Data Integrity & Validation Suite (§6.C):**
  - Complete Step 1 audit log: all 56 checks dynamically evaluated and rendered with actual `chk.passed` status (PASS in green or FAIL with alert styling in rose).
  - Explicit warning banner suppressing operational reliance if dataset validation fails.
- **Dataset Browsing Interface (§6.B):**
  - Interactive tabs for all 8 CSV files + `demo_assumptions.json`.
  - Column headers, row numbering, and data formatting.
  - Instant client-side search across all fields.
  - Direction quick filter (`ALL`, `UP`, `DOWN`) for directional entities.
  - Pagination (10, 25, 50, 100 rows per page) with record count indicators.
  - Structured visual cards and raw JSON viewer for `demo_assumptions.json`.
  - Read-only: no editing, mutation, or deletion controls.

---

### 2. Files Created and Modified

#### New Application Components & Pages
- [`web/app/dashboard/page.tsx`](file:///e:/HeadwayIQ/web/app/dashboard/page.tsx): Server Component pre-rendering all 3 evaluation views wrapped in `<Suspense>`.
- [`web/app/dashboard/DashboardClient.tsx`](file:///e:/HeadwayIQ/web/app/dashboard/DashboardClient.tsx): Interactive Client Component rendering evaluation tabs, KPI cards, headway table, bunching alert & hold advice, service gap & relief advice, crowding distribution, and fleet status.
- [`web/app/data/page.tsx`](file:///e:/HeadwayIQ/web/app/data/page.tsx): Server Component loading validated dataset records and Step 1 report.
- [`web/app/data/DataCentreClient.tsx`](file:///e:/HeadwayIQ/web/app/data/DataCentreClient.tsx): Interactive Client Component with 56-check validation audit, 8 CSV browsers with search/filter/pagination, and organized assumptions view.

#### New Server Services
- [`web/lib/engine/dashboard-service.ts`](file:///e:/HeadwayIQ/web/lib/engine/dashboard-service.ts): Server-only orchestration layer computing view models for End-of-Day, Morning Replay, and Evening Replay views.
- [`web/lib/dataset/data-centre-service.ts`](file:///e:/HeadwayIQ/web/lib/dataset/data-centre-service.ts): Server-only service providing validated dataset records and file summaries.

#### Modified Files
- [`web/app/components/AppShell.tsx`](file:///e:/HeadwayIQ/web/app/components/AppShell.tsx): Updated branding to **HOGANA**, added corridor badge, persistent synthetic disclaimer, dataset date, and restricted navigation to Dashboard and Data Centre.
- [`web/app/layout.tsx`](file:///e:/HeadwayIQ/web/app/layout.tsx): Updated title and description metadata.
- [`web/lib/dataset/data-access.ts`](file:///e:/HeadwayIQ/web/lib/dataset/data-access.ts): Added `getValidatedDataset()` to return both dataset records and validation results without redundant disk reads.
- [`web/package.json`](file:///e:/HeadwayIQ/web/package.json): Added `test:step3` script to automated verification suite.

#### Test Scripts
- [`web/scripts/test-step3.ts`](file:///e:/HeadwayIQ/web/scripts/test-step3.ts): 35-check automated verification suite for Dashboard and Data Centre services.
- [`web/scripts/run-test-step3.mjs`](file:///e:/HeadwayIQ/web/scripts/run-test-step3.mjs): Step 3 test runner using `jiti`.

---

### 3. Reused Dataset and Engine Functions

All frontend views strictly consume outputs from the existing validated dataset and Step 2 backend engine:
- `getValidatedDataset` & `getCompleteDataset`: Validated server-side dataset access.
- `calculateCorridorKpis`: Operational fulfilment, cancellation, and shortfall metrics.
- `calculateReplayCorridorStatus`: Replay lifecycle counts (completed, in-progress, scheduled, cancelled).
- `calculateObservedHeadways` & `calculateHeadwayCV`: Headway monitoring and population standard deviation CV.
- `detectStopArrivalBunching` & `evaluateHoldRecommendation`: Bus bunching detection and control point hold recommendation.
- `detectLargeGapsFromArrivals` & `detectTerminalDepartureGaps`: Large service gap detection.
- `evaluateReliefBusRecommendation`: Feasibility of standby relief bus deployment.
- `calculatePassengerOccupancy` & `detectCrowdingAlerts`: Occupancy rates and crowding alerts.
- `calculateOnTimePerformance`: Corridor OTP on-time, late, and early visit percentages.
- `getFleetInventory` & `getStandbyDriverAvailability`: Fleet counts and standby driver shift coverage.

---

### 4. Verification Suite Execution Results

| Test / Check Suite | Command | Total Checks | Result | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Dataset & Parser Tests** | `npm run test:dataset` | 83 | 83 passed, 0 failed | **PASS** |
| **Backend Engine Tests** | `npm run test:engine` | 75 | 75 passed, 0 failed | **PASS** |
| **Step 3 Dashboard & Data Tests** | `npm run test:step3` | 42 | 42 passed, 0 failed | **PASS** |
| **Combined Automated Tests** | `npm run test` | **200** | **200 passed, 0 failed** | **PASS** |
| **TypeScript Typecheck** | `npx tsc --noEmit` | — | 0 errors | **PASS** |
| **ESLint** | `npm run lint` | — | 0 warnings, 0 errors | **PASS** |
| **Next.js Production Build** | `npx next build --webpack` | — | 11 static routes prerendered | **PASS** |

---

### 5. Verification of Approved Demonstration Scenarios

1. **End-of-Day Audited Baseline Reconciled:**
   - 86 scheduled slots
   - 77 operated trips (**89.53% fulfilment rate**)
   - 2 cancelled trips (**2.33% cancellation rate**)
   - 7 resource shortfall trips (**8.14% shortfall rate**)
   - Combined non-operated rate: **10.47%**
2. **Morning Bus Bunching Demonstration ($T_{\text{eval}} = \text{08:24:00}$):**
   - Active at Marathahalli UP.
   - Detected elapsed departure separation: **75 seconds** between `BUS-06` (departed 08:22:45) and `BUS-07` (arrived 08:23:45, actively dwelling).
   - Feasible hold recommendation: **300 seconds** (capped by maximum delay allowance).
   - Projected post-hold separation: **375 seconds** with explicit **partial correction disclosure**.
3. **Evening Large Gap Demonstration ($T_{\text{eval}} = \text{18:15:00}$):**
   - Active at Hebbal DOWN.
   - Detected terminal departure gap: **1,440 seconds** (24 minutes) against 1,080s threshold, caused by cancelled slot `T-DN-033`.
   - Standby relief recommendation: **Feasible** with standby `BUS-13` staged at Hebbal DOWN and standby driver `CREW-24` on Shift 2.
4. **Strict Anti-Lookahead:**
   - Replay views strictly evaluate events confirmed on or before $T_{\text{eval}}$. Future events are excluded. In-progress trips are not counted as completed.

---

### 6. Confirmation of Non-Modification & Boundary Adherence

- The 9 approved synthetic dataset files in `data/demo/` were **NOT** modified.
- `docs/OPERATIONAL_DATASET_SPEC.md` was **NOT** modified.
- No external or fabricated BMTC data was introduced.
- Operational metrics are **NOT** calculated independently in frontend components.
- Step 4 (dispatcher intervention approvals and scenario simulator) has **NOT** been started.
