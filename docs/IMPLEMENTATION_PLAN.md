# Implementation Plan

## 1. High‑Level Staged Build Roadmap
| Stage | Goals | Key Deliverables | Approx. Duration |
|------|-------|------------------|------------------|
| **0 – Foundations** | Set up repo, tooling, CI, and basic project skeleton. | • Next.js + TypeScript template<br>• Tailwind CSS configuration<br>• Supabase project (local dev URL) and `supabase` CLI init<br>• GitHub Actions workflow for lint, type‑check, test | 1 week |
| **1 – Core Data & Backend** | Define data model, ingest synthetic demo data, build simple REST endpoints. | • PostgreSQL tables: `routes`, `buses`, `bus_runs`, `load_records`, `alerts`, `simulations`, `users`, `roles`<br>• Supabase auth (email/password) with RLS policies for Admin/Dispatcher/Analyst<br>• API routes (`/api/bus-points`, `/api/alerts`, `/api/forecast`, `/api/simulate`) returning JSON<br>• Basic unit tests for services | 2 weeks |
| **2 – Dashboard UI (Demo Mode)** | Build the operator control‑room view using static/simulated data streams. | • Map‑like component showing bus markers (mock positions generated on the server)
• Load gauges & headway gap charts (chart.js / recharts)
• Alert banner list
• Config panel showing illustrative assumptions with disclaimer badge
• Responsive layout (desktop ≥1024 px, tablet, mobile) | 3 weeks |
| **3 – Alert & Forecast Logic** | Implement detection algorithms and simple demand forecast model. | • Headway‑gap calculation service
• Over‑capacity detection using configurable % thresholds
• Time‑series forecast stub (moving‑average) with UI displaying confidence & assumptions
• UI tests for alert rendering and edge cases | 2 weeks |
| **4 – Intervention & Simulation Engine** | Add dispatcher‑approved recommendation workflow and scenario sandbox. | • Recommendation service that respects constraint inputs (available standby buses, driver limits)
• UI modal: propose actions → dispatcher approve/decline → log outcome
• Simulation page where user adjusts frequency, standby count, hold time → displays projected KPI charts
• Persist simulation runs for later reporting | 3 weeks |
| **5 – Outcome Tracking & Reporting** | Store before/after KPI snapshots and generate downloadable reports. | • `performance_snapshots` table linked to `simulations`
• Export to PDF/HTML using a server‑side rendering library (e.g., `puppeteer`)
• UI report viewer with download button
• End‑to‑end tests covering full flow | 2 weeks |
| **6 – Polish, Accessibility, and Deployment** | Refine UI, add accessibility tags, configure CI/CD to Supabase Edge Functions or Vercel. | • WCAG 2.1 AA audit checklist
• Environment variable handling for demo vs production mode
• Deploy pipeline (GitHub Actions → Vercel & Supabase) | 2 weeks |
| **Total** | **~15 weeks** (≈4 months) |  |  |

## 2. Page / Route List (Next.js App Router)
- `/login` – Supabase auth (email/password) – redirects based on role.
- `/dashboard` – Main control‑room (maps, charts, alerts).
- `/forecast` – Demand forecast view with assumptions panel.
- `/interventions` – List of recommended actions pending dispatcher approval.
- `/simulation` – Scenario builder and results chart.
- `/report/[id]` – Detailed before/after KPI report with download.
- `/admin/settings` – Manage illustrative assumptions, data sources, user roles.
- API routes under `app/api/` for the services mentioned above.

## 3. Proposed Architecture
```
Client (React/Next.js) <-> API Routes (Node.js) <-> Supabase (PostgreSQL + Auth)
```
- **Frontend**: React components using Tailwind, charts via Recharts (or Chart.js). State management with React Query for data fetching/caching.
- **Backend**: Server‑side API routes leverage Supabase client SDK for DB access. Heavy calculations (forecast, simulation) run in separate server‑side utility modules; could be off‑loaded to Supabase Edge Functions later.
- **Data Layer**: PostgreSQL schema (see below). Row‑level security enforces role‑based access.
- **Authentication**: Supabase Auth with JWT; role claim stored in `users.role`.
- **Deployment**: Frontend hosted on Vercel (or Supabase Edge Functions) with environment variables for demo vs production. DB hosted in Supabase (managed PostgreSQL).

## 4. High‑Level Database Entities
| Table | Primary Fields | Description |
|-------|----------------|-------------|
| `users` | `id`, `email`, `role` | Auth user and role (admin, dispatcher, analyst). |
| `routes` | `id`, `name`, `start_point`, `end_point` | Corridor metadata (e.g., Silk Board ↔ Hebbal). |
| `buses` | `id`, `route_id`, `capacity`, `status` | Bus registry, static attributes. |
| `bus_runs` | `id`, `bus_id`, `timestamp`, `lat`, `lon`, `estimated_load` | Simulated position & load records (time‑series). |
| `load_records` | `id`, `bus_run_id`, `passenger_count` | Detailed occupancy per run (optional). |
| `alerts` | `id`, `type` (bunching/crowding), `route_id`, `created_at`, `status` | Generated alerts; status = pending / acknowledged. |
| `forecast_results` | `id`, `route_id`, `forecast_json`, `generated_at` | Cached demand forecast curves. |
| `interventions` | `id`, `route_id`, `type`, `details_json`, `proposed_at`, `approved_by`, `status` | Recommendations awaiting dispatcher action. |
| `simulations` | `id`, `route_id`, `scenario_json`, `results_json`, `created_by`, `created_at` | What‑if runs stored for later reporting. |
| `performance_snapshots` | `id`, `simulation_id`, `kpi_json`, `timestamp` | Before/after KPI values for a given simulation. |
| `configurations` | `key`, `value`, `description` | Illustrative assumptions (fare revenue, capacity loss, pricing, etc.) – flagged as `illustrative = true`.

## 5. Testing Strategy
| Layer | Approach |
|-------|----------|
| **Unit** | Jest + ts‑jest for pure functions (forecast, alert detection, simulation calculations). |
| **Integration** | Supertest against API routes with a test Supabase project (using `supabase:reset` between runs). |
| **Component** | React Testing Library for UI components – verify rendering of alerts, disclaimer badges, responsive breakpoints. |
| **End‑to‑End** | Playwright tests covering login → dashboard → generate a simulation → download report. |
| **Performance** | Simple load test on the forecast endpoint (via k6) to ensure sub‑second responses for demo data. |
| **Accessibility** | axe‑core integration in CI to catch WCAG violations. |

## 6. Deployment Considerations
- **Demo vs Production mode**: Environment variable `NEXT_PUBLIC_DEMO=true` toggles a banner and forces the app to use synthetic data sources only.
- **Secrets**: Supabase URL & anon/service keys stored in Vercel/Edge Functions secrets; never committed.
- **Database migrations**: Use Supabase migration scripts (`supabase db push`) and keep them version‑controlled.
- **Static assets**: Tailwind CSS purged in production; SVG icons stored in `/public`.
- **Scalability**: For a real deployment, replace simulated data streams with a RabbitMQ/Kafka connector feeding live GPS; the API layer is already stateless.
- **Monitoring**: Enable Supabase logs and Vercel analytics; add health‑check endpoint `/api/health`.

---

## 7. Distinguishing Demo from Real Deployment
- **Banner** – The UI will always display a persistent banner in demo mode: *"Demo mode – data is simulated and illustrative assumptions are shown.*"
- **Configuration UI** – Analysts can upload CSV files; until real data is provided, the system falls back to the synthetic dataset located in `data/demo/`.
- **Documentation** – All generated reports will include a footer "Data source: simulated demo" unless a real source flag is set.
- **Feature Flags** – Live GPS integration, AI forecasting, and external BMTC APIs are behind feature flags that are **disabled** in the initial releases.

---

*No existing source files were missing beyond the concept PDF and the (currently absent) synthetic data folder. All assumptions listed are taken directly from the provided description and are marked as illustrative.*