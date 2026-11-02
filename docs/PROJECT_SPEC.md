# HeadwayIQ – Project Specification

## Purpose
HeadwayIQ is a **full‑stack web application** that gives bus operators and dispatchers actionable insight into **bus bunching** and **peak‑hour overcrowding** on Bengaluru’s public‑transport corridors. The system helps detect operational inefficiencies, forecast demand, propose feasible interventions, simulate outcomes, and track performance – all while clearly indicating that any data or assumptions are illustrative and not sourced from live BMTC records.

---

## Original Pain Points (as defined in the concept)
1. **Peak‑hour overcrowding** – infographic cites 150‑200 % over‑capacity (source‑pending).  
2. **Average‑day planning gap** – planning based on average demand misses route‑specific peaks.  
3. **Passenger pile‑up** caused by insufficient bus frequency.  
4. **Rigid static schedules** that do not adapt to changing demand.  
5. **Limited standby buses/drivers** to address sudden spikes.  
6. **Fixed supply vs. fluid demand** – dispatch lacks real‑time operational information.  
7. **Lack of accountability** for peak‑load performance, leading to uncomfortable and unsafe journeys.

---

## Scope (What we will build)
| Area | Included | Excluded |
|------|----------|----------|
| **Core functionality** | • Operator control‑room dashboard (live‑style bus positions, load indicators, headway gaps)\n• Bus‑bunching & crowding alerts\n• Demand forecasting (using historical/simulated data, with assumptions shown)\n• Dispatcher‑approved intervention recommendations (e.g., bus holding, relief‑bus deployment)\n• Scenario simulator (compare frequency/allocation changes)\n• Outcome tracking & before/after reporting | • Real‑time GPS feeds from BMTC (unless later integrated)\n• Live passenger‑occupancy sensors\n• Direct AI‑driven forecasting beyond the illustrative model\n• Ticket‑booking, shuttle‑marketplace, billing, or any unrelated commercial features |
| **User roles** | • **Operator / Dispatcher** – interacts with dashboard, receives alerts, reviews & approves recommendations, runs simulations.\n• **Analyst** – configures assumptions, reviews historical data & performance reports.\n• **Admin** – manages users, data sources, and system settings. | • Passenger‑facing mobile app for ticketing or route planning. |

---

## Core Features (derived from the provided concept)
1. **Control‑Room Dashboard** – map‑like view of routes (e.g., Silk Board ↔ Hebbal) with live‑style bus position markers, passenger‑load gauges, headway gap visualisation.
2. **Bus‑Bunching Alerts** – automatic detection when headways shrink below a configurable threshold.
3. **Crowding Alerts** – flagged when estimated load exceeds a configurable % of vehicle capacity.
4. **Demand Forecasting** – simple time‑series model on historic data; UI shows assumptions, confidence, and limitations.
5. **Intervention Recommendations** – algorithm suggests actions (hold, insert, re‑route) respecting constraints (available standby buses, driver limits). Dispatcher must manually approve.
6. **Scenario Simulator** – “what‑if” sandbox where users tweak frequency, fleet size, or holding policies and see projected load & headway impacts.
7. **Outcome Tracking** – store pre‑ and post‑intervention KPIs (average headway, load %, on‑time performance) for reporting.

---

## Non‑Goals (what we deliberately will **not** deliver in this phase)
* Real‑time integration with BMTC GPS or passenger‑count sensors.
* Commercial pricing negotiations; the Rs 1,200 / bus / month figure remains illustrative.
* Any functionality that directly handles fare collection, ticketing, or passenger‑facing journey planning.
* Integration with external transport‑planning tools beyond the scoped simulator.

---

## References
* HeadwayIQ concept PDF (provided by the product owner) – all figures marked *illustrative* must stay labelled as such.
* Bengaluru bus corridor example (Silk Board‑Hebbal) – used for demo data only.

---

*Prepared for the first development sprint. All listed assumptions are explicitly labeled as illustrative and will be configurable in the final product.*