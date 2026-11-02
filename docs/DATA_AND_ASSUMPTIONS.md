# Data and Assumptions

## Source Data Available
| Type | Description | Location |
|------|-------------|----------|
| **Concept PDF** | Original HeadwayIQ concept document (provided as a project reference) describing the Silk Board ↔ Hebbal demo corridor, pain points, high‑level feature list, and illustrative figures. | *(available offline – not stored in the repo)* |
| **Synthetic Demo Data** | Sample bus‑position time‑series, passenger‑load per trip, and schedule tables used for the UI demo. | *Not yet created – will be added in a future implementation step.* |
| **Historical Operational Data** | Placeholder for any future CSV/JSON files containing past bus runs, headways, occupancy counts. | Not yet provided. |
| **Configuration/Assumption Values** | Illustrative numbers (fare revenue, capacity loss, cost per bus‑hour, price per bus per month, etc.) referenced in the concept PDF. | Listed in the concept; will be stored in a config file (`config/defaults.ts`) once the app is built. |

## Known Illustrative Assumptions (must stay labelled as such)
- **Fare revenue:** Rs 14,000 per bus per day.
- **Capacity lost to bunching:** 25 % under fixed schedules, 8 % with dynamic dispatch.
- **Trips per hour:** (value from PDF – not explicitly given here, treat as placeholder).
- **Cost per bus‑hour:** (value from PDF – placeholder).
- **Revenue uplift from intervention:** 3 % fare‑revenue increase.
- **Pricing model for customers:** Rs 1,200 per bus per month; example of 1,000 subscribed buses.
- **Overcrowding figure:** 150‑200 % overcapacity (source‑pending).

All the above are **illustrative** – they will be stored as configurable defaults and displayed with a clear disclaimer in the UI.

## Data Not Yet Available
- Real‑time GPS traces for buses on the Silk Board‑Hebbal corridor.
- Actual passenger‑count sensor data (on‑board occupancy). 
- Verified BMTC operational statistics (fleet size, headway policies, cost structures).
- Historical demand data for Bengaluru bus routes.
- Any legally‑sourced public transport datasets.

## Proposed Inputs / Outputs
| Layer | Input (source) | Output (consumer) |
|-------|----------------|-------------------|
| **Ingestion** | Synthetic CSV/JSON files (bus runs, load per trip). | Normalised tables in Supabase (`bus_runs`, `load_records`). |
| **Forecasting** | Historical `bus_runs` + config assumptions. | Forecasted demand curves per corridor (JSON) displayed in charts. |
| **Alert Engine** | Real‑time (simulated) position stream, load estimates, config thresholds. | Alert objects stored in `alerts` table; UI badge & notification. |
| **Simulation** | User‑selected scenario parameters (frequency, standby buses, hold times). | Projected KPI tables (`sim_results`) and chart data. |
| **Reporting** | Pre‑ and post‑intervention KPI snapshots. | PDF/HTML report downloadable by dispatcher. |

## Data Provenance Rules (to be enforced in the app)
1. **Label every numeric value** – UI components must show a tooltip or badge stating *"Illustrative – not from BMTC"* for any assumption derived from the concept PDF.
2. **Source attribution** – when a dataset is uploaded by an analyst, store a `source` field (e.g., `"synthetic_demo"`, `"uploaded_csv"`).
3. **Read‑only for demo data** – the demo dataset shipped with the repo is immutable; any changes must be saved as a new version.
4. **No claim of live integration** – unless a live data connector is explicitly added later, the system shall display a banner *"Demo mode – data is simulated"* on the dashboard.
5. **Privacy / compliance** – any future real‑world data must be stored in Supabase with row‑level security tied to the authenticated user role.

---

*All unknown or missing files are noted as such; no assumptions have been invented beyond what the concept PDF explicitly states.*