# Operational Dataset Specification

> **Status:** Draft specification for human review — no data files, code or schema changes accompany this document.
> **Purpose:** Define every data file, field, calculation, alert rule, simulation input/output and demo‑data plan needed to build the HOGANA prototype end‑to‑end, so the implementation step that follows has an unambiguous, testable contract.

---

## 1. Data Files Required

Eight CSV files plus one JSON configuration file will be created in `data/demo/` during the next implementation step. **None of these files exist yet.**

All operational time windows throughout this specification are defined as **start‑inclusive and end‑exclusive**: $[T_{\text{start}}, T_{\text{end}})$.

### 1.1 `routes.csv` — Corridor Definitions

Each row represents an entire corridor with a single, unique `route_id`. Travel directions (`UP` and `DOWN`) are not duplicate corridor records; directionality is defined downstream in `stops.csv`, `scheduled_trips.csv`, and `bus_positions.csv`.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `route_id` | string | yes | slug, e.g. `silk-board-hebbal` | unique, non‑empty | Primary identifier for a corridor |
| `route_name` | string | yes | free text | non‑empty, ≤ 120 chars | Human‑readable corridor name |
| `origin_terminal` | string | yes | free text | non‑empty | Nominal origin landmark |
| `destination_terminal` | string | yes | free text | non‑empty | Nominal destination landmark |
| `total_distance_km` | number | yes | km, 1 decimal | > 0 | Approximate one‑way distance |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample row** *(illustrative — not real BMTC data)*:

```
route_id,route_name,origin_terminal,destination_terminal,total_distance_km,source_label
silk-board-hebbal,Silk Board ↔ Hebbal Corridor,Silk Board Junction,Hebbal Flyover,18.5,synthetic
```

### 1.2 `stops.csv` — Directional Stop Points

To support directional sequences and prevent ID collisions between outbound and inbound boarding points, each stop has a globally unique `stop_id` incorporating direction (e.g. `silk-board-up`, `silk-board-down`).

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `stop_id` | string | yes | slug, e.g. `silk-board-up` | unique across all records | Primary identifier for a directional stop point |
| `stop_name` | string | yes | free text | non‑empty, ≤ 100 chars | Human‑readable stop/landmark name |
| `route_id` | string | yes | FK → `routes.route_id` | must exist in `routes.csv` | Corridor this stop serves |
| `direction` | string | yes | `UP` or `DOWN` | must be `UP` or `DOWN` | Travel direction (`UP` = Silk Board → Hebbal; `DOWN` = Hebbal → Silk Board) |
| `sequence` | integer | yes | 1‑based integer | ≥ 1; unique per (`route_id`, `direction`) | Order of stop along the specified direction |
| `lat` | number | yes | decimal degrees | −90 to 90 | Approximate latitude (**synthetic landmark, not surveyed**) |
| `lon` | number | yes | decimal degrees | −180 to 180 | Approximate longitude (**synthetic landmark, not surveyed**) |
| `dist_from_origin_km` | number | yes | km, 1 decimal | ≥ 0, ≤ route `total_distance_km` | Distance from direction origin stop |
| `is_control_point` | boolean | yes | `true` or `false` | boolean | Whether this stop is suitable for holding interventions |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample rows** *(illustrative — coordinates are approximate, not official BMTC survey points)*:

```
stop_id,stop_name,route_id,direction,sequence,lat,lon,dist_from_origin_km,is_control_point,source_label
silk-board-up,Silk Board Junction,silk-board-hebbal,UP,1,12.9172,77.6230,0.0,true,synthetic
silk-board-down,Silk Board Junction,silk-board-hebbal,DOWN,12,12.9172,77.6230,18.5,false,synthetic
```

### 1.3 `scheduled_trips.csv` — Planned Timetable

**Timestamp Invariants:** For every record, `scheduled_departure` must exactly equal the `scheduled_departure` of stop sequence 1 in `stop_times.csv`, and `scheduled_arrival` must exactly equal the `scheduled_arrival` of the final stop sequence (12) in `stop_times.csv`. With a scheduled one-way travel duration of 55 minutes, $\text{scheduled\_arrival} = \text{scheduled\_departure} + 55\text{ minutes}$.

**Final-Outcome Model vs. Replay State:** `scheduled_trips.csv` explicitly stores the audited historical end-of-day outcome (`operated`, `cancelled`, or `resource_shortfall`), its explanatory reason, and the timestamp at which that outcome was recorded. This separates historical ground truth from real-time operational status during playback or live monitoring (which is derived dynamically at $T_{\text{eval}}$ under strict anti-lookahead rules; see §4.0).

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `trip_id` | string | yes | e.g. `T-UP-001` | unique, non‑empty | Primary identifier for a scheduled trip slot |
| `route_id` | string | yes | FK → `routes.route_id` | must exist in `routes.csv` | Corridor |
| `direction` | string | yes | `UP` or `DOWN` | must be `UP` or `DOWN` | Direction of this trip |
| `bus_id` | string | no | FK → `vehicles.bus_id` | must exist in `vehicles.csv` if present | Assigned vehicle (null for resource-shortfall trips where no vehicle is dispatched) |
| `scheduled_departure` | datetime | yes | ISO 8601 `YYYY-MM-DDTHH:mm:ss` | valid datetime | Planned departure from sequence 1 stop |
| `scheduled_arrival` | datetime | yes | ISO 8601 | = `scheduled_departure` + 55 min | Planned arrival at sequence 12 stop |
| `final_outcome` | string | yes | `operated` · `cancelled` · `resource_shortfall` | one of three values | Audited end-of-day operational outcome |
| `final_outcome_reason` | string | no | free text | present only when `final_outcome` $\in$ {`cancelled`, `resource_shortfall`} | Reason for trip cancellation or resource shortfall |
| `final_outcome_recorded_at` | datetime | no | ISO 8601 | present only when `final_outcome` $\in$ {`cancelled`, `resource_shortfall`} | Timestamp when outcome was officially logged (enforces anti-lookahead in replay) |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample rows** *(illustrative)*:

```
trip_id,route_id,direction,bus_id,scheduled_departure,scheduled_arrival,final_outcome,final_outcome_reason,final_outcome_recorded_at,source_label
T-UP-001,silk-board-hebbal,UP,BUS-01,2025-03-10T07:00:00,2025-03-10T07:55:00,operated,,,synthetic
T-UP-008,silk-board-hebbal,UP,BUS-08,2025-03-10T08:24:00,2025-03-10T09:19:00,cancelled,Mechanical defect before depot dispatch,2025-03-10T08:10:00,synthetic
T-UP-014,silk-board-hebbal,UP,BUS-03,2025-03-10T09:36:00,2025-03-10T10:31:00,operated,,,synthetic
T-UP-016,silk-board-hebbal,UP,,2025-03-10T10:00:00,2025-03-10T10:55:00,resource_shortfall,No active vehicle physically present at Silk Board terminal,2025-03-10T09:55:00,synthetic
T-DN-030,silk-board-hebbal,DOWN,BUS-04,2025-03-10T17:12:00,2025-03-10T18:07:00,operated,,,synthetic
T-DN-031,silk-board-hebbal,DOWN,,2025-03-10T17:24:00,2025-03-10T18:19:00,resource_shortfall,Synthetic allocation-priority shortfall (BUS-05 reserved for T-DN-033; not empty terminal),2025-03-10T17:09:00,synthetic
T-DN-033,silk-board-hebbal,DOWN,BUS-05,2025-03-10T17:48:00,2025-03-10T18:43:00,cancelled,Mechanical defect before terminal dispatch,2025-03-10T17:40:00,synthetic
T-DN-039,silk-board-hebbal,DOWN,BUS-02,2025-03-10T19:00:00,2025-03-10T19:55:00,operated,,,synthetic
```

**Resource-Shortfall Operational Distinction:**
Across the 86 planned timetable slots, exactly 7 trips have `final_outcome = resource_shortfall`, distinguishing two operational causes:
- **Physical Availability Shortfalls (6 trips):** Five morning peak UP trips (`T-UP-016` to `T-UP-020` from Silk Board at 10:00, 10:15, 10:30, 10:45, 11:00) and one evening peak DOWN trip (`T-DN-042` from Hebbal at 19:36:00). In these 6 slots, no active vehicle was physically ready or reachable at the departure terminal due to vehicle displacement and turnaround constraints.
- **Synthetic Reservation / Allocation-Priority Shortfall (1 trip — `T-DN-031`):** At Hebbal terminal at 17:24:00, `BUS-05` arrived at 17:10:00 on trip `T-UP-041` and, after 10 minutes of recovery, was **physically ready at 17:20:00**. In this synthetic dataset, the dispatcher reserves `BUS-05` for the later demonstration trip `T-DN-033` (scheduled departure 17:48:00) rather than assigning it to `T-DN-031` (17:24:00). `T-DN-031` is therefore a synthetic allocation-priority shortfall, **not** a case of an empty terminal or missing bus. The decision is logged prospectively at 17:09:00 (15 minutes before scheduled departure). The mechanical defect on `BUS-05` is discovered separately at 17:40:00 during pre-dispatch inspection for `T-DN-033`, leading to `T-DN-033`'s cancellation at 17:40:00.
*(Note: This reservation priority represents an illustrative prototype decision for scenario isolation, not an established BMTC dispatch policy).*

### 1.4 `stop_times.csv` — Per‑Stop Scheduled and Actual Event Times

**Consistency Rule for Non-Operating Trips (Cancellations & Resource Shortfalls):** For all 9 non-operating scheduled trips (2 cancelled trips `T-UP-008` and `T-DN-033`, plus 7 resource-shortfall trips: 6 physical availability shortfalls `T-UP-016` to `T-UP-020` and `T-DN-042`, plus 1 synthetic allocation-priority shortfall `T-DN-031`), their planned timetable departure and arrival slots are **retained** in `stop_times.csv` across all 12 stops ($9 \times 12 = 108\text{ rows}$). The `scheduled_arrival` and `scheduled_departure` timestamps are fully populated, while `actual_arrival` and `actual_departure` are explicitly `null`. This guarantees that nominal scheduled headway calculations retain the planned dispatch grid without missing slots.

**Late-Operated Trips:** The three trips departing 1 minute late due to peak vehicle rotation turnarounds (`T-UP-014`, `T-UP-015`, and `T-DN-043`) have full stop-time records with sequence 1 `actual_departure` recorded 1 minute after schedule (e.g. 09:37:00 for `T-UP-014`, 09:49:00 for `T-UP-015`, and 19:49:00 for `T-DN-043`) and sequence 12 `actual_arrival` recorded 55 minutes later (e.g. 10:32:00 for `T-UP-014`, 10:44:00 for `T-UP-015`, and 20:44:00 for `T-DN-043`), with all actual intermediate stop times recorded.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `trip_id` | string | yes | FK → `scheduled_trips.trip_id` | must exist | Parent scheduled trip |
| `stop_id` | string | yes | FK → `stops.stop_id` | must exist; direction must match trip | Stop visited |
| `stop_sequence` | integer | yes | 1‑based integer | matches `stops.sequence` | Order within the trip |
| `scheduled_arrival` | datetime | yes | ISO 8601 | — | Planned arrival time at this stop |
| `actual_arrival` | datetime | no | ISO 8601 | valid datetime if present; null for non-operating trips | Observed arrival time (null if missing, dwelling, cancelled, or resource shortfall) |
| `scheduled_departure` | datetime | yes | ISO 8601 | ≥ `scheduled_arrival` | Planned departure slot from this stop |
| `actual_departure` | datetime | no | ISO 8601 | if present, ≥ `actual_arrival`; null for non-operating trips | Observed departure time (null if dwelling, missing, cancelled, or resource shortfall) |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample rows** *(illustrative)*:

```
trip_id,stop_id,stop_sequence,scheduled_arrival,actual_arrival,scheduled_departure,actual_departure,source_label
T-UP-001,silk-board-up,1,2025-03-10T06:58:00,2025-03-10T06:58:15,2025-03-10T07:00:00,2025-03-10T07:00:30,synthetic
T-UP-001,hebbal-up,12,2025-03-10T07:55:00,2025-03-10T07:55:30,2025-03-10T07:55:00,2025-03-10T07:55:30,synthetic
T-UP-014,silk-board-up,1,2025-03-10T09:34:00,2025-03-10T09:35:00,2025-03-10T09:36:00,2025-03-10T09:37:00,synthetic
T-UP-014,hebbal-up,12,2025-03-10T10:31:00,2025-03-10T10:32:00,2025-03-10T10:31:00,2025-03-10T10:32:00,synthetic
T-UP-016,silk-board-up,1,2025-03-10T09:58:00,,2025-03-10T10:00:00,,synthetic
T-UP-016,hebbal-up,12,2025-03-10T10:55:00,,2025-03-10T10:55:00,,synthetic
T-DN-033,hebbal-down,1,2025-03-10T17:46:00,,2025-03-10T17:48:00,,synthetic
T-DN-033,silk-board-down,12,2025-03-10T18:43:00,,2025-03-10T18:43:00,,synthetic
```

### 1.5 `bus_positions.csv` — Vehicle Position Time‑Series Telemetry

Provides periodic simulated GPS coordinates for real‑time style map visualization and corridor tracking on the operator dashboard. **Non-operating trips (2 cancelled trips and 7 resource-shortfall trips) produce zero records in `bus_positions.csv`.**

#### Endpoint Sampling & Record Count Definition:
Position records are generated at a 60-second sampling cadence:
- Sampling commences at `actual_departure` from stop sequence 1 ($k = 0$).
- A periodic record is output every 60 seconds thereafter ($k = 1, 2, \dots$) until the vehicle arrives at stop sequence 12 ($k = M$), where a final stop-arrival observation is recorded.
- **Handling Non-Multiple Arrival Times:** If an actual elapsed trip duration is not an exact multiple of 60 seconds (i.e. $t_{\text{arr}} = t_0 + M \times 60\text{ s} + \delta t$, with $0 < \delta t < 60\text{ s}$), the final stop-arrival record is captured at $t_{\text{arr}}$ as a designated terminal arrival event with $\text{speed\_kmh} = 0$. In the synthetic demonstration dataset, to maintain deterministic counts and avoid fractional-cadence duplicates, every trip's actual travel duration is calibrated to an integer number of minutes ($\delta t = 0$), guaranteeing that an elapsed duration of $D$ minutes produces exactly $D + 1$ position observations.
- **55-Minute Travel Duration Count (61 Trips):** Exactly 61 operated trips have a standard 55-minute elapsed travel duration (including the three late-operated trips `T-UP-014`, `T-UP-015`, and `T-DN-043`, which depart 1 minute late and travel 55 minutes). Each generates exactly $55 + 1 = 56$ position records:
  $$61\text{ trips} \times 56\text{ records} = \mathbf{3,416\text{ position records}}.$$
- **Deterministic Delays for 16 Congested Peak Trips:** Exactly 16 peak trips incur deterministic traffic delays between 2 and 6 minutes, summing to **exactly 64 minutes** of additional travel time (+64 records):
  - Morning Peak UP (8 trips, summing to 32 min): `T-UP-002` (+2 min, 57 min elapsed, 58 records), `T-UP-003` (+3 min, 58 min, 59 records), `T-UP-004` (+3 min, 58 min, 59 records), `T-UP-005` (+4 min, 59 min, 60 records), `T-UP-006` (+4 min, 59 min, 60 records), `T-UP-007` (+5 min, 60 min, 61 records), `T-UP-009` (+5 min, 60 min, 61 records), `T-UP-010` (+6 min, 61 min, 62 records). (Subtotal: $8 \times 56 + 32 = 480\text{ records}$).
  - Evening Peak DOWN (8 trips, summing to 32 min): `T-DN-030` (+2 min, 57 min, 58 records), `T-DN-032` (+3 min, 58 min, 59 records), `T-DN-034` (+4 min, 59 min, 60 records), `T-DN-035` (+4 min, 59 min, 60 records), `T-DN-036` (+5 min, 60 min, 61 records), `T-DN-037` (+5 min, 60 min, 61 records), `T-DN-038` (+6 min, 61 min, 62 records), `T-DN-039` (+3 min, 58 min, 59 records). (Subtotal: $8 \times 56 + 32 = 480\text{ records}$).
  - Combined subtotal for 16 delayed trips: $480 + 480 = (16 \times 56) + 64 = 896 + 64 = \mathbf{960\text{ records}}$.
- **Exact Total Telemetry Count:** 
  $$\text{Total Records} = (61 \times 56) + (16 \times 56 + 64) = 3{,}416 + 960 = \mathbf{4,376\text{ position records}}.$$
- **Exact Minimum On-Time Baseline Count (if all 77 operated trips were on-time with zero delay):** $77 \times 56 = \mathbf{4,312\text{ records}}$.
- **Non-Operating Trips:** The 2 cancelled trips (`T-UP-008`, `T-DN-033`) and 7 resource-shortfall trips (`T-UP-016` to `T-UP-020`, `T-DN-031`, `T-DN-042`) produce **0 records**.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `position_id` | string | yes | slug / UUID, e.g. `POS-0001` | unique, non‑empty | Primary identifier for position observation |
| `bus_id` | string | yes | FK → `vehicles.bus_id` | must exist in `vehicles.csv` | Observed bus |
| `trip_id` | string | yes | FK → `scheduled_trips.trip_id` | must exist in `scheduled_trips.csv` | Operating trip associated with this position |
| `route_id` | string | yes | FK → `routes.route_id` | must exist in `routes.csv` | Corridor |
| `direction` | string | yes | `UP` or `DOWN` | matches `scheduled_trips.direction` | Direction of travel |
| `timestamp` | datetime | yes | ISO 8601 `YYYY-MM-DDTHH:mm:ss` | valid datetime | Timestamp of observation |
| `latitude` | number | yes | decimal degrees | −90 to 90 | Simulated latitude (**synthetic, not live GPS**) |
| `longitude` | number | yes | decimal degrees | −180 to 180 | Simulated longitude (**synthetic, not live GPS**) |
| `speed_kmh` | number | no | km/h, 1 decimal | ≥ 0 | Estimated instantaneous speed (0 when dwelling) |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample row** *(illustrative — synthetic coordinates)*:

```
position_id,bus_id,trip_id,route_id,direction,timestamp,latitude,longitude,speed_kmh,source_label
POS-0001,BUS-01,T-UP-001,silk-board-hebbal,UP,2025-03-10T07:15:00,12.9345,77.6288,24.5,synthetic
```

#### Selected‑Time Dashboard Join Logic:
When an operator views the dashboard at evaluation timestamp $T_{\text{eval}}$ (or during playback):
1. **Derive Replay State**: Filter to operating trips where derived $\text{status}(T_{\text{eval}}) = \text{in\_progress}$ (see §4.0). Trips with status `scheduled`, `completed`, `cancelled`, `resource_shortfall`, or `unknown` are handled accordingly.
2. **Locate Bus**: For each in-progress trip, select the position record with the latest $\text{timestamp} \le T_{\text{eval}}$. If no position exists within 5 minutes prior to $T_{\text{eval}}$, display a "Signal lost / stale position" badge.
3. **Join Passenger Load & Occupancy (Anti-Lookahead Timing Rule)**:
   - `onboard_after` strictly represents the passenger count remaining onboard as a bus **departs** a stop (after boardings and alightings have completed).
   - **En-Route Bus:** For an in-progress bus traveling between stops (where the latest visited stop $s$ has a confirmed departure $\text{actual\_departure}(s) \le T_{\text{eval}}$), retrieve `onboard_after` for stop $s$. Compute $\text{occupancy\_pct} = (\text{onboard\_after}(s) / \text{capacity\_total}) \times 100$.
   - **Dwelling Bus:** If the bus is currently dwelling at stop $S_{\text{curr}}$ ($\text{actual\_arrival}(S_{\text{curr}}) \le T_{\text{eval}}$ and departure has not yet occurred: $\text{actual\_departure}$ is null or $> T_{\text{eval}}$):
     - The passenger exchange is actively in progress. To prevent lookahead, `onboard_after(S_{\text{curr}})` must **not** be displayed as confirmed load until departure occurs.
     - The dashboard displays the confirmed load upon arrival—which equals the previous stop's departing load $\text{onboard\_after}(S_{\text{curr}}-1)$ (or stop 1 initial boardings if at stop 1)—accompanied by a visual status pill: *"Dwelling at [stop_name] (boarding/alighting in progress)"*.
4. **Fallback & Data Guards**:
   - If a trip's `scheduled_departure` has passed but actual departure from stop 1 is unrecorded or null: operational status is `unknown` (`insufficient_data`); display *"Departure unconfirmed / Missing event data"*. Do NOT infer movement or trigger recommendations.
   - If load records are missing or null for an in-progress trip: display *"Load data unavailable"*.

### 1.6 `passenger_loads.csv` — Boardings, Alightings, and Onboard Occupancy

**Consistency Rule for Non-Operating Trips (Cancellations & Resource Shortfalls):** Non-operating trips (2 cancelled trips and 7 resource-shortfall trips) produce **zero** records in `passenger_loads.csv`. Records exist exclusively for the **77 operated trips** across their 12 stop-visits ($77 \times 12 = \mathbf{924\text{ load rows}}$). Unknown load observations are preserved as explicit `null` values; missing measurements are never converted to zero.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `trip_id` | string | yes | FK → `scheduled_trips.trip_id` | must exist | Parent operating trip |
| `stop_id` | string | yes | FK → `stops.stop_id` | must exist | Directional stop where count is recorded |
| `stop_sequence` | integer | yes | 1‑based integer | matches `stops.sequence` | Sequence within trip |
| `boardings` | integer | no | count | ≥ 0 or null | Passengers boarding at this stop |
| `alightings` | integer | no | count | ≥ 0 or null | Passengers alighting at this stop |
| `onboard_after` | integer | no | count | ≥ 0 or null; should equal previous `onboard_after` + `boardings` − `alightings` if all present | Passengers remaining onboard departing this stop |
| `measurement_method` | string | yes | `synthetic_estimate` | — | Estimation methodology |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample row** *(illustrative)*:

```
trip_id,stop_id,stop_sequence,boardings,alightings,onboard_after,measurement_method,source_label
T-UP-001,silk-board-up,1,32,0,32,synthetic_estimate,synthetic
```

### 1.7 `vehicles.csv` — Vehicle Registry & Staging Locations

To sustain the 12-minute peak headway with a 130-minute round-trip cycle time without overlapping assignments, the active fleet consists of **11 buses** (`BUS-01` to `BUS-11`), supported by **2 standby buses** (`BUS-12`, `BUS-13`), giving 13 total vehicles.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `bus_id` | string | yes | e.g. `BUS-01` | unique, non‑empty | Primary vehicle identifier |
| `registration` | string | no | free text | — | Synthetic registration plate |
| `capacity_seated` | integer | yes | count | > 0 | Seated capacity (default assumption: 40) |
| `capacity_standing` | integer | yes | count | ≥ 0 | Standing capacity (default assumption: 20) |
| `capacity_total` | integer | yes | count | = `capacity_seated` + `capacity_standing` | Total design capacity (default assumption: 60) |
| `current_location_stop_id` | string | yes | FK → `stops.stop_id` | must exist in `stops.csv` | Current staged depot or terminal location |
| `status` | string | yes | `active` · `standby` · `maintenance` | one of three values | Vehicle operational availability |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample rows** *(illustrative)*:

```
bus_id,registration,capacity_seated,capacity_standing,capacity_total,current_location_stop_id,status,source_label
BUS-01,KA-01-F-1001,40,20,60,silk-board-up,active,synthetic
BUS-11,KA-01-F-1011,40,20,60,silk-board-up,active,synthetic
BUS-12,KA-01-F-2001,40,20,60,silk-board-up,standby,synthetic
BUS-13,KA-01-F-2002,40,20,60,hebbal-down,standby,synthetic
```

### 1.8 `crew_availability.csv` — Crew Roster

**Shift Boundary Convention:** Crew shifts are strictly defined as **start‑inclusive and end‑exclusive**: $[T_{\text{shift\_start}}, T_{\text{shift\_end}})$.
- **Shift 1 (Morning):** $[06:00, 14:00)$
- **Shift 2 (Evening):** $[14:00, 22:00)$
- **Handover Rule:** At the exact boundary $14:00:00$, the Shift 2 crew member is on duty; the Shift 1 crew member has completed their shift. A crew member is never counted on shift in both adjacent shifts simultaneously.
- Total roster consists of **24 drivers** (`CREW-01` to `CREW-24`): 12 drivers per shift (11 active + 1 standby).

**Boundary-Crossing Trips & Crew Handover Limitation:**
- Certain scheduled trips cross the $14:00:00$ shift boundary while en route (notably `T-DN-015`, departing Hebbal at 13:30:00 and scheduled to arrive at Silk Board at 14:25:00).
- In real-world bus transport, transit agencies accommodate boundary runs either by scheduling an en-route driver changeover at an intermediate relief stop or by having the commencing driver complete the one-way trip to the terminal depot before clocking off.
- In this prototype:
  - **Actual mid-route driver changeovers, step-on/step-off relief events, and in-transit crew swap telemetry are outside the prototype's operational data model.** The prototype does **NOT claim verified in-transit crew handovers**. The driver who commences the trip is assumed to operate the vehicle through to its scheduled destination terminal to safely conclude the service.
  - The start-inclusive, end-exclusive shift rule ($[06:00, 14:00)$ and $[14:00, 22:00)$) is strictly enforced for evaluating **standby relief driver eligibility**: at evaluation time $T_{\text{deploy}}$, the standby driver must satisfy $\text{shift\_start} \le T_{\text{deploy}} < \text{shift\_end}$ (e.g. at 18:15:00, `CREW-24` on Shift 2 is on duty and available for standby dispatch; Shift 1 drivers are strictly off duty). No additional drivers, vehicles, or operational facts are invented.

| Field | Type | Required | Units / Format | Validation | Meaning |
|-------|------|----------|----------------|------------|---------|
| `crew_id` | string | yes | e.g. `CREW-01` | unique, non‑empty | Primary crew identifier |
| `role` | string | yes | `driver` · `conductor` | one of two values | Crew function |
| `shift_start` | time | yes | `HH:mm` | valid 24‑hour time | Shift commencement (inclusive) |
| `shift_end` | time | yes | `HH:mm` | valid 24‑hour time | Shift termination (exclusive) |
| `assigned_bus_id` | string | no | FK → `vehicles.bus_id` | must exist if present | Assigned vehicle (null = standby/unassigned) |
| `status` | string | yes | `on_duty` · `off_duty` · `standby` | one of three values | Operational availability |
| `source_label` | string | yes | `synthetic` | — | Data provenance tag |

**Sample rows** *(illustrative)*:

```
crew_id,role,shift_start,shift_end,assigned_bus_id,status,source_label
CREW-01,driver,06:00,14:00,BUS-01,on_duty,synthetic
CREW-12,driver,06:00,14:00,,standby,synthetic
CREW-13,driver,14:00,22:00,BUS-01,on_duty,synthetic
CREW-24,driver,14:00,22:00,,standby,synthetic
```

### 1.9 `demo_assumptions.json` — Configurable Illustrative Defaults

```jsonc
{
  "_provenance": "All values are illustrative assumptions from the HeadwayIQ concept PDF. None are verified BMTC data.",

  "time_window_rules": {
    "interval_convention": "start-inclusive, end-exclusive: [T_start, T_end)",
    "departure_formula": "ceil((T_end - T_start) / frequency_minutes)"
  },

  "headway": {
    "nominal_peak_headway_seconds": 720,
    "nominal_peak_headway_note": "Nominal scheduled service headway (720 seconds = 12 minutes) during peak periods across all scheduled departure slots.",
    "nominal_offpeak_headway_seconds": 900,
    "nominal_offpeak_headway_note": "Nominal scheduled service headway (900 seconds = 15 minutes) during off-peak periods.",
    "bunching_threshold_seconds": 120,
    "bunching_threshold_note": "Configurable default — no official BMTC source. Two consecutive operating buses at the same stop and direction within this interval trigger a bunching alert.",
    "large_gap_multiplier": 1.5,
    "large_gap_note": "A headway exceeding (nominal_scheduled_headway × this multiplier) is flagged as a large gap."
  },

  "crowding": {
    "overcrowding_pct": 100,
    "overcrowding_note": "Percentage of vehicle capacity_total above which a warning crowding alert fires (100% = passenger load equals total vehicle design capacity).",
    "severe_overcrowding_pct": 150,
    "severe_overcrowding_note": "Occupancy at 150% of configured capacity (e.g. 90 passengers on a 60-passenger capacity bus). Derived from the infographic's source-pending 150%-200% overcapacity claim. It represents 1.5× design capacity, not 150% above capacity (which would be 250% load), and is an illustrative threshold, not an independently verified BMTC statistic."
  },

  "dispatch_control": {
    "max_delay_tolerance_seconds": 300,
    "max_delay_note": "Maximum cumulative delay permitted on a bus before hold recommendations are rejected or capped.",
    "min_viable_hold_seconds": 30,
    "min_viable_hold_note": "Minimum hold duration worth issuing to a driver.",
    "geofence_dwelling_radius_meters": 100,
    "telemetry_freshness_seconds": 60
  },

  "simulator_defaults": {
    "baseline_cycle_time_minutes": 130,
    "cycle_time_note": "Illustrative round-trip cycle time assumption (55 min outbound + 10 min recovery at Hebbal + 55 min inbound + 10 min recovery at Silk Board = 130 min) for Silk Board ↔ Hebbal. Used to estimate physical fleet requirements."
  },

  "financial": {
    "fare_revenue_per_bus_per_day_inr": 14000,
    "fare_revenue_note": "Illustrative assumption from HeadwayIQ concept PDF — not verified BMTC data.",
    "capacity_loss_fixed_schedule_pct": 25,
    "capacity_loss_dynamic_dispatch_pct": 8,
    "capacity_loss_note": "Illustrative assumptions, not measured results.",
    "revenue_uplift_pct": 3,
    "revenue_uplift_note": "Illustrative assumption — not a validated outcome.",
    "cost_per_bus_hour_inr": null,
    "cost_per_bus_hour_note": "Placeholder — exact value not available from the concept PDF.",
    "trips_per_hour": null,
    "trips_per_hour_note": "Placeholder — exact value not available from the concept PDF."
  },

  "pricing": {
    "price_per_bus_per_month_inr": 1200,
    "price_note": "Proposed commercial assumption, not a validated customer price.",
    "example_fleet_size": 1000,
    "example_fleet_note": "Arithmetic example based on the price assumption (1,000 buses × Rs 1,200 = Rs 12,00,000/month), not a customer commitment or revenue forecast."
  }
}
```

---

## 2. Data Model and Relationships

### 2.1 Entity‑Relationship Summary

```
routes  1──*  stops             (route_id)
routes  1──*  scheduled_trips   (route_id)
routes  1──*  bus_positions     (route_id)
stops   1──*  stop_times        (stop_id)
stops   1──*  passenger_loads   (stop_id)
stops   1──?  vehicles          (stop_id → current_location_stop_id)
scheduled_trips 1──* stop_times       (trip_id) [all 86 scheduled trips; 2 cancelled and 7 resource-shortfall trips have null actuals]
scheduled_trips 1──* passenger_loads  (trip_id) [77 operated trips; 2 cancelled and 7 resource-shortfall trips have no rows]
scheduled_trips 1──* bus_positions    (trip_id) [77 operated trips; 2 cancelled and 7 resource-shortfall trips have no rows]
vehicles 1──* scheduled_trips   (bus_id, nullable for resource-shortfall trips)
vehicles 1──* bus_positions     (bus_id)
vehicles 1──? crew_availability (bus_id → assigned_bus_id, optional)
```

### 2.2 Key Linking Fields

| FK field | Source file | Target file.field | Cardinality |
|----------|------------|-------------------|-------------|
| `route_id` | `stops`, `scheduled_trips`, `bus_positions` | `routes.route_id` | many → one |
| `stop_id` | `stop_times`, `passenger_loads` | `stops.stop_id` | many → one |
| `current_location_stop_id` | `vehicles` | `stops.stop_id` | many → one |
| `trip_id` | `stop_times`, `passenger_loads`, `bus_positions` | `scheduled_trips.trip_id` | many → one |
| `bus_id` | `scheduled_trips` (nullable), `bus_positions` | `vehicles.bus_id` | many → one |
| `assigned_bus_id` | `crew_availability` | `vehicles.bus_id` | many → one (nullable) |

### 2.3 Handling Edge Cases

| Situation | Rule |
|-----------|------|
| **Missing `actual_arrival` / `actual_departure`** | Leave null. Calculations that require actuals skip the record and log "insufficient data". |
| **Missing `boardings` / `alightings` / `onboard_after`** | Leave null. Dashboard and alerts report "Load data unavailable" for that stop‑visit. Missing measurements are never converted to zero. |
| **Duplicate primary keys** | Reject on ingest; log a validation error. The demo generator must guarantee uniqueness across all IDs. |
| **Orphan foreign keys** | Reject on ingest (e.g. a `bus_positions` or `stop_times` row referencing a non‑existent `trip_id`). |
| **Out‑of‑order timestamps** | `actual_arrival` at stop $n$ must be $\le$ `actual_departure` at stop $n$ $\le$ `actual_arrival` at stop $n+1$. Violations log a data‑quality warning; the record is excluded from headway calculations. |
| **Cancelled trips** | `final_outcome = cancelled` in `scheduled_trips`. Scheduled departure and arrival slots are **retained** in `stop_times.csv` with null actuals ($2 \times 12 = 24\text{ rows}$). No rows are created in `passenger_loads.csv` or `bus_positions.csv`. Cancelled trips count towards the cancellation‑rate KPI. |
| **Resource-shortfall trips** | `final_outcome = resource_shortfall` in `scheduled_trips`. Scheduled departure and arrival slots are **retained** in `stop_times.csv` with null actuals ($7 \times 12 = 84\text{ rows}$). `bus_id` is null (no vehicle dispatched). No rows are created in `passenger_loads.csv` or `bus_positions.csv`. Resource-shortfall trips count towards the resource-shortfall rate KPI and reduce the operated-trip fulfillment rate. |
| **Unknown passenger load** | If all three passenger‑count fields are null for a stop‑visit, the system displays "Load data unavailable" rather than assuming zero. |
| **Stale GPS Telemetry** | If the latest `bus_positions` row for a trip is older than 5 minutes relative to $T_{\text{eval}}$, show a "Stale GPS" indicator and do not extrapolate positions. |

---

## 3. Calculation Definitions

All headway and interval calculations are maintained **in seconds internally**. All threshold values below are configurable defaults stored in `demo_assumptions.json` and marked as assumptions unless a verified official source is cited.

### 3.1 Observed Headway (seconds)

**Definition:** The time interval between two consecutive operating, non‑cancelled buses serving the same directional stop in the same travel direction.

$$\text{headway}(\text{stop\_id}, \text{bus}_n, \text{bus}_{n+1}) = \text{actual\_arrival}(\text{bus}_{n+1}, \text{stop\_id}) - \text{actual\_arrival}(\text{bus}_n, \text{stop\_id})$$

- Where $\text{bus}_n$ is the leading vehicle and $\text{bus}_{n+1}$ is the trailing vehicle immediately behind it, ordered by `actual_arrival` at that directional `stop_id`.
- If `actual_arrival` is null for either bus, headway is **undefined** for that pair.
- Cancelled trips produce no actual arrival events and are never used as $\text{bus}_n$ or $\text{bus}_{n+1}$.
- The first trip of the service day at a stop has no preceding bus; headway is null.
- Unit: seconds (integer).

### 3.2 Nominal Scheduled Service Interval (seconds)

**Definition:** The planned service interval between adjacent scheduled departure slots at the same directional stop, defined by the original scheduled timetable across all 86 planned trips (`final_outcome` $\in$ {`operated`, `cancelled`, `resource_shortfall`}):

$$H_{\text{sched\_nominal}}(\text{stop\_id}, \text{direction}, k) = \text{scheduled\_departure}(\text{slot}_{k+1}, \text{stop\_id}) - \text{scheduled\_departure}(\text{slot}_k, \text{stop\_id})$$

- For the Silk Board ↔ Hebbal peak demo, the nominal scheduled service interval is uniformly $720\text{ seconds}$ (12 minutes); off-peak is $900\text{ seconds}$ (15 minutes).
- **Critical Retained-Slot Consistency Rule:** When an intervening scheduled trip is cancelled or dropped due to resource shortfall, that unserved trip slot is **retained** in `stop_times.csv`. The target service interval must **never** be calculated solely from surviving observed buses (which would erroneously double or multiply the expected interval and mask the gap).

### 3.3 Headway Irregularity (Coefficient of Variation)

$$\text{headway\_cv}(\text{stop\_id}, \text{time\_window}) = \frac{\sigma(\text{headways in window})}{\mu(\text{headways in window})}$$

- Evaluated over a start-inclusive, end-exclusive window $[T_{\text{start}}, T_{\text{end}})$ (default: 60 minutes).
- A perfectly regular service has $CV = 0$. Higher $CV$ values indicate severe irregular spacing and bunching risk.
- Requires $\ge 2$ observed headways in the window; otherwise report "insufficient data".

### 3.4 Occupancy Percentage

$$\text{occupancy\_pct}(\text{trip\_id}, \text{stop\_id}) = \frac{\text{onboard\_after}}{\text{capacity\_total}} \times 100$$

- `capacity_total` is obtained from `vehicles.csv` for the bus assigned to `trip_id`.
- If `onboard_after` is null, report "Load unknown".
- If `capacity_total` is 0 or missing, report a data validation error.

### 3.5 Crowding Threshold Detection & Semantic Clarification

| Level | Condition | Default threshold | Source & Semantic Meaning |
|-------|-----------|-------------------|---------------------------|
| **Normal** | `occupancy_pct` < `overcrowding_pct` | < 100 % | Configurable default assumption. Bus operates within nominal design capacity. |
| **Overcrowded (Warning)** | `occupancy_pct` ≥ `overcrowding_pct` | ≥ 100 % | Configurable assumption. Passenger load meets or exceeds design capacity. |
| **Severely Overcrowded (Critical)** | `occupancy_pct` ≥ `severe_overcrowding_pct` | ≥ 150 % | **Illustrative demo threshold derived from the infographic's source-pending claim (150%–200% overcapacity).** Clarification: This represents total onboard occupancy at 150% of total design capacity (i.e. $1.5 \times \text{capacity\_total}$, or 90 passengers in a 60-passenger bus). It is **not** an independently verified BMTC statistic, nor does it mean 150% *above* capacity (which would be 250% load). |

### 3.6 Service Fulfillment, Cancellation, and Resource-Shortfall KPIs

Four independent operational KPIs quantify corridor service delivery and timetable fulfillment across the 86 planned departures:

1. **Cancellation Rate:**
   $\text{cancellation\_rate}(\text{route\_id}, \text{date}) = \frac{\text{count}(\text{trips with final\_outcome} = \text{'cancelled'})}{\text{count}(\text{all scheduled trip slots})} \times 100 = \frac{2}{86} \times 100 = \mathbf{2.33\%}$
2. **Resource-Shortfall Rate:**
   $\text{shortfall\_rate}(\text{route\_id}, \text{date}) = \frac{\text{count}(\text{trips with final\_outcome} = \text{'resource\_shortfall'})}{\text{count}(\text{all scheduled trip slots})} \times 100 = \frac{7}{86} \times 100 = \mathbf{8.14\%}$
3. **Combined Non-Operated Rate:**
   $\text{non\_operated\_rate}(\text{route\_id}, \text{date}) = \frac{2 + 7}{86} \times 100 = \frac{9}{86} \times 100 = \mathbf{10.47\%}$
4. **Operated-Trip Fulfillment Rate:**
   $\text{fulfillment\_rate}(\text{route\_id}, \text{date}) = \frac{\text{count}(\text{trips with final\_outcome} = \text{'operated'})}{\text{count}(\text{all scheduled trip slots})} \times 100 = \frac{77}{86} \times 100 = \mathbf{89.53\%}$

This guarantees full separation of concerns: cancellation and shortfall rates quantify timetable attrition and depot vehicle availability, while nominal scheduled departure slots preserve the uncompromised target service frequency.

### 3.7 Schedule Delay & On‑Time Performance

$$\text{delay}(\text{trip\_id}, \text{stop\_id}) = \text{actual\_arrival}(\text{trip\_id}, \text{stop\_id}) - \text{scheduled\_arrival}(\text{trip\_id}, \text{stop\_id})$$

- Positive = late; negative = early; zero = on time. Unit: seconds.
- On‑Time Performance:

$$\text{on\_time\_pct}(\text{route\_id}, \text{threshold\_seconds}) = \frac{\text{count}(\text{stop-visits where } |\text{delay}| \le \text{threshold\_seconds})}{\text{count}(\text{stop-visits with known delay})} \times 100$$

- `threshold_seconds` default: 120 s (configurable assumption, no official BMTC standard cited).

---

## 4. Alert and Recommendation Logic

All alert and recommendation rules are **transparent and rule‑based**. Headway calculations are executed in seconds. No alerts or recommendations fire without the required data fields being present and validated.

### 4.0 Evaluation Timestamp ($T_{\text{eval}}$) & Replay State Rules

To prevent temporal contradictions where a trip is ambiguously described as completed and simultaneously dwelling, all real‑time control‑room views and demo scenarios are strictly evaluated at an explicit evaluation timestamp $T_{\text{eval}}$:

- **Morning Bunching Demo Timestamp:** $T_{\text{eval}} = \text{2025-03-10T08:24:00}$.
- **Evening Large‑Gap Demo Timestamp:** $T_{\text{eval}} = \text{2025-03-10T18:15:00}$.

#### Derivation of Replay Operational Status $\text{status}(T_{\text{eval}})$ & Anti-Lookahead Rules:
While `scheduled_trips.csv` stores the audited historical end-of-day outcome (`final_outcome`), real-time playback or live monitoring at evaluation timestamp $T_{\text{eval}}$ must derive each trip's operational status **strictly using information recorded on or before $T_{\text{eval}}$**. Strict anti-lookahead rules are applied uniformly to all three outcomes:

1. **Cancelled Trips (`final_outcome == 'cancelled'`):**
   - A cancellation **must not appear in replay before its recorded cancellation time**.
   - If $T_{\text{eval}} \ge \text{final\_outcome\_recorded\_at}$:
     $$\text{status}(T_{\text{eval}}) = \text{cancelled}$$
     (e.g., `T-UP-008` logged at 08:10:00 displays as `cancelled` for any $T_{\text{eval}} \ge \text{08:10:00}$).
   - If $T_{\text{eval}} < \text{final\_outcome\_recorded\_at}$: the event has not yet occurred or been logged in the control room. If $T_{\text{eval}} < \text{scheduled\_departure}$, it is displayed as `scheduled`. If $T_{\text{eval}} \ge \text{scheduled\_departure}$ prior to logging, it appears as `unknown` (`insufficient_data`).
2. **Resource-Shortfall Trips (`final_outcome == 'resource_shortfall'`):**
   - A resource shortfall **must not appear in replay before its recorded outcome time**.
   - If $T_{\text{eval}} \ge \text{final\_outcome\_recorded\_at}$:
     $$\text{status}(T_{\text{eval}}) = \text{resource\_shortfall}$$
     (displayed as *"Resource shortfall / Vehicle unavailable"*).
   - If $T_{\text{eval}} < \text{final\_outcome\_recorded\_at}$: if $T_{\text{eval}} < \text{scheduled\_departure}$, displayed as `scheduled`. If $T_{\text{eval}} \ge \text{scheduled\_departure}$ prior to logging, displayed as `unknown` (`insufficient_data`).
3. **Operated Trips (`final_outcome == 'operated'`):**
   - **`scheduled`**: If $\text{scheduled\_departure} > T_{\text{eval}}$ and no departure has occurred ($\text{actual\_departure}(\text{stop } 1) > T_{\text{eval}}$ or is null).
   - **`in_progress`**: If $\text{actual\_departure}(\text{stop } 1) \le T_{\text{eval}}$ AND final stop arrival has not occurred on or before $T_{\text{eval}}$ (i.e. $\text{actual\_arrival}(\text{final stop}) > T_{\text{eval}}$ or is null).
   - **`completed`**: If $\text{actual\_arrival}(\text{final stop}) \le T_{\text{eval}}$.
   - **`unknown` (`insufficient_data`)**: If a scheduled departure has passed ($\text{scheduled\_departure} \le T_{\text{eval}}$) but no actual departure from stop 1 is confirmed ($\text{actual\_departure}(\text{stop } 1)$ is null or unrecorded).
     - *Replay Safety Rule:* If the scheduled departure has passed but there is no confirmed departure or recorded outcome yet, the system must **show `unknown / insufficient_data`**. The system must **never** infer a bus movement or trigger a recommendation from missing departure evidence alone. The trip is displayed with *"Departure unconfirmed / Missing event data"*.

*A stored historical `operated` final outcome does NOT prevent a trip from being recognised as `in_progress` at an earlier replay time $T_{\text{eval}}$.*

#### Strict Live Dwelling State Criteria:
A vehicle $\text{bus}_{n+1}$ on trip $T_{\text{trail}}$ is determined to be **currently dwelling** at control stop $S_{\text{ctrl}}$ at timestamp $T_{\text{eval}}$ **if and only if all four testable conditions are verified**:
1. **Trip Lifecycle:** $\text{status}(T_{\text{eval}}) = \text{in\_progress}$.
2. **Stop Arrival Recorded:** In `stop_times.csv`, for stop $S_{\text{ctrl}}$, $\text{actual\_arrival} \le T_{\text{eval}}$.
3. **No Prior Departure:** In `stop_times.csv`, departure has not yet occurred at or before $T_{\text{eval}}$ ($\text{actual\_departure}$ is null or $> T_{\text{eval}}$).
4. **Current Telemetry & Stationary Geofence Match:**
   - In `bus_positions.csv`, the most recent observation for $\text{bus}_{n+1}$ with $\text{timestamp} \le T_{\text{eval}}$ has $\text{timestamp} \in [T_{\text{eval}} - 60\text{ s}, T_{\text{eval}}]$ (telemetry is fresh, not stale).
   - $\text{speed\_kmh} = 0$ (bus is stationary).
   - The observed GPS location $(\text{latitude}, \text{longitude})$ is within $100\text{ meters}$ of $S_{\text{ctrl}}$'s coordinates $(\text{lat}, \text{lon})$.

**Negative Guard & Anti‑Lookahead Rules:**
- Missing historical departure data or unmonitored archival records must **never** be inferred as a live dwelling state.
- In live or replay mode, queries strictly enforce $\text{timestamp} \le T_{\text{eval}}$. Future records ($> T_{\text{eval}}$) are hidden to prevent lookahead bias.

### 4.1 Bus Bunching Alert

| Property | Value |
|----------|-------|
| **Trigger** | General stop-level arrival headway: $\text{headway}(\text{stop\_id}, \text{bus}_n, \text{bus}_{n+1}) < \text{bunching\_threshold\_seconds}$ (default: 120 s).<br>Live control-stop holding evaluation: $\Delta T_{\text{current}} < \text{bunching\_threshold\_seconds}$ (120 s) while trailing bus is actively dwelling. |
| **Required data** | For stop-level arrival headway: Valid `actual_arrival` for consecutive operating, non‑cancelled leading ($\text{bus}_n$) and trailing ($\text{bus}_{n+1}$) buses at the same directional stop.<br>For live control-stop holding evaluation: Confirmed leading bus departure; trailing bus confirmed in strict live dwelling state at control stop (arrived, not departed, stationary geofence within 100 m, fresh telemetry). |
| **Demo Validation Case** | In morning peak at $T_{\text{eval}} = \text{2025-03-10T08:24:00}$, leading bus `BUS-06` (on operating trip `T-UP-006`) departed control stop `marathahalli-up` at 08:22:45. Trailing bus `BUS-07` (on operating trip `T-UP-007`) is verified as actively dwelling at `marathahalli-up` (arrived at 08:23:45, actual departure null, stationary geofence within 100 m, speed 0 km/h, fresh telemetry).<br>The evaluated metric is the **current elapsed departure separation**: $$\Delta T_{\text{current}} = T_{\text{eval}} - \text{actual\_departure}(\text{BUS-06}, \text{marathahalli-up}) = \text{08:24:00} - \text{08:22:45} = 75\text{ s}$$ Because $75\text{ s} < 120\text{ s}$ (the bunching threshold), the bunching alert triggers.<br>*(Methodology & Metric Distinction: The evaluated metric is strictly the **current elapsed departure separation** behind the departed lead bus at evaluation time $T_{\text{eval}}$, evaluated while the trailing bus is actively dwelling. The system does **not** claim an arrival-to-arrival headway of 75 seconds, as trailing bus `BUS-07` has not departed and is currently dwelling at the platform).* |
| **Severity** | `warning` |
| **Output fields** | `alert_type: "bunching"`, `stop_id`, `direction`, `bus_id_leading`, `bus_id_trailing`, `current_elapsed_departure_separation_seconds` (75), `threshold_seconds` (120), `timestamp` |
| **Insufficient data guard** | If `actual_arrival` is null for either bus in historical queries, or if dwelling criteria are unmet at $T_{\text{eval}} \rightarrow$ do not trigger alert; log "Headway data unavailable" or "Dwelling criteria not satisfied". Cancelled trips produce no actuals and cannot trigger bunching. |

### 4.2 Large‑Gap Alert

| Property | Value |
|----------|-------|
| **Trigger** | General stop-level arrival headway: $\text{headway}(\text{stop\_id}, \text{bus}_n, \text{bus}_{n+1}) > (H_{\text{sched\_nominal}} \times \text{large\_gap\_multiplier})$.<br>Terminal dispatch gap: $\text{terminal\_departure\_gap}(\text{origin\_stop}, \text{bus}_n, \text{bus}_{n+1}) > (H_{\text{sched\_nominal}} \times \text{large\_gap\_multiplier})$. |
| **Formula & Parameterization** | $H_{\text{sched\_nominal}} = 720\text{ s}$ (12 minutes nominal service interval in peak periods across scheduled departure slots).<br>`large_gap_multiplier` = 1.5.<br>Threshold = $720 \times 1.5 = 1080\text{ s}$ (18 minutes). |
| **Required data** | Valid consecutive operating departures at common origin terminal (or arrivals at corridor stop); nominal service interval $H_{\text{sched\_nominal}}$ anchored by scheduled departure slots. |
| **Demo Validation Case** | In evening peak at $T_{\text{eval}} = \text{2025-03-10T18:15:00}$, scheduled trip slot `T-DN-033` (17:48 departure from Hebbal, scheduled for `BUS-05`) was cancelled due to a pre-dispatch mechanical defect. Preceding operating bus `BUS-06` (on trip `T-DN-032`, departed Hebbal at 17:36:00) and succeeding operating bus `BUS-07` (on trip `T-DN-034`, departed Hebbal at 18:00:00) departed from common origin terminal `hebbal-down`.<br>Both departure events occurred and are confirmed prior to $T_{\text{eval}}$ (17:36:00 and 18:00:00 $\le$ 18:15:00).<br>The evaluated metric is the **terminal departure gap** at the common departure terminal: $$\text{terminal\_departure\_gap} = \text{actual\_departure}(\text{BUS-07}) - \text{actual\_departure}(\text{BUS-06}) = \text{18:00:00} - \text{17:36:00} = 1{,}440\text{ s}\text{ (24 minutes)}$$<br>*(Methodology & Metric Distinction: This metric is strictly a departure-to-departure measurement at a common origin terminal (**terminal departure gap**), **not** an observed stop-arrival headway).*<br>Because the comparison is against the nominal 12-minute ($720\text{ s}$) service interval ($1{,}080\text{ s}$ threshold = $1.5 \times 720\text{ s}$), the 1,440 s gap **triggers the large-gap alert** ($1{,}440 > 1{,}080\text{ s}$). |
| **Severity** | `warning` |
| **Output fields** | `alert_type: "large_gap"`, `stop_id`, `direction`, `bus_id_leading`, `bus_id_trailing`, `terminal_departure_gap_seconds` (1440), `nominal_scheduled_headway_seconds` (720), `threshold_seconds` (1080), `timestamp` |

### 4.3 Crowding Alert

| Property | Value |
|----------|-------|
| **Trigger** | `occupancy_pct` ≥ `overcrowding_pct` (100 %) |
| **Required data** | Non‑null `onboard_after`; valid `capacity_total` > 0 from `vehicles.csv`. |
| **Severity** | `warning` if $100\% \le \text{occupancy\_pct} < 150\%$; `critical` if $\text{occupancy\_pct} \ge 150\%$. |
| **Output fields** | `alert_type: "crowding"`, `severity`, `trip_id`, `stop_id`, `bus_id`, `onboard_after`, `capacity_total`, `occupancy_pct`, `timestamp` |
| **Insufficient data guard** | If `onboard_after` is null $\rightarrow$ do not trigger alert; display "Load data unavailable". |

### 4.4 Dispatcher‑Reviewed Recommendations

Recommendations are **advisory proposals only**. The human dispatcher must explicitly review and approve or decline each recommendation. **The system never automatically alters vehicle schedules or dispatches buses.**

#### 4.4.1 Hold‑at‑Stop Recommendation (Applied to Trailing Bus)

In bus bunching, the trailing bus catches up to the leading bus because the leading bus encounters larger crowds and longer dwells. Therefore, **holding is considered for the trailing bus at a designated control stop** (`is_control_point = true`), slowing its progression to widen the departure separation behind the leading bus.

| Property | Value |
|----------|-------|
| **Trigger** | Active bunching alert between leading bus $\text{bus}_n$ (trip `T-UP-006`, `BUS-06`) and trailing bus $\text{bus}_{n+1}$ (trip `T-UP-007`, `BUS-07`), both operating non‑cancelled trips. |
| **Live State Confirmation (Guard)** | Trailing bus `BUS-07` must be confirmed currently dwelling at control stop $S_{\text{ctrl}}$ (`marathahalli-up`) at $T_{\text{eval}} = \text{08:24:00}$ under the criteria in §4.0 (arrived, not departed, stationary geofence within 100 m, fresh telemetry) before calculating separation or recommending a hold. |
| **Current Elapsed Departure Separation** | $\Delta T_{\text{current}} = T_{\text{eval}} - \text{actual\_departure}(\text{bus}_n, S_{\text{ctrl}})$, in seconds.<br>Example: At $T_{\text{eval}} = \text{08:24:00}$, leading bus `BUS-06` departed `marathahalli-up` at 08:22:45. $\Delta T_{\text{current}} = \text{08:24:00} - \text{08:22:45} = 75\text{ s}$ ($< 120\text{ s}$).<br>*(Note: The system explicitly evaluates the **current elapsed departure separation** behind the departed lead bus while the trailing bus is dwelling; it does not claim an arrival-to-arrival headway of 75 seconds).* |
| **Target Headway & Deficit** | Target headway is $H_{\text{target}} = H_{\text{sched\_nominal}} = 720\text{ s}$.<br>Required hold: $\text{hold\_needed} = H_{\text{target}} - \Delta T_{\text{current}} = 720 - 75 = 645\text{ s}$. |
| **Operational Constraints & Delay Cap** | Trailing bus delay at $T_{\text{eval}}$: $D_{\text{current}} = \max(0, T_{\text{eval}} - \text{scheduled\_departure}(\text{bus}_{n+1}, S_{\text{ctrl}}))$. (Scheduled departure was 08:24:00, so $D_{\text{current}} = 0\text{ s}$).<br>Remaining delay allowance: $M_{\text{delay}} = \text{max\_delay\_tolerance\_seconds} - D_{\text{current}} = 300 - 0 = 300\text{ s}$.<br>Feasible hold: $T_{\text{hold}} = \max\big(0, \min(\text{hold\_needed}, M_{\text{delay}})\big) = \min(645, 300) = 300\text{ s}$, rounded down to nearest 30 s.<br>If $T_{\text{hold}} < \text{min\_viable\_hold\_seconds}$ (30 s), **reject recommendation**: *"Holding rejected: Trailing bus cannot absorb hold without exceeding maximum delay tolerance (300 s)."* |
| **Estimated Post‑Hold Separation** | $\text{projected\_gap} = \Delta T_{\text{current}} + T_{\text{hold}} = 75 + 300 = 375\text{ s}$. |
| **Partial Correction Disclosure Rule** | • **Full Restoration:** If $\text{projected\_gap} \ge H_{\text{target}}$, output: *"Recommend holding trailing bus [bus_id] at [stop_name] for [T_hold] s. Projected departure gap of [projected_gap] s restores the target service interval (720 s)."*<br>• **Partial Correction:** Since $\text{projected\_gap} = 375\text{ s} < 720\text{ s}$ (hold capped by $M_{\text{delay}}$), output: *"Recommend holding trailing bus BUS-07 at Marathahalli for 300 s (capped by maximum delay allowance). Note: This is a partial correction. Projected departure gap will increase from 75 s to 375 s, attenuating bunching but not fully restoring the 720 s target interval."*<br>*(Strict rule: Never claim target is restored unless the calculation explicitly shows $\text{projected\_gap} \ge H_{\text{target}}$).* |
| **Dispatcher Approval** | Proposal requires human dispatcher click to "Approve" or "Decline". |

#### 4.4.2 Insert‑Relief‑Bus Recommendation (Feasibility Verification)

| Property | Value |
|----------|-------|
| **Trigger** | Active large‑gap alert on the corridor (e.g. at Hebbal at $T_{\text{eval}} = \text{18:15:00}$ where a **terminal departure gap** of 24 min / 1,440 s between preceding bus `BUS-06` [departed 17:36:00] and following bus `BUS-07` [departed 18:00:00] was caused by cancelled trip `T-DN-033`; both departures confirmed $\le T_{\text{eval}}$). |
| **Feasibility Requirements (All must be verified)** | 1. **Standby Vehicle Availability**: At least one vehicle in `vehicles.csv` with `status = standby` and a valid recorded deployment origin `current_location_stop_id`. (e.g. `BUS-13` staged at `hebbal-down`).<br>2. **Standby Driver Availability**: At least one crew member in `crew_availability.csv` with `role = driver` (specifically a driver, not a conductor), `status = standby`, whose start-inclusive, end-exclusive shift covers the proposed deployment time $T_{\text{deploy}}$: $\text{shift\_start} \le T_{\text{deploy}} < \text{shift\_end}$. (At 18:15:00, `CREW-24` on Shift 2 $[14:00, 22:00)$ is eligible; Shift 1 drivers are off duty).<br>3. **Route, Direction, and Origin Compatibility**: The standby vehicle's `current_location_stop_id` must match a recognized origin/terminal stop for the corridor and direction (e.g. `hebbal-down` for a DOWN corridor insertion). Corridor route and direction assignment must be explicitly specified. |
| **Limitation & Non‑Claim** | **Deadhead travel time, depot clearance time, and en‑route traffic from base to insertion point are NOT calculated or simulated in this prototype.** The system does not fabricate travel-time estimates and does not claim verified real-time route feasibility. |
| **Unconfirmed / Missing Data Guard** | If any required information is absent or incompatible, **do not assert feasibility**. State clearly:<br>• If no standby bus: *"Relief deployment feasibility cannot be confirmed: No standby vehicle available."*<br>• If standby bus location is missing or incompatible: *"Relief deployment feasibility cannot be confirmed: Standby vehicle deployment origin is unrecorded or incompatible with route direction."*<br>• If no standby driver on shift at $T_{\text{deploy}}$: *"Relief deployment feasibility cannot be confirmed: No standby driver currently on shift for proposed deployment time."* |
| **Proposed Action Text** | *"Large service gap of 24 min detected at Hebbal terminal departure (cancelled trip T-DN-033). Standby bus BUS-13 staged at Hebbal with on-shift standby driver CREW-24 available. Recommend deploying relief trip on Silk Board ↔ Hebbal Corridor DOWN."* |
| **Dispatcher Approval** | Proposal is strictly advisory decision-support; requires human dispatcher click to "Approve" or "Decline". |

#### 4.4.3 Frequency‑Increase Recommendation

| Property | Value |
|----------|-------|
| **Trigger** | Persistent critical crowding (`occupancy_pct ≥ 150%`) across $\ge 3$ consecutive stops on the same trip. |
| **Proposed action** | *"Sustained severe overcrowding detected across 3+ consecutive stops on route [route_name] [direction]. Recommend scheduling additional peak service trips in next scheduling cycle."* |
| **Insufficient data guard** | If load data is missing for intermediate stops, display: *"Incomplete load records — cannot confirm sustained corridor overcrowding."* |
| **Dispatcher Approval** | Proposal advisory only; logged for planning review. |

---

## 5. Scenario Simulator — Inputs and Outputs

The scenario simulator allows operators and analysts to evaluate what‑if operational adjustments. **All scenario outputs are illustrative projections until calibrated against real operational data.**

### 5.1 Inputs

| Parameter | Type | Default | Meaning | Source |
|-----------|------|---------|---------|--------|
| `route_id` | string | (selected) | Corridor to simulate | — |
| `direction` | string | (selected) | UP or DOWN | — |
| `time_window_start` | time | `07:00` | Start-inclusive window start | — |
| `time_window_end` | time | `10:00` | End-exclusive window end | — |
| `proposed_frequency_minutes` | number | current headway | Planned headway between dispatches | User input |
| `available_spare_buses` | integer | standby count | Standby buses available to inject | `vehicles.csv` / User |
| `available_spare_crew` | integer | standby count | Standby crew available to roster | `crew_availability.csv` / User |
| `holding_time_seconds` | number | 0 | Artificial dwell time added at a control stop | User input |
| `holding_stop_id` | string | (none) | Selected control stop for holding | User input |
| `bus_capacity_total` | integer | 60 | Vehicle capacity override | `vehicles.csv` / User |
| `baseline_cycle_time_minutes` | number | 130 | Round‑trip cycle time assumption | `demo_assumptions.json` |
| `fare_revenue_per_bus_per_day_inr` | number | 14,000 | **Illustrative assumption** | concept PDF |
| `capacity_loss_fixed_schedule_pct` | number | 25 | **Illustrative assumption** | concept PDF |
| `capacity_loss_dynamic_dispatch_pct` | number | 8 | **Illustrative assumption** | concept PDF |
| `revenue_uplift_pct` | number | 3 | **Illustrative assumption** | concept PDF |
| `cost_per_bus_hour_inr` | number | null | **Placeholder — unavailable** | concept PDF |

### 5.2 Outputs & Explicit Mathematical Definitions

#### 1. Departures per Window vs. Physical Fleet Requirements:
All time windows are start-inclusive and end-exclusive $[T_{\text{start}}, T_{\text{end}})$.
- **Departures per Window (End‑Exclusive)**:
  $$N_{\text{prop}} = \left\lceil \frac{T_{\text{end}} - T_{\text{start}}}{\text{proposed\_frequency\_minutes}} \right\rceil$$
  When the duration $(T_{\text{end}} - T_{\text{start}})$ is exactly divisible by the frequency, this simplifies directly to $(T_{\text{end}} - T_{\text{start}}) / \text{proposed\_frequency\_minutes}$. For example, on $[07:00, 10:00)$ (180 minutes) at 12-minute frequency: $180 / 12 = 15$ departures.
  *(This is the count of departure dispatch slots in the window, NOT the number of physical buses required).*
- **Physical Fleet Required (Buses Required)**:
  $$\text{physical\_buses\_required} = \left\lceil \frac{\text{baseline\_cycle\_time\_minutes}}{\text{proposed\_frequency\_minutes}} \right\rceil$$
  With baseline cycle time of 130 minutes (55 min outbound + 10 min recovery at Hebbal + 55 min inbound + 10 min recovery at Silk Board) at 12-minute peak frequency: $\lceil 130 / 12 \rceil = 11\text{ active buses}$.
  - **Limitation / Guard:** If `baseline_cycle_time_minutes` is null or unconfigured, the simulator **must report departures per window only** and mark `physical_buses_required` as *"Unavailable (requires calibrated round-trip cycle time)"*. It must never confuse departures with physical buses.

#### 2. Reproducible Scenario Load & Occupancy Projection Rule:
To project passenger loads and crowding without treating stops as isolated arrival pools or summing onboard counts across stops:

1. **Baseline Corridor Sample & Baseline Departure Count ($N_{\text{base}}$)**:
   Filter `scheduled_trips.csv` and `passenger_loads.csv` for the selected `route_id`, `direction`, and start-inclusive, end-exclusive window $[T_{\text{start}}, T_{\text{end}})$.
   
   $N_{\text{base}}$ is determined directly by counting the planned scheduled departure slots in `scheduled_trips.csv` whose scheduled departure falls within $[T_{\text{start}}, T_{\text{end}})$:
   $$N_{\text{base}} = \left| \{ t \in \text{scheduled\_trips} \mid \text{route\_id}(t) = \text{selected\_route} \land \text{direction}(t) = \text{selected\_direction} \land T_{\text{start}} \le \text{scheduled\_departure}(t) < T_{\text{end}} \} \right|$$
   - **Retention of Cancelled Slots:** All planned timetable slots—**including cancelled trips**—are counted in $N_{\text{base}}$, representing the baseline scheduled capacity.
   - **Multi-Frequency Windows:** When a simulated window spans across multiple service-frequency periods (for example, transitioning from 12-minute peak headway before 10:00 to 15-minute off-peak headway after 10:00), counting scheduled records from `scheduled_trips.csv` directly provides the exact integer count of planned dispatches. Under no circumstances may an unrounded duration-to-frequency ratio $(T_{\text{end}} - T_{\text{start}}) / f$ be used as a departure count. If evaluated analytically across $K$ sub-intervals $[T_k, T_{k+1})$ each having uniform frequency $f_k$, the formula is strictly:
     $$N_{\text{base}} = \sum_{k=1}^K \left\lceil \frac{T_{k+1} - T_k}{f_k} \right\rceil$$
     Similarly, proposed departures spanning multiple frequency tiers are: $N_{\text{prop}} = \sum_{k=1}^K \lceil (T_{k+1} - T_k) / f_{\text{prop}, k} \rceil$.
2. **Observed Baseline Load Profile by Stop (with Valid Observation Denominator)**:
   For each directional stop $s \in \{1, \dots, S\}$, identify the subset of completed trips having a valid, non‑null load observation:
   $$V(s) = \{ t \in \text{completed trips in window} \mid \text{onboard\_after}(t, s) \text{ is not null} \}$$
   Let the denominator be $N_{\text{valid}}(s) = |V(s)|$.
   - **Data Guard:** If $N_{\text{valid}}(s) < 2$ (insufficient observations), stop $s$ returns an **"Insufficient historical data"** state and is excluded from numerical aggregation.
   - If $N_{\text{valid}}(s) \ge 2$, calculate the average observed onboard load departing stop $s$:
     $$\overline{\text{onboard}}_{\text{base}}(s) = \frac{1}{N_{\text{valid}}(s)} \sum_{t \in V(s)} \text{onboard\_after}(t, s)$$
   *(Note: Do NOT sum onboard counts across stops or treat them as separate passenger arrivals. Each stop's value represents the continuous occupancy remaining onboard as the bus departs stop $s$).*
3. **Departure Ratio Scaling**:
   Scale the baseline stop load by the ratio of baseline departures to proposed departures:
   $$\text{projected\_onboard}(s) = \overline{\text{onboard}}_{\text{base}}(s) \times \left( \frac{N_{\text{base}}}{N_{\text{prop}}} \right)$$
4. **Projected Occupancy Percentage by Stop**:
   $$\text{projected\_occupancy\_pct}(s) = \left( \frac{\text{projected\_onboard}(s)}{\text{bus\_capacity\_total}} \right) \times 100$$
5. **Corridor Summary KPIs (Derived Consistently from Stop Profiles)**:
   - **Projected Peak Occupancy**:
     $$\text{projected\_peak\_occupancy\_pct} = \max_{s \in \text{valid stops}} \big( \text{projected\_occupancy\_pct}(s) \big)$$
   - **Projected Overcrowded Stops Count**:
     $$\text{projected\_overcrowded\_stops} = \sum_{s \in \text{valid stops}} \mathbf{1}\big( \text{projected\_occupancy\_pct}(s) \ge \text{overcrowding\_pct} \big)$$
   - **Projected Severely Overcrowded Stops Count**:
     $$\text{projected\_severely\_overcrowded\_stops} = \sum_{s \in \text{valid stops}} \mathbf{1}\big( \text{projected\_occupancy\_pct}(s) \ge \text{severe\_overcrowding\_pct} \big)$$

- **Explicit Assumptions & Model Limitations:**
  - **Proportional Demand Distribution Assumption:** Total passenger demand along the corridor is assumed to be fixed (inelastic) and distributed proportionally across all scheduled departures.
  - **Behavioral and Operational Limitations:** This simplified model does *not* reflect actual commuter behavior (such as peak-within-peak temporal concentration or passenger route switching), modal substitution, traffic congestion variability, dwell-time feedback (where larger boarding crowds lengthen dwell times), or dynamic bus bunching cascades.

#### 3. Holding Time Effects & Headway Modeling:
When a user simulates a hold duration $T_{\text{hold}} \ge 0$ at a designated control stop $S_{\text{ctrl}}$ for a target trip $t^*$:
- **Upstream Stops ($s < S_{\text{ctrl}}$):**
  - All event times remain completely unmodified: $\text{sim\_arrival}(t^*, s) = \text{base\_arrival}(t^*, s)$ and $\text{sim\_departure}(t^*, s) = \text{base\_departure}(t^*, s)$. Historical events prior to the control stop are never altered.
- **At the Control Stop ($s = S_{\text{ctrl}}$):**
  - The arrival time is unaffected: $\text{sim\_arrival}(t^*, S_{\text{ctrl}}) = \text{base\_arrival}(t^*, S_{\text{ctrl}})$.
  - The departure event is shifted forward by exactly $+T_{\text{hold}}$:
    $$\text{sim\_departure}(t^*, S_{\text{ctrl}}) = \text{base\_departure}(t^*, S_{\text{ctrl}}) + T_{\text{hold}}$$
  - Dwell duration is expanded: $\text{dwell}_{\text{sim}}(t^*, S_{\text{ctrl}}) = \text{dwell}_{\text{base}}(t^*, S_{\text{ctrl}}) + T_{\text{hold}}$.
- **Downstream Stops ($s > S_{\text{ctrl}}$):**
  - Because departure from $S_{\text{ctrl}}$ is delayed by $T_{\text{hold}}$, every subsequent downstream arrival and departure is propagated forward by $+T_{\text{hold}}$:
    $$\text{sim\_arrival}(t^*, s) = \text{base\_arrival}(t^*, s) + T_{\text{hold}}$$
    $$\text{sim\_departure}(t^*, s) = \text{base\_departure}(t^*, s) + T_{\text{hold}}$$
- **Chronological Validity:**
  - Since $T_{\text{hold}} \ge 0$ and baseline events satisfy $\text{arrival}(s) \le \text{departure}(s) \le \text{arrival}(s+1)$, the shifted sequence strictly preserves chronological order ($\text{sim\_arrival} \le \text{sim\_departure}$) across all stops without timestamp regressions.
- **Recalculated Headway Shifts:**
  - For stops $s \ge S_{\text{ctrl}}$, headways relative to adjacent trips are recalculated using the shifted times:
    - **Separation Ahead:** Headway between target trip $t^*$ and the preceding trip $t^*-1$ expands by $+T_{\text{hold}}$:
      $$H_{\text{ahead}}(s) = \text{sim\_departure}(t^*, s) - \text{sim\_departure}(t^*-1, s) = H_{\text{base}}(s) + T_{\text{hold}}$$
    - **Separation Behind:** Headway between following trip $t^*+1$ and target trip $t^*$ compresses by $-T_{\text{hold}}$:
      $$H_{\text{behind}}(s) = \text{sim\_departure}(t^*+1, s) - \text{sim\_departure}(t^*, s) = H_{\text{base}}(s) - T_{\text{hold}}$$
- **Model Limitation Label:** The prototype simulator models first‑order deterministic schedule propagation only. It does **not** model traffic congestion feedback, road network impedance, secondary bunching cascades downstream, or dwell-time elongation from increased passenger queues.

#### 4. Financial Outputs (Illustrative):
- **Estimated Daily Fare Revenue Change**:
  $$\text{revenue\_change} = \left( \frac{\text{revenue\_uplift\_pct}}{100} \right) \times \text{fare\_revenue\_per\_bus\_per\_day\_inr} \times \text{physical\_buses\_required}$$
  *(Marked clearly: "Illustrative projection based on concept PDF assumptions; not a verified revenue forecast").*
- **Estimated Operational Cost Change**:
  - If `cost_per_bus_hour_inr` is null: Report *"Cost projection unavailable — cost per bus-hour is uncalibrated."*

### 5.3 Mandatory Scenario Disclaimer

Every scenario simulation result screen must display the following notice:

> **Illustrative projection.** Scenario outputs are calculated from synthetic baseline data and configurable illustrative assumptions. They assume uniform, inelastic passenger demand distribution across dispatches and do not model real commuter route choices, traffic variability, or dynamic bunching cascades. These outputs must not be used for operational commitments or financial planning until calibrated against verified BMTC data.

---

## 6. Synthetic Demo‑Data Plan (Silk Board – Hebbal Corridor)

This section specifies the exact datasets to be generated in the next step.

### 6.1 Corridor & Stop Network

- **1 Corridor** in `routes.csv`: `silk-board-hebbal` (Silk Board Junction to Hebbal Flyover, ~18.5 km).
- **24 Directional Stops** in `stops.csv`:
  - 12 stops in the `UP` direction (`silk-board-up` to `hebbal-up`).
  - 12 stops in the `DOWN` direction (`hebbal-down` to `silk-board-down`).
  - Synthetic landmark locations along the Outer Ring Road / Bellary Road corridor (e.g. Silk Board, HSR Layout, Bellandur, Marathahalli, KR Puram, Kalyan Nagar, Hebbal).
  - Selected key transfer nodes flagged with `is_control_point = true` (e.g. Silk Board, Marathahalli, Hebbal).
  - Approximate coordinates are purely synthetic; not surveyed BMTC stop coordinates.

### 6.2 Fleet & Crew Roster (Reconciled with 130-Minute Cycle Time & Valid Rotation)

With a 130-minute round-trip cycle time (55 min outbound + 10 min recovery at Hebbal + 55 min inbound + 10 min recovery at Silk Board = 130 min), operating 12-minute peak headway nominally requires $\lceil 130 / 12 \rceil = 11$ active buses:
- **13 Vehicles** in `vehicles.csv`:
  - 11 active buses (`BUS-01` to `BUS-11`), each with 40 seated + 20 standing = 60 design capacity.
  - 2 standby buses (`BUS-12` staged at `silk-board-up`, `BUS-13` staged at `hebbal-down`) with `status = standby` and explicit `current_location_stop_id`.
  - **Standby Fleet Preservation Rule:** `BUS-12` and `BUS-13` are dedicated standby vehicles reserved exclusively for dispatcher-approved emergency insertions. They must **never** be silently counted as regular service buses to plug timetable deficits while simultaneously claiming to be available for relief.
- **24 Crew Members** in `crew_availability.csv`:
  - Shift 1 (Morning $[06:00, 14:00)$): 11 active drivers (`CREW-01` to `CREW-11`) + 1 standby driver (`CREW-12` at Silk Board).
  - Shift 2 (Evening $[14:00, 22:00)$): 11 active drivers (`CREW-13` to `CREW-23`) + 1 standby driver (`CREW-24` at Hebbal).
  - Shifts are start-inclusive and end-exclusive. All 24 crew members have `role = driver` to provide verified shift coverage for daytime and evening relief deployments without duplicate handover counting.

#### Initial Fleet Staging at 07:00:00:
- At the start of the service day (07:00:00), all 11 active vehicles (`BUS-01` through `BUS-11`) are staged at the southern terminal depot: `silk-board-up`.
- Standby `BUS-12` is staged at `silk-board-up`.
- Standby `BUS-13` is staged at `hebbal-down`.

#### Return-Movement Assumption & Telemetry Boundary:
- The 130-minute cycle assumes a trip in one direction (55 min), terminal recovery buffer (10 min), a return movement (55 min), and recovery buffer at the starting terminal (10 min): $55 + 10 + 55 + 10 = 130\text{ minutes}$.
- The 86 scheduled service trips in `scheduled_trips.csv` represent **scheduled passenger-carrying revenue services only**.
- During the directional peak periods (morning $[07:00, 10:00)$ UP and evening $[17:00, 20:00)$ DOWN), the returning movements required to reposition vehicles back to the origin terminal (Hebbal $\rightarrow$ Silk Board in the morning; Silk Board $\rightarrow$ Hebbal in the evening) are **treated as untracked, non-revenue repositioning (deadhead) movements outside `scheduled_trips.csv`, `stop_times.csv`, and `bus_positions.csv`**.
- **Explicit Telemetry Limitation & Non-Claim:** Bus-position telemetry in `bus_positions.csv` covers **scheduled revenue service trips only**. The prototype does **NOT claim continuous telemetry or live GPS tracking during non-revenue deadhead repositioning movements**.

#### Deterministic Vehicle Assignment & Physical Availability Rule:
A vehicle $V$ is validly assigned to scheduled trip $t_j$ departing terminal $\text{orig}(t_j)$ at scheduled departure time $T_{\text{sched\_dep}}(t_j)$ if and only if its earliest physical availability timestamp satisfies:
$$\text{ready\_time}(V, \text{orig}(t_j)) \le T_{\text{act\_dep}}(t_j)$$
where physical availability is determined from the **recorded actual arrival timestamp** $T_{\text{act\_arr}}(t_{\text{prev}})$ of the vehicle's preceding trip $t_{\text{prev}}$ (accounting for any injected traffic delays), plus mandatory terminal recovery and repositioning:
1. **Same-Terminal In-Service Turnaround:** If $V$'s preceding trip $t_{\text{prev}}$ terminated at $\text{orig}(t_j)$ (such as bidirectional off-peak service):
   $$\text{ready\_time}(V, \text{orig}(t_j)) = T_{\text{act\_arr}}(t_{\text{prev}}) + T_{\text{recovery}} (10\text{ min})$$
2. **Opposite-Terminal Repositioning Turnaround:** If $V$'s preceding trip $t_{\text{prev}}$ terminated at the opposite terminal $\text{dest}(t_{\text{prev}}) \ne \text{orig}(t_j)$ and requires an untracked non-revenue repositioning return:
   $$\text{ready\_time}(V, \text{orig}(t_j)) = T_{\text{act\_arr}}(t_{\text{prev}}) + 10\text{ min} (\text{recovery}) + 55\text{ min} (\text{reposition}) + 10\text{ min} (\text{recovery}) = T_{\text{act\_arr}}(t_{\text{prev}}) + 75\text{ min}$$

- **Actual-Time Arithmetic Rule:** Recorded actual timestamps—rather than unadjusted scheduled minutes—must be used for all vehicle readiness calculations:
  - For example, `T-UP-001` has a recorded actual sequence 12 arrival at Hebbal of 07:55:30. Adding 75 minutes ($10\text{ min terminal recovery} + 55\text{ min repositioning} + 10\text{ min terminal buffer}$) yields physical readiness at Silk Board at **09:10:30**. With `T-UP-012` scheduled departure at 09:12:00, `BUS-01` has a valid **90-second buffer** ($09:12:00 - 09:10:30 = 90\text{ s}$).
  - *Data Integrity Note:* Do not assume every trip has a 30-second departure offset merely because the sample trip does. Each trip's readiness must be audited from its actual recorded arrival.

#### Complete Chronological Vehicle Rotation Audit (`BUS-01` to `BUS-11`):
Below is the complete chronological operational rotation for all 11 active vehicles throughout the entire service day. Every single trip's origin, destination, actual arrival, turnaround buffer, physical readiness, and departure gate is audited. Standby buses `BUS-12` and `BUS-13` remain 100% reserved and are excluded from regular assignments.

| Vehicle | Assigned Trip | Dir | Origin | Destination | Sched Dep | Actual Dep | Actual Arr | Preceding Event / Arrival | Earliest Ready Time | Turnaround Buffer | Status & Verification Note |
|:---:|:---:|:---:|:---|:---|:---:|:---:|:---:|:---|:---:|:---:|:---|
| **`BUS-01`** | `T-UP-001` | UP | Silk Board | Hebbal | 07:00 | 07:00:30 | 07:55:30 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (Morning Peak) |
| `BUS-01` | `T-UP-012` | UP | Silk Board | Hebbal | 09:12 | 09:12:00 | 10:07:00 | `T-UP-001` arr Hebbal 07:55:30 + 75m repos. | 09:10:30 | +1m 30s | ✅ Operated (Peak return) |
| `BUS-01` | `T-DN-007` | DOWN | Hebbal | Silk Board | 11:30 | 11:30:00 | 12:25:00 | `T-UP-012` arr Hebbal 10:07:00 + 10m recovery | 10:17:00 | +73 min | ✅ Operated (Off-Peak) |
| `BUS-01` | `T-UP-027` | UP | Silk Board | Hebbal | 12:45 | 12:45:00 | 13:40:00 | `T-DN-007` arr Silk Board 12:25:00 + 10m recovery | 12:35:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-01` | `T-DN-017` | DOWN | Hebbal | Silk Board | 14:00 | 14:00:00 | 14:55:00 | `T-UP-027` arr Hebbal 13:40:00 + 10m recovery | 13:50:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-01` | `T-UP-037` | UP | Silk Board | Hebbal | 15:15 | 15:15:00 | 16:10:00 | `T-DN-017` arr Silk Board 14:55:00 + 10m recovery | 15:05:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-01` | `T-DN-027` | DOWN | Hebbal | Silk Board | 16:30 | 16:30:00 | 17:25:00 | `T-UP-037` arr Hebbal 16:10:00 + 10m recovery | 16:20:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-01` | `T-DN-038` | DOWN | Hebbal | Silk Board | 18:48 | 18:48:00 | 19:49:00 | `T-DN-027` arr Silk Board 17:25:00 + 75m repos. | 18:40:00 | +8 min | ✅ Operated (+6m delay; arr Silk Board) |
| **`BUS-02`** | `T-UP-002` | UP | Silk Board | Hebbal | 07:12 | 07:12:00 | 08:09:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+2m delay; arr 08:09:00) |
| `BUS-02` | `T-UP-013` | UP | Silk Board | Hebbal | 09:24 | 09:24:00 | 10:19:00 | `T-UP-002` arr Hebbal 08:09:00 + 75m repos. | 09:24:00 | +0 min | ✅ Operated (0m buffer; arr 10:19:00) |
| `BUS-02` | `T-DN-008` | DOWN | Hebbal | Silk Board | 11:45 | 11:45:00 | 12:40:00 | `T-UP-013` arr Hebbal 10:19:00 + 10m recovery | 10:29:00 | +76 min | ✅ Operated (Off-Peak) |
| `BUS-02` | `T-UP-028` | UP | Silk Board | Hebbal | 13:00 | 13:00:00 | 13:55:00 | `T-DN-008` arr Silk Board 12:40:00 + 10m recovery | 12:50:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-02` | `T-DN-018` | DOWN | Hebbal | Silk Board | 14:15 | 14:15:00 | 15:10:00 | `T-UP-028` arr Hebbal 13:55:00 + 10m recovery | 14:05:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-02` | `T-UP-038` | UP | Silk Board | Hebbal | 15:30 | 15:30:00 | 16:25:00 | `T-DN-018` arr Silk Board 15:10:00 + 10m recovery | 15:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-02` | `T-DN-028` | DOWN | Hebbal | Silk Board | 16:45 | 16:45:00 | 17:40:00 | `T-UP-038` arr Hebbal 16:25:00 + 10m recovery | 16:35:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-02` | `T-DN-039` | DOWN | Hebbal | Silk Board | 19:00 | 19:00:00 | 19:58:00 | `T-DN-028` arr Silk Board 17:40:00 + 75m repos. | 18:55:00 | +5 min | ✅ Operated (+3m delay; arr Silk Board) |
| **`BUS-03`** | `T-UP-003` | UP | Silk Board | Hebbal | 07:24 | 07:24:00 | 08:22:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+3m delay; arr 08:22:00) |
| `BUS-03` | `T-UP-014` | UP | Silk Board | Hebbal | 09:36 | 09:37:00 | 10:32:00 | `T-UP-003` arr Hebbal 08:22:00 + 75m repos. | 09:37:00 | +0 min | ✅ Operated Late (+1m gate breach; 55m dur) |
| `BUS-03` | `T-DN-009` | DOWN | Hebbal | Silk Board | 12:00 | 12:00:00 | 12:55:00 | `T-UP-014` arr Hebbal 10:32:00 + 10m recovery | 10:42:00 | +78 min | ✅ Operated (Off-Peak) |
| `BUS-03` | `T-UP-029` | UP | Silk Board | Hebbal | 13:15 | 13:15:00 | 14:10:00 | `T-DN-009` arr Silk Board 12:55:00 + 10m recovery | 13:05:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-03` | `T-DN-019` | DOWN | Hebbal | Silk Board | 14:30 | 14:30:00 | 15:25:00 | `T-UP-029` arr Hebbal 14:10:00 + 10m recovery | 14:20:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-03` | `T-UP-039` | UP | Silk Board | Hebbal | 15:45 | 15:45:00 | 16:40:00 | `T-DN-019` arr Silk Board 15:25:00 + 10m recovery | 15:35:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-03` | `T-DN-029` | DOWN | Hebbal | Silk Board | 17:00 | 17:00:00 | 17:55:00 | `T-UP-039` arr Hebbal 16:40:00 + 10m recovery | 16:50:00 | +10 min | ✅ Operated (Evening Peak opening trip; on-time) |
| `BUS-03` | `T-DN-040` | DOWN | Hebbal | Silk Board | 19:12 | 19:12:00 | 20:07:00 | `T-DN-029` arr Silk Board 17:55:00 + 75m repos. | 19:10:00 | +2 min | ✅ Operated (Evening Peak; on-time, arr Silk Board) |
| **`BUS-04`** | `T-UP-004` | UP | Silk Board | Hebbal | 07:36 | 07:36:00 | 08:34:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+3m delay; arr 08:34:00) |
| `BUS-04` | `T-UP-015` | UP | Silk Board | Hebbal | 09:48 | 09:49:00 | 10:44:00 | `T-UP-004` arr Hebbal 08:34:00 + 75m repos. | 09:49:00 | +0 min | ✅ Operated Late (+1m gate breach; 55m dur) |
| `BUS-04` | `T-DN-010` | DOWN | Hebbal | Silk Board | 12:15 | 12:15:00 | 13:10:00 | `T-UP-015` arr Hebbal 10:44:00 + 10m recovery | 10:54:00 | +81 min | ✅ Operated (Off-Peak) |
| `BUS-04` | `T-UP-030` | UP | Silk Board | Hebbal | 13:30 | 13:30:00 | 14:25:00 | `T-DN-010` arr Silk Board 13:10:00 + 10m recovery | 13:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-04` | `T-DN-020` | DOWN | Hebbal | Silk Board | 14:45 | 14:45:00 | 15:40:00 | `T-UP-030` arr Hebbal 14:25:00 + 10m recovery | 14:35:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-04` | `T-UP-040` | UP | Silk Board | Hebbal | 16:00 | 16:00:00 | 16:55:00 | `T-DN-020` arr Silk Board 15:40:00 + 10m recovery | 15:50:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-04` | `T-DN-030` | DOWN | Hebbal | Silk Board | 17:12 | 17:12:00 | 18:09:00 | `T-UP-040` arr Hebbal 16:55:00 + 10m recovery | 17:05:00 | +7 min | ✅ Operated (+2m delay; arr 18:09:00) |
| `BUS-04` | `T-DN-041` | DOWN | Hebbal | Silk Board | 19:24 | 19:24:00 | 20:19:00 | `T-DN-030` arr Silk Board 18:09:00 + 75m repos. | 19:24:00 | +0 min | ✅ Operated (Evening Peak; on-time, arr Silk Board) |
| **`BUS-05`** | `T-UP-005` | UP | Silk Board | Hebbal | 07:48 | 07:48:00 | 08:47:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+4m delay; arr 08:47:00) |
| `BUS-05` | `T-DN-001` | DOWN | Hebbal | Silk Board | 10:00 | 10:00:00 | 10:55:00 | `T-UP-005` arr Hebbal 08:47:00 + 10m recovery | 08:57:00 | +63 min | ✅ Operated (Earliest Off-Peak DOWN) |
| `BUS-05` | `T-UP-021` | UP | Silk Board | Hebbal | 11:15 | 11:15:00 | 12:10:00 | `T-DN-001` arr Silk Board 10:55:00 + 10m recovery | 11:05:00 | +10 min | ✅ Operated (Earliest Off-Peak UP) |
| `BUS-05` | `T-DN-011` | DOWN | Hebbal | Silk Board | 12:30 | 12:30:00 | 13:25:00 | `T-UP-021` arr Hebbal 12:10:00 + 10m recovery | 12:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-05` | `T-UP-031` | UP | Silk Board | Hebbal | 13:45 | 13:45:00 | 14:40:00 | `T-DN-011` arr Silk Board 13:25:00 + 10m recovery | 13:35:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-05` | `T-DN-021` | DOWN | Hebbal | Silk Board | 15:00 | 15:00:00 | 15:55:00 | `T-UP-031` arr Hebbal 14:40:00 + 10m recovery | 14:50:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-05` | `T-UP-041` | UP | Silk Board | Hebbal | 16:15 | 16:15:00 | 17:10:00 | `T-DN-021` arr Silk Board 15:55:00 + 10m recovery | 16:05:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-05` | `T-DN-033` | DOWN | Hebbal | Silk Board | 17:48 | — | — | `T-UP-041` arr Hebbal 17:10:00; ready 17:20; held for 17:48 slot; pre-dispatch defect | Out of service | Fault at 17:40 | ⚠️ Cancelled (Mechanical fault; creates gap) |
| **`BUS-06`** | `T-UP-006` | UP | Silk Board | Hebbal | 08:00 | 08:00:00 | 08:59:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+4m delay; lead bus bunching) |
| `BUS-06` | `T-DN-002` | DOWN | Hebbal | Silk Board | 10:15 | 10:15:00 | 11:10:00 | `T-UP-006` arr Hebbal 08:59:00 + 10m recovery | 09:09:00 | +66 min | ✅ Operated (Off-Peak) |
| `BUS-06` | `T-UP-022` | UP | Silk Board | Hebbal | 11:30 | 11:30:00 | 12:25:00 | `T-DN-002` arr Silk Board 11:10:00 + 10m recovery | 11:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-06` | `T-DN-012` | DOWN | Hebbal | Silk Board | 12:45 | 12:45:00 | 13:40:00 | `T-UP-022` arr Hebbal 12:25:00 + 10m recovery | 12:35:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-06` | `T-UP-032` | UP | Silk Board | Hebbal | 14:00 | 14:00:00 | 14:55:00 | `T-DN-012` arr Silk Board 13:40:00 + 10m recovery | 13:50:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-06` | `T-DN-022` | DOWN | Hebbal | Silk Board | 15:15 | 15:15:00 | 16:10:00 | `T-UP-032` arr Hebbal 14:55:00 + 10m recovery | 15:05:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-06` | `T-UP-042` | UP | Silk Board | Hebbal | 16:30 | 16:30:00 | 17:25:00 | `T-DN-022` arr Silk Board 16:10:00 + 10m recovery | 16:20:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-06` | `T-DN-032` | DOWN | Hebbal | Silk Board | 17:36 | 17:36:00 | 18:34:00 | `T-UP-042` arr Hebbal 17:25:00 + 10m recovery | 17:35:00 | +1 min | ✅ Operated (+3m delay; lead bus for gap) |
| `BUS-06` | `T-DN-043` | DOWN | Hebbal | Silk Board | 19:48 | 19:49:00 | 20:44:00 | `T-DN-032` arr Silk Board 18:34:00 + 75m repos. | 19:49:00 | +0 min | ✅ Operated Late (+1m gate breach; 55m dur; final revenue trip) |
| **`BUS-07`** | `T-UP-007` | UP | Silk Board | Hebbal | 08:12 | 08:12:00 | 09:12:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+5m delay; bunched trailing) |
| `BUS-07` | `T-DN-003` | DOWN | Hebbal | Silk Board | 10:30 | 10:30:00 | 11:25:00 | `T-UP-007` arr Hebbal 09:12:00 + 10m recovery | 09:22:00 | +68 min | ✅ Operated (Off-Peak) |
| `BUS-07` | `T-UP-023` | UP | Silk Board | Hebbal | 11:45 | 11:45:00 | 12:40:00 | `T-DN-003` arr Silk Board 11:25:00 + 10m recovery | 11:35:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-07` | `T-DN-013` | DOWN | Hebbal | Silk Board | 13:00 | 13:00:00 | 13:55:00 | `T-UP-023` arr Hebbal 12:40:00 + 10m recovery | 12:50:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-07` | `T-UP-033` | UP | Silk Board | Hebbal | 14:15 | 14:15:00 | 15:10:00 | `T-DN-013` arr Silk Board 13:55:00 + 10m recovery | 14:05:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-07` | `T-DN-023` | DOWN | Hebbal | Silk Board | 15:30 | 15:30:00 | 16:25:00 | `T-UP-033` arr Hebbal 15:10:00 + 10m recovery | 15:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-07` | `T-UP-043` | UP | Silk Board | Hebbal | 16:45 | 16:45:00 | 17:40:00 | `T-DN-023` arr Silk Board 16:25:00 + 10m recovery | 16:35:00 | +10 min | ✅ Operated (Final scheduled UP trip) |
| `BUS-07` | `T-DN-034` | DOWN | Hebbal | Silk Board | 18:00 | 18:00:00 | 18:59:00 | `T-UP-043` arr Hebbal 17:40:00 + 10m recovery | 17:50:00 | +10 min | ✅ Operated (+4m delay; trail bus for gap) |
| **`BUS-08`** | `T-UP-008` | UP | Silk Board | Hebbal | 08:24 | — | — | Staged at Silk Board depot; defect at 08:10:00 | Out of service | Fault logged 08:10 | ⚠️ Cancelled (Mechanical defect; withdrawn) |
| **`BUS-09`** | `T-UP-009` | UP | Silk Board | Hebbal | 08:36 | 08:36:00 | 09:36:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+5m delay; arr 09:36:00) |
| `BUS-09` | `T-DN-004` | DOWN | Hebbal | Silk Board | 10:45 | 10:45:00 | 11:40:00 | `T-UP-009` arr Hebbal 09:36:00 + 10m recovery | 09:46:00 | +59 min | ✅ Operated (Off-Peak) |
| `BUS-09` | `T-UP-024` | UP | Silk Board | Hebbal | 12:00 | 12:00:00 | 12:55:00 | `T-DN-004` arr Silk Board 11:40:00 + 10m recovery | 11:50:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-09` | `T-DN-014` | DOWN | Hebbal | Silk Board | 13:15 | 13:15:00 | 14:10:00 | `T-UP-024` arr Hebbal 12:55:00 + 10m recovery | 13:05:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-09` | `T-UP-034` | UP | Silk Board | Hebbal | 14:30 | 14:30:00 | 15:25:00 | `T-DN-014` arr Silk Board 14:10:00 + 10m recovery | 14:20:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-09` | `T-DN-024` | DOWN | Hebbal | Silk Board | 15:45 | 15:45:00 | 16:40:00 | `T-UP-034` arr Hebbal 15:25:00 + 10m recovery | 15:35:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-09` | `T-DN-035` | DOWN | Hebbal | Silk Board | 18:12 | 18:12:00 | 19:11:00 | `T-DN-024` arr Silk Board 16:40:00 + 75m repos. | 17:55:00 | +17 min | ✅ Operated (+4m delay; arr Silk Board) |
| **`BUS-10`** | `T-UP-010` | UP | Silk Board | Hebbal | 08:48 | 08:48:00 | 09:49:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (+6m delay; arr 09:49:00) |
| `BUS-10` | `T-DN-005` | DOWN | Hebbal | Silk Board | 11:00 | 11:00:00 | 11:55:00 | `T-UP-010` arr Hebbal 09:49:00 + 10m recovery | 09:59:00 | +61 min | ✅ Operated (Off-Peak) |
| `BUS-10` | `T-UP-025` | UP | Silk Board | Hebbal | 12:15 | 12:15:00 | 13:10:00 | `T-DN-005` arr Silk Board 11:55:00 + 10m recovery | 12:05:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-10` | `T-DN-015` | DOWN | Hebbal | Silk Board | 13:30 | 13:30:00 | 14:25:00 | `T-UP-025` arr Hebbal 13:10:00 + 10m recovery | 13:20:00 | +10 min | ✅ Operated (Shift boundary run) |
| `BUS-10` | `T-UP-035` | UP | Silk Board | Hebbal | 14:45 | 14:45:00 | 15:40:00 | `T-DN-015` arr Silk Board 14:25:00 + 10m recovery | 14:35:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-10` | `T-DN-025` | DOWN | Hebbal | Silk Board | 16:00 | 16:00:00 | 16:55:00 | `T-UP-035` arr Hebbal 15:40:00 + 10m recovery | 15:50:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-10` | `T-DN-036` | DOWN | Hebbal | Silk Board | 18:24 | 18:24:00 | 19:24:00 | `T-DN-025` arr Silk Board 16:55:00 + 75m repos. | 18:10:00 | +14 min | ✅ Operated (+5m delay; arr Silk Board) |
| **`BUS-11`** | `T-UP-011` | UP | Silk Board | Hebbal | 09:00 | 09:00:00 | 09:55:00 | Staged at Silk Board depot | 07:00:00 | Staged on-time | ✅ Operated (On-time; arr 09:55:00) |
| `BUS-11` | `T-DN-006` | DOWN | Hebbal | Silk Board | 11:15 | 11:15:00 | 12:10:00 | `T-UP-011` arr Hebbal 09:55:00 + 10m recovery | 10:05:00 | +70 min | ✅ Operated (Off-Peak) |
| `BUS-11` | `T-UP-026` | UP | Silk Board | Hebbal | 12:30 | 12:30:00 | 13:25:00 | `T-DN-006` arr Silk Board 12:10:00 + 10m recovery | 12:20:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-11` | `T-DN-016` | DOWN | Hebbal | Silk Board | 13:45 | 13:45:00 | 14:40:00 | `T-UP-026` arr Hebbal 13:25:00 + 10m recovery | 13:35:00 | +10 min | ✅ Operated (Off-Peak) |
| `BUS-11` | `T-UP-036` | UP | Silk Board | Hebbal | 15:00 | 15:00:00 | 15:55:00 | `T-DN-016` arr Silk Board 14:40:00 + 10m recovery | 14:50:00 | +10 min | ✅ Operated (Shift 2 Driver) |
| `BUS-11` | `T-DN-026` | DOWN | Hebbal | Silk Board | 16:15 | 16:15:00 | 17:10:00 | `T-UP-036` arr Hebbal 15:55:00 + 10m recovery | 16:05:00 | +10 min | ✅ Operated (Off-Peak final) |
| `BUS-11` | `T-DN-037` | DOWN | Hebbal | Silk Board | 18:36 | 18:36:00 | 19:36:00 | `T-DN-026` arr Silk Board 17:10:00 + 75m repos. | 18:25:00 | +11 min | ✅ Operated (+5m delay; arr Silk Board) |

#### Evening Peak Feasibility & Physical Fleet Dispersion Audit:
A rigorous chronological audit of vehicle positions at 17:00:00 (the start of the evening peak) reveals the physical dispersion of the 10 active vehicles:
1. **Physical Locations at 17:00:00:**
   - **`BUS-01`:** Operating `T-DN-027` (dep Hebbal 16:30, arr Silk Board 17:25). At 17:00:00, `BUS-01` is en route to Silk Board. It cannot physically depart Hebbal at 17:00:00 (`T-DN-029`). Adding 75 minutes ($10\text{m recovery} + 55\text{m deadhead} + 10\text{m buffer}$) from its 17:25:00 Silk Board arrival yields earliest readiness at Hebbal at **18:40:00**.
   - **`BUS-02`:** Operating `T-DN-028` (dep Hebbal 16:45, arr Silk Board 17:40). At 17:00:00, `BUS-02` is en route to Silk Board. It cannot physically depart Hebbal at 17:12:00 (`T-DN-030`). Adding 75 minutes from its 17:40:00 Silk Board arrival yields earliest readiness at Hebbal at **18:55:00**.
   - **`BUS-03`:** Arrived at Hebbal at 16:40:00 on `T-UP-039`. Adding 10 minutes recovery $\implies$ ready at Hebbal at **16:50:00**. `BUS-03` is the **only active bus physically at Hebbal ready to depart at 17:00:00**. It validly operates `T-DN-029` (17:00:00) with a 10-minute buffer.
   - **`BUS-04`:** Arrived at Hebbal at 16:55:00 on `T-UP-040`. Adding 10 minutes recovery $\implies$ ready at Hebbal at **17:05:00**. Staged and physically available to operate `T-DN-030` (17:12:00) with a 7-minute buffer.
   - **`BUS-05`:** Arrived at Hebbal at 17:10:00 on `T-UP-041`. Adding 10 minutes recovery $\implies$ ready at Hebbal at **17:20:00**. Although physically present and ready at Hebbal at 17:20:00, transit dispatch reservation priority holds `BUS-05` for scheduled slot `T-DN-033` (17:48:00); it cannot be reassigned to `T-DN-031` (17:24:00) without abandoning its scheduled demonstration slot (where a pre-dispatch defect is subsequently logged at 17:40:00).
   - **`BUS-06`:** Arrives at Hebbal at 17:25:00 on `T-UP-042`. Adding 10 minutes recovery $\implies$ ready at Hebbal at **17:35:00**. Assigned to `T-DN-032` (17:36:00, +1m buffer).
   - **`BUS-07`:** Arrives at Hebbal at 17:40:00 on `T-UP-043`. Adding 10 minutes recovery $\implies$ ready at Hebbal at **17:50:00**. Assigned to `T-DN-034` (18:00:00, +10m buffer).
   - **`BUS-09`, `BUS-10`, `BUS-11`:** Ended off-peak DOWN trips at Silk Board at 16:40, 16:55, and 17:10 respectively. Repositioning back to Hebbal (+75m) establishes physical readiness at **17:55:00**, **18:10:00**, and **18:25:00** respectively.

2. **Resolution of Evening Peak Assignments & Inevitable Shortfalls:**
   - **`T-DN-029` (17:00:00):** Operates cleanly on `BUS-03` (ready at 16:50:00, +10m buffer; on-time, arr Silk Board 17:55:00).
   - **`T-DN-030` (17:12:00):** Operates cleanly on `BUS-04` (ready at 17:05:00, +7m buffer). Incurs +2m traffic delay, arriving at Silk Board at 18:09:00.
   - **`T-DN-031` (17:24:00):** **Distinguishing Physical Availability from Vehicle Reservation and Allocation Priority:** `BUS-05` arrives at Hebbal at 17:10:00 on trip `T-UP-041`. After 10 minutes of recovery, it is physically ready at 17:20:00. In this synthetic dataset, the dispatcher reserves `BUS-05` for the later scheduled trip `T-DN-033` (17:48:00) rather than assigning it to `T-DN-031` (17:24:00). `T-DN-031` is therefore a synthetic allocation-priority shortfall, **not** a case of an empty terminal or missing bus. The decision is logged prospectively at 17:09:00 (15 minutes before scheduled departure). The mechanical defect on `BUS-05` is discovered later, at 17:40:00 during pre-dispatch inspection for `T-DN-033`, leading to `T-DN-033`'s cancellation at 17:40:00. This distinction clarifies that across the 7 resource-shortfall trips, 6 are physical availability shortfalls (`T-UP-016` through `T-UP-020` at Silk Board, `T-DN-042` at Hebbal) where no vehicle was physically ready, while 1 is a synthetic reservation/allocation-priority shortfall (`T-DN-031` at Hebbal) where a bus was physically present and ready, but held by dispatch reservation priority. This reservation priority represents an illustrative prototype decision for scenario isolation, not an established BMTC dispatch policy.
   - **`T-DN-032` (17:36:00):** Operates on `BUS-06` (ready 17:35:00, +1m buffer). Incurs +3m delay, arriving at Silk Board at 18:34:00. This is the designated lead bus for the gap demonstration.
   - **`T-DN-033` (17:48:00):** Assigned to `BUS-05`. Mechanical defect discovered and logged at 17:40:00 during pre-dispatch inspection. Status: **Cancelled**.
   - **`T-DN-034` (18:00:00):** Operates on `BUS-07` (ready 17:50:00, +10m buffer). Incurs +4m delay, arriving at Silk Board at 18:59:00. Surviving **terminal departure gap** between lead bus `BUS-06` (departed Hebbal at 17:36:00) and trailing bus `BUS-07` (departed Hebbal at 18:00:00) is **exactly 24 minutes** (1,440 s), triggering the large-gap alert (evaluated as a departure-to-departure measurement at common origin terminal `hebbal-down`, not an observed stop-arrival headway).
   - **`T-DN-035` (18:12:00), `T-DN-036` (18:24:00), `T-DN-037` (18:36:00):** Operated sequentially by `BUS-09` (ready 17:55, +17m buffer; arr 19:11), `BUS-10` (ready 18:10, +14m buffer; arr 19:24), and `BUS-11` (ready 18:25, +11m buffer; arr 19:36).
   - **`T-DN-038` (18:48:00):** Operated by `BUS-01` (ready at Hebbal at 18:40:00 following repositioning from its 17:25 Silk Board arrival; +8m buffer). Incurs +6m delay, arriving at Silk Board at 19:49:00.
   - **`T-DN-039` (19:00:00):** Operated by `BUS-02` (ready at Hebbal at 18:55:00 following repositioning from its 17:40 Silk Board arrival; +5m buffer). Incurs +3m delay, arriving at Silk Board at 19:58:00.
   - **`T-DN-040` (19:12:00):** Operated by `BUS-03` (ready at Hebbal at 19:10:00 following repositioning from its 17:55 Silk Board arrival; +2m buffer; on-time, arr Silk Board 20:07:00).
   - **`T-DN-041` (19:24:00):** Operated by `BUS-04` (ready at Hebbal at 19:24:00 following repositioning from its 18:09 Silk Board arrival; +0m buffer; on-time, arr Silk Board 20:19:00).
   - **`T-DN-042` (19:36:00):** No active vehicle can reach Hebbal by 19:36:00 (`BUS-06` arrives at Silk Board at 18:34:00 + 75m repos $\implies$ ready at Hebbal at 19:49:00, 13 minutes late). Confirmed **resource shortfall** logged at 19:21:00.
   - **`T-DN-043` (19:48:00):** Operated by `BUS-06`, arriving ready at Hebbal at 19:49:00 (1 minute after scheduled departure). Operated late (+1m gate breach) departing at 19:49:00 and arriving at Silk Board at 20:44:00 (55 min travel duration; final revenue trip).

3. **End-of-Day Terminal Staging (21:00:00):**
   - At the conclusion of revenue service, 9 of the 10 operating buses (`BUS-01`, `BUS-02`, `BUS-03`, `BUS-04`, `BUS-06`, `BUS-07`, `BUS-09`, `BUS-10`, `BUS-11`) have safely concluded their final revenue trips at the southern terminus and are staged at the **Silk Board depot**.
   - Defective `BUS-05` is staged at **Hebbal depot** awaiting maintenance.
   - Defective `BUS-08` is staged at **Silk Board depot** awaiting maintenance (withdrawn since 08:10:00).
   - Dedicated standby buses `BUS-12` (Silk Board) and `BUS-13` (Hebbal) remain in position at their respective depots, 100% available and uncompromised.

### 6.3 Scheduled Timetable & Trips (86 Scheduled Departures)

Operating across start-inclusive, end-exclusive daily service windows $[T_{\text{start}}, T_{\text{end}})$:
- **Morning Peak $[07:00, 10:00)$ UP:** 180 min / 12 min = **15 departures** (`T-UP-001` to `T-UP-015`).
- **Midday Off‑Peak $[10:00, 17:00)$ Bidirectional:** 420 min / 15 min = 28 UP departures + 28 DOWN departures = **56 departures** (`T-UP-016` to `T-UP-043`, `T-DN-001` to `T-DN-028`).
  - Nominal driver roster transitions at boundary 14:00:00 from Shift 1 to Shift 2. Trips crossing the shift boundary while en route (such as `T-DN-015`, 13:30–14:25) are operated through to the destination terminal by the commencing driver; actual in-transit driver swaps are outside this prototype's data model (see §1.8). Standby driver coverage transitions cleanly from `CREW-12` (Shift 1) to `CREW-24` (Shift 2) at 14:00:00.
  - `T-DN-015` departs Hebbal at 13:30:00, arrives Silk Board at 14:25:00 (`final_outcome = operated`).
- **Evening Peak $[17:00, 20:00)$ DOWN:** 180 min / 12 min = **15 departures** (`T-DN-029` to `T-DN-043`).
- **Total Scheduled Trips:** $15 + 56 + 15 = \mathbf{86\text{ scheduled trip slots}}$.
  - **77 Operated Trips** (`final_outcome = operated`, including the 3 late-operated trips `T-UP-014`, `T-UP-015`, and `T-DN-043`).
  - **2 Cancelled Trips** (`final_outcome = cancelled`): `T-UP-008` (morning peak, `BUS-08`, recorded at 08:10:00) and `T-DN-033` (evening peak, `BUS-05`, recorded at 17:40:00).
  - **7 Resource-Shortfall Trips** (`final_outcome = resource_shortfall`): 6 physical availability shortfalls where no bus is physically present (5 morning slots `T-UP-016` to `T-UP-020` at Silk Board recorded at 09:55:00, and 1 evening slot `T-DN-042` at Hebbal recorded at 19:21:00) plus 1 synthetic allocation-priority shortfall (`T-DN-031` at Hebbal recorded at 17:09:00 where `BUS-05` was physically ready at 17:20:00 but held by synthetic dispatch reservation priority for `T-DN-033`). Total: 7 slots.
  - **Operational KPIs:**
    - Cancellation Rate: $2 / 86 = \mathbf{2.33\%}$
    - Resource-Shortfall Rate: $7 / 86 = \mathbf{8.14\%}$
    - Combined Non-Operated Rate: $9 / 86 = \mathbf{10.47\%}$
    - Operated-Trip Fulfillment Rate: $77 / 86 = \mathbf{89.53\%}$

#### 86-Slot Trip-to-Bus Assignment & Operational Outcome Schedule:
Every scheduled slot across the 86-trip timetable is audited against physical vehicle location, turnaround recovery, and actual arrival times (accounting for injected congestion delays). Non-operating slots are explicitly documented:

##### 1. Morning Peak UP $[07:00, 10:00)$ (Silk Board $\rightarrow$ Hebbal, 15 Trips)
| Slot | Trip ID | Sched Dep | Sched Arr | Assigned Bus | Preceding Event / Actual Arrival | Earliest Ready Time | Operational Outcome & Verification Note |
|:---:|:---:|:---:|:---:|:---:|:---|:---:|:---|
| 1 | `T-UP-001` | 07:00 | 07:55 | `BUS-01` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (Act dep 07:00:30, arr 07:55:30) |
| 2 | `T-UP-002` | 07:12 | 08:07 | `BUS-02` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+2m delay; arr 08:09:00) |
| 3 | `T-UP-003` | 07:24 | 08:19 | `BUS-03` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+3m delay; arr 08:22:00) |
| 4 | `T-UP-004` | 07:36 | 08:31 | `BUS-04` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+3m delay; arr 08:34:00) |
| 5 | `T-UP-005` | 07:48 | 08:43 | `BUS-05` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+4m delay; arr 08:47:00) |
| 6 | `T-UP-006` | 08:00 | 08:55 | `BUS-06` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+4m delay; bunched lead bus) |
| 7 | `T-UP-007` | 08:12 | 09:07 | `BUS-07` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+5m delay; bunched trail bus) |
| 8 | `T-UP-008` | 08:24 | 09:19 | `BUS-08` | Staged at depot; pre-dispatch defect | Out of service | ⚠️ `CANCELLED` (Logged 08:10:00; mechanical defect) |
| 9 | `T-UP-009` | 08:36 | 09:31 | `BUS-09` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+5m delay; arr 09:36:00) |
| 10 | `T-UP-010` | 08:48 | 09:43 | `BUS-10` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (+6m delay; arr 09:49:00) |
| 11 | `T-UP-011` | 09:00 | 09:55 | `BUS-11` | Initial staging at Silk Board depot | 07:00:00 | ✅ `OPERATED` (On-time; arr 09:55:00) |
| 12 | `T-UP-012` | 09:12 | 10:07 | `BUS-01` | `T-UP-001` arr Hebbal 07:55:30 + 75m reposition | 09:10:30 | ✅ `OPERATED` (+90s buffer; arr 10:07:00) |
| 13 | `T-UP-013` | 09:24 | 10:19 | `BUS-02` | `T-UP-002` arr Hebbal 08:09:00 (+2m) + 75m reposition | 09:24:00 | ✅ `OPERATED` (0m buffer; arr 10:19:00) |
| 14 | `T-UP-014` | 09:36 | 10:31 | `BUS-03` | `T-UP-003` arr Hebbal 08:22:00 (+3m) + 75m reposition | 09:37:00 | ✅ `OPERATED LATE` (Act dep 09:37:00, arr 10:32:00; 55m duration) |
| 15 | `T-UP-015` | 09:48 | 10:43 | `BUS-04` | `T-UP-004` arr Hebbal 08:34:00 (+3m) + 75m reposition | 09:49:00 | ✅ `OPERATED LATE` (Act dep 09:49:00, arr 10:44:00; 55m duration) |

##### 2. Midday Off-Peak DOWN $[10:00, 17:00)$ (Hebbal $\rightarrow$ Silk Board, 28 Trips)
| Slot | Trip ID | Sched Dep | Sched Arr | Assigned Bus | Preceding Event / Actual Arrival | Earliest Ready Time | Operational Outcome & Verification Note |
|:---:|:---:|:---:|:---:|:---:|:---|:---:|:---|
| 16 | `T-DN-001` | 10:00 | 10:55 | `BUS-05` | `T-UP-005` arr Hebbal 08:47:00 + 10m recovery | 08:57:00 | ✅ `OPERATED` (+63m buffer; arr 10:55:00) |
| 17 | `T-DN-002` | 10:15 | 11:10 | `BUS-06` | `T-UP-006` arr Hebbal 08:59:00 + 10m recovery | 09:09:00 | ✅ `OPERATED` (+66m buffer; arr 11:10:00) |
| 18 | `T-DN-003` | 10:30 | 11:25 | `BUS-07` | `T-UP-007` arr Hebbal 09:12:00 + 10m recovery | 09:22:00 | ✅ `OPERATED` (+68m buffer; arr 11:25:00) |
| 19 | `T-DN-004` | 10:45 | 11:40 | `BUS-09` | `T-UP-009` arr Hebbal 09:36:00 + 10m recovery | 09:46:00 | ✅ `OPERATED` (+59m buffer; arr 11:40:00) |
| 20 | `T-DN-005` | 11:00 | 11:55 | `BUS-10` | `T-UP-010` arr Hebbal 09:49:00 + 10m recovery | 09:59:00 | ✅ `OPERATED` (+61m buffer; arr 11:55:00) |
| 21 | `T-DN-006` | 11:15 | 12:10 | `BUS-11` | `T-UP-011` arr Hebbal 09:55:00 + 10m recovery | 10:05:00 | ✅ `OPERATED` (+70m buffer; arr 12:10:00) |
| 22 | `T-DN-007` | 11:30 | 12:25 | `BUS-01` | `T-UP-012` arr Hebbal 10:07:00 + 10m recovery | 10:17:00 | ✅ `OPERATED` (+73m buffer; arr 12:25:00) |
| 23 | `T-DN-008` | 11:45 | 12:40 | `BUS-02` | `T-UP-013` arr Hebbal 10:19:00 + 10m recovery | 10:29:00 | ✅ `OPERATED` (+76m buffer; arr 12:40:00) |
| 24 | `T-DN-009` | 12:00 | 12:55 | `BUS-03` | `T-UP-014` arr Hebbal 10:32:00 + 10m recovery | 10:42:00 | ✅ `OPERATED` (+78m buffer; arr 12:55:00) |
| 25 | `T-DN-010` | 12:15 | 13:10 | `BUS-04` | `T-UP-015` arr Hebbal 10:44:00 + 10m recovery | 10:54:00 | ✅ `OPERATED` (+81m buffer; arr 13:10:00) |
| 26 | `T-DN-011` | 12:30 | 13:25 | `BUS-05` | `T-UP-021` arr Hebbal 12:10:00 + 10m recovery | 12:20:00 | ✅ `OPERATED` (+10m buffer; arr 13:25:00) |
| 27 | `T-DN-012` | 12:45 | 13:40 | `BUS-06` | `T-UP-022` arr Hebbal 12:25:00 + 10m recovery | 12:35:00 | ✅ `OPERATED` (+10m buffer; arr 13:40:00) |
| 28 | `T-DN-013` | 13:00 | 13:55 | `BUS-07` | `T-UP-023` arr Hebbal 12:40:00 + 10m recovery | 12:50:00 | ✅ `OPERATED` (+10m buffer; arr 13:55:00) |
| 29 | `T-DN-014` | 13:15 | 14:10 | `BUS-09` | `T-UP-024` arr Hebbal 12:55:00 + 10m recovery | 13:05:00 | ✅ `OPERATED` (+10m buffer; arr 14:10:00) |
| 30 | `T-DN-015` | 13:30 | 14:25 | `BUS-10` | `T-UP-025` arr Hebbal 13:10:00 + 10m recovery | 13:20:00 | ✅ `OPERATED` (Shift boundary run; arr 14:25:00) |
| 31 | `T-DN-016` | 13:45 | 14:40 | `BUS-11` | `T-UP-026` arr Hebbal 13:25:00 + 10m recovery | 13:35:00 | ✅ `OPERATED` (+10m buffer; arr 14:40:00) |
| 32 | `T-DN-017` | 14:00 | 14:55 | `BUS-01` | `T-UP-027` arr Hebbal 13:40:00 + 10m recovery | 13:50:00 | ✅ `OPERATED` (+10m buffer; arr 14:55:00) |
| 33 | `T-DN-018` | 14:15 | 15:10 | `BUS-02` | `T-UP-028` arr Hebbal 13:55:00 + 10m recovery | 14:05:00 | ✅ `OPERATED` (+10m buffer; arr 15:10:00) |
| 34 | `T-DN-019` | 14:30 | 15:25 | `BUS-03` | `T-UP-029` arr Hebbal 14:10:00 + 10m recovery | 14:20:00 | ✅ `OPERATED` (+10m buffer; arr 15:25:00) |
| 35 | `T-DN-020` | 14:45 | 15:40 | `BUS-04` | `T-UP-030` arr Hebbal 14:25:00 + 10m recovery | 14:35:00 | ✅ `OPERATED` (+10m buffer; arr 15:40:00) |
| 36 | `T-DN-021` | 15:00 | 15:55 | `BUS-05` | `T-UP-031` arr Hebbal 14:40:00 + 10m recovery | 14:50:00 | ✅ `OPERATED` (+10m buffer; arr 15:55:00) |
| 37 | `T-DN-022` | 15:15 | 16:10 | `BUS-06` | `T-UP-032` arr Hebbal 14:55:00 + 10m recovery | 15:05:00 | ✅ `OPERATED` (+10m buffer; arr 16:10:00) |
| 38 | `T-DN-023` | 15:30 | 16:25 | `BUS-07` | `T-UP-033` arr Hebbal 15:10:00 + 10m recovery | 15:20:00 | ✅ `OPERATED` (+10m buffer; arr 16:25:00) |
| 39 | `T-DN-024` | 15:45 | 16:40 | `BUS-09` | `T-UP-034` arr Hebbal 15:25:00 + 10m recovery | 15:35:00 | ✅ `OPERATED` (+10m buffer; arr 16:40:00) |
| 40 | `T-DN-025` | 16:00 | 16:55 | `BUS-10` | `T-UP-035` arr Hebbal 15:40:00 + 10m recovery | 15:50:00 | ✅ `OPERATED` (+10m buffer; arr 16:55:00) |
| 41 | `T-DN-026` | 16:15 | 17:10 | `BUS-11` | `T-UP-036` arr Hebbal 15:55:00 + 10m recovery | 16:05:00 | ✅ `OPERATED` (+10m buffer; arr 17:10:00) |
| 42 | `T-DN-027` | 16:30 | 17:25 | `BUS-01` | `T-UP-037` arr Hebbal 16:10:00 + 10m recovery | 16:20:00 | ✅ `OPERATED` (+10m buffer; arr 17:25:00) |
| 43 | `T-DN-028` | 16:45 | 17:40 | `BUS-02` | `T-UP-038` arr Hebbal 16:25:00 + 10m recovery | 16:35:00 | ✅ `OPERATED` (+10m buffer; arr 17:40:00) |

##### 3. Midday Off-Peak UP $[10:00, 17:00)$ (Silk Board $\rightarrow$ Hebbal, 28 Trips)
| Slot | Trip ID | Sched Dep | Sched Arr | Assigned Bus | Preceding Event / Actual Arrival | Earliest Ready Time | Operational Outcome & Verification Note |
|:---:|:---:|:---:|:---:|:---:|:---|:---:|:---|
| 44 | `T-UP-016` | 10:00 | 10:55 | *None* | No active vehicle present at Silk Board | 11:05:00 | ❌ `RESOURCE SHORTFALL` (Logged 09:55; Silk Board fleet vacuum) |
| 45 | `T-UP-017` | 10:15 | 11:10 | *None* | No active vehicle present at Silk Board | 11:20:00 | ❌ `RESOURCE SHORTFALL` (Logged 09:55; Silk Board fleet vacuum) |
| 46 | `T-UP-018` | 10:30 | 11:25 | *None* | No active vehicle present at Silk Board | 11:35:00 | ❌ `RESOURCE SHORTFALL` (Logged 09:55; Silk Board fleet vacuum) |
| 47 | `T-UP-019` | 10:45 | 11:40 | *None* | No active vehicle present at Silk Board | 11:50:00 | ❌ `RESOURCE SHORTFALL` (Logged 09:55; Silk Board fleet vacuum) |
| 48 | `T-UP-020` | 11:00 | 11:55 | *None* | Earliest bus `BUS-05` arrives 10:55, ready 11:05 | 11:05:00 | ❌ `RESOURCE SHORTFALL` (Logged 09:55; 5-min availability deficit) |
| 49 | `T-UP-021` | 11:15 | 12:10 | `BUS-05` | `T-DN-001` arr Silk Board 10:55:00 + 10m recovery | 11:05:00 | ✅ `OPERATED` (+10m buffer; arr 12:10:00) |
| 50 | `T-UP-022` | 11:30 | 12:25 | `BUS-06` | `T-DN-002` arr Silk Board 11:10:00 + 10m recovery | 11:20:00 | ✅ `OPERATED` (+10m buffer; arr 12:25:00) |
| 51 | `T-UP-023` | 11:45 | 12:40 | `BUS-07` | `T-DN-003` arr Silk Board 11:25:00 + 10m recovery | 11:35:00 | ✅ `OPERATED` (+10m buffer; arr 12:40:00) |
| 52 | `T-UP-024` | 12:00 | 12:55 | `BUS-09` | `T-DN-004` arr Silk Board 11:40:00 + 10m recovery | 11:50:00 | ✅ `OPERATED` (+10m buffer; arr 12:55:00) |
| 53 | `T-UP-025` | 12:15 | 13:10 | `BUS-10` | `T-DN-005` arr Silk Board 11:55:00 + 10m recovery | 12:05:00 | ✅ `OPERATED` (+10m buffer; arr 13:10:00) |
| 54 | `T-UP-026` | 12:30 | 13:25 | `BUS-11` | `T-DN-006` arr Silk Board 12:10:00 + 10m recovery | 12:20:00 | ✅ `OPERATED` (+10m buffer; arr 13:25:00) |
| 55 | `T-UP-027` | 12:45 | 13:40 | `BUS-01` | `T-DN-007` arr Silk Board 12:25:00 + 10m recovery | 12:35:00 | ✅ `OPERATED` (+10m buffer; arr 13:40:00) |
| 56 | `T-UP-028` | 13:00 | 13:55 | `BUS-02` | `T-DN-008` arr Silk Board 12:40:00 + 10m recovery | 12:50:00 | ✅ `OPERATED` (+10m buffer; arr 13:55:00) |
| 57 | `T-UP-029` | 13:15 | 14:10 | `BUS-03` | `T-DN-009` arr Silk Board 12:55:00 + 10m recovery | 13:05:00 | ✅ `OPERATED` (+10m buffer; arr 14:10:00) |
| 58 | `T-UP-030` | 13:30 | 14:25 | `BUS-04` | `T-DN-010` arr Silk Board 13:10:00 + 10m recovery | 13:20:00 | ✅ `OPERATED` (+10m buffer; arr 14:25:00) |
| 59 | `T-UP-031` | 13:45 | 14:40 | `BUS-05` | `T-DN-011` arr Silk Board 13:25:00 + 10m recovery | 13:35:00 | ✅ `OPERATED` (+10m buffer; arr 14:40:00) |
| 60 | `T-UP-032` | 14:00 | 14:55 | `BUS-06` | `T-DN-012` arr Silk Board 13:40:00 + 10m recovery | 13:50:00 | ✅ `OPERATED` (+10m buffer; arr 14:55:00) |
| 61 | `T-UP-033` | 14:15 | 15:10 | `BUS-07` | `T-DN-013` arr Silk Board 13:55:00 + 10m recovery | 14:05:00 | ✅ `OPERATED` (+10m buffer; arr 15:10:00) |
| 62 | `T-UP-034` | 14:30 | 15:25 | `BUS-09` | `T-DN-014` arr Silk Board 14:10:00 + 10m recovery | 14:20:00 | ✅ `OPERATED` (+10m buffer; arr 15:25:00) |
| 63 | `T-UP-035` | 14:45 | 15:40 | `BUS-10` | `T-DN-015` arr Silk Board 14:25:00 + 10m recovery | 14:35:00 | ✅ `OPERATED` (+10m buffer; arr 15:40:00) |
| 64 | `T-UP-036` | 15:00 | 15:55 | `BUS-11` | `T-DN-016` arr Silk Board 14:40:00 + 10m recovery | 14:50:00 | ✅ `OPERATED` (+10m buffer; arr 15:55:00) |
| 65 | `T-UP-037` | 15:15 | 16:10 | `BUS-01` | `T-DN-017` arr Silk Board 14:55:00 + 10m recovery | 15:05:00 | ✅ `OPERATED` (+10m buffer; arr 16:10:00) |
| 66 | `T-UP-038` | 15:30 | 16:25 | `BUS-02` | `T-DN-018` arr Silk Board 15:10:00 + 10m recovery | 15:20:00 | ✅ `OPERATED` (+10m buffer; arr 16:25:00) |
| 67 | `T-UP-039` | 15:45 | 16:40 | `BUS-03` | `T-DN-019` arr Silk Board 15:25:00 + 10m recovery | 15:35:00 | ✅ `OPERATED` (+10m buffer; arr 16:40:00) |
| 68 | `T-UP-040` | 16:00 | 16:55 | `BUS-04` | `T-DN-020` arr Silk Board 15:40:00 + 10m recovery | 15:50:00 | ✅ `OPERATED` (+10m buffer; arr 16:55:00) |
| 69 | `T-UP-041` | 16:15 | 17:10 | `BUS-05` | `T-DN-021` arr Silk Board 15:55:00 + 10m recovery | 16:05:00 | ✅ `OPERATED` (+10m buffer; arr 17:10:00) |
| 70 | `T-UP-042` | 16:30 | 17:25 | `BUS-06` | `T-DN-022` arr Silk Board 16:10:00 + 10m recovery | 16:20:00 | ✅ `OPERATED` (+10m buffer; arr 17:25:00) |
| 71 | `T-UP-043` | 16:45 | 17:40 | `BUS-07` | `T-DN-023` arr Silk Board 16:25:00 + 10m recovery | 16:35:00 | ✅ `OPERATED` (+10m buffer; arr 17:40:00) |

##### 4. Evening Peak DOWN $[17:00, 20:00)$ (Hebbal $\rightarrow$ Silk Board, 15 Trips)
| Slot | Trip ID | Sched Dep | Sched Arr | Assigned Bus | Preceding Event / Actual Arrival | Earliest Ready Time | Operational Outcome & Verification Note |
|:---:|:---:|:---:|:---:|:---:|:---|:---:|:---|
| 72 | `T-DN-029` | 17:00 | 17:55 | `BUS-03` | `T-UP-039` arr Hebbal 16:40:00 + 10m recovery | 16:50:00 | ✅ `OPERATED` (+10m buffer; arr 17:55:00) |
| 73 | `T-DN-030` | 17:12 | 18:07 | `BUS-04` | `T-UP-040` arr Hebbal 16:55:00 + 10m recovery | 17:05:00 | ✅ `OPERATED` (+7m buffer; +2m delay; arr 18:09:00) |
| 74 | `T-DN-031` | 17:24 | 18:19 | *None* | Synthetic allocation priority (BUS-05 ready 17:20:00 but held for T-DN-033) | — | ❌ `RESOURCE SHORTFALL` (Logged 17:09:00; synthetic reservation priority, not empty terminal) |
| 75 | `T-DN-032` | 17:36 | 18:31 | `BUS-06` | `T-UP-042` arr Hebbal 17:25:00 + 10m recovery | 17:35:00 | ✅ `OPERATED` (+1m buffer; +3m delay; arr 18:34:00; lead bus for gap) |
| 76 | `T-DN-033` | 17:48 | 18:43 | `BUS-05` | `T-UP-041` arr Hebbal 17:10:00; pre-dispatch defect | Out of service | ⚠️ `CANCELLED` (Logged 17:40:00; mechanical defect; creates 24-min gap) |
| 77 | `T-DN-034` | 18:00 | 18:55 | `BUS-07` | `T-UP-043` arr Hebbal 17:40:00 + 10m recovery | 17:50:00 | ✅ `OPERATED` (+10m buffer; +4m delay; arr 18:59:00; trail bus for gap) |
| 78 | `T-DN-035` | 18:12 | 19:07 | `BUS-09` | `T-DN-024` arr Silk Board 16:40:00 + 75m repos. | 17:55:00 | ✅ `OPERATED` (+17m buffer; +4m delay; arr 19:11:00) |
| 79 | `T-DN-036` | 18:24 | 19:19 | `BUS-10` | `T-DN-025` arr Silk Board 16:55:00 + 75m repos. | 18:10:00 | ✅ `OPERATED` (+14m buffer; +5m delay; arr 19:24:00) |
| 80 | `T-DN-037` | 18:36 | 19:31 | `BUS-11` | `T-DN-026` arr Silk Board 17:10:00 + 75m repos. | 18:25:00 | ✅ `OPERATED` (+11m buffer; +5m delay; arr 19:36:00) |
| 81 | `T-DN-038` | 18:48 | 19:43 | `BUS-01` | `T-DN-027` arr Silk Board 17:25:00 + 75m repos. | 18:40:00 | ✅ `OPERATED` (+8m buffer; +6m delay; arr 19:49:00) |
| 82 | `T-DN-039` | 19:00 | 19:55 | `BUS-02` | `T-DN-028` arr Silk Board 17:40:00 + 75m repos. | 18:55:00 | ✅ `OPERATED` (+5m buffer; +3m delay; arr 19:58:00) |
| 83 | `T-DN-040` | 19:12 | 20:07 | `BUS-03` | `T-DN-029` arr Silk Board 17:55:00 + 75m repos. | 19:10:00 | ✅ `OPERATED` (+2m buffer; arr 20:07:00) |
| 84 | `T-DN-041` | 19:24 | 20:19 | `BUS-04` | `T-DN-030` arr Silk Board 18:09:00 + 75m repos. | 19:24:00 | ✅ `OPERATED` (+0m buffer; arr 20:19:00) |
| 85 | `T-DN-042` | 19:36 | 20:31 | *None* | Fleet shortfall at Hebbal rotation end | — | ❌ `RESOURCE SHORTFALL` (Logged 19:21:00; no active vehicle available at Hebbal) |
| 86 | `T-DN-043` | 19:48 | 20:43 | `BUS-06` | `T-DN-032` arr Silk Board 18:34:00 + 75m repos. | 19:49:00 | ✅ `OPERATED LATE` (Act dep 19:49:00, arr 20:44:00; 55m duration) |

#### Minimal Internally Consistent Scheduling Alternatives for Review:
To reconcile physical fleet feasibility with prototype demonstration goals, four alternatives were audited. As detailed in §6.2, **Alternative 1 (Nominal Timetable with Explicit Resource-Shortfall Outcomes)** has been formally adopted as the specification baseline:

- **Alternative 1: Nominal Timetable with Explicit Resource-Shortfall Outcomes (Adopted Baseline):**
  - Retain the published 86-trip schedule definition in `scheduled_trips.csv` as the authority's nominal target timetable.
  - Explicitly model 77 operated trips (including the three late-operated trips `T-UP-014`, `T-UP-015`, `T-DN-043`), 2 cancellations (`T-UP-008`, `T-DN-033`), and 7 resource shortfalls (`T-UP-016` to `T-UP-020`, `T-DN-031`, `T-DN-042`).
  - *Advantage:* Preserves the full target timetable grid, transparently surfaces peak-load and fleet-deficit operational realities, maintains full relational referential integrity, and keeps standby buses strictly reserved for emergency relief.

- **Alternative 2: Split 07:00 Initial Staging (Operational Staging Calibration):**
  - Adjust the initial 07:00:00 staging from 11 buses at Silk Board to a split staging: 6 active buses at Silk Board (`BUS-01` to `BUS-06`) and 5 active buses at Hebbal (`BUS-07` to `BUS-11`), or deadhead 5 empty buses from Hebbal to Silk Board between 09:00 and 10:00.
  - *Advantage:* Completely eliminates the 5-slot vacuum at Silk Board at 10:00:00, allowing `T-UP-016` to `T-UP-020` to operate on schedule.

- **Alternative 3: Staggered Off-Peak Ramp (Directional Timetable Alignment):**
  - Align off-peak commencement with directional vehicle availability: commence DOWN off-peak service from Hebbal at 10:00:00, and commence UP off-peak service from Silk Board at 11:15:00 (when `BUS-05` arrives and completes recovery).
  - *Advantage:* Accurately reflects unidirectional tidal peak transit dynamics without requiring empty deadhead repositioning.

- **Alternative 4: Delay Calibration & Maintenance Depot Return (Unadopted Counterfactual):**
  - Cap injected peak traffic delays for `T-UP-003`, `T-UP-004`, and `T-DN-032` at +2 minutes (rather than +3 minutes), or compress terminal recovery from 10 minutes to 9 minutes on turnaround to satisfy departure gates.
  - Model `BUS-08` returning to service after minor depot repair by 11:30:00 to restore full 11-bus operational capacity for the afternoon and evening.
  - *Counterfactual Status:* Unadopted. Maintained solely as an illustrative planning counterfactual; Alternative 1 remains the adopted operational baseline.

### 6.4 Vehicle Positions (`bus_positions.csv`)

- Only operating trips generate position records; cancelled and resource-shortfall trips produce 0 records.
- Records are sampled at 60-second intervals from stop 1 departure through stop 12 arrival inclusive ($M + 1$ records for an $M$-minute elapsed trip).
- If an actual elapsed trip duration is not an exact multiple of 60 seconds, the final arrival event at stop 12 is captured at the exact arrival timestamp as an observation with $\text{speed\_kmh} = 0$. In this demo dataset, each completed trip's duration is calibrated to an integer number of minutes so every $D$-minute trip yields exactly $D + 1$ records.
- **55-Minute Duration Count (61 Trips):** 61 operated trips have a 55-minute travel duration (including the three late-operated trips `T-UP-014`, `T-UP-015`, and `T-DN-043`):
  $61\text{ trips} \times 56\text{ records} = \mathbf{3,416\text{ records}}.$
- **Deterministic Delays for 16 Congested Peak Trips:** Exactly 16 trips incur deterministic peak traffic delays summing to **exactly 64 minutes** of additional elapsed duration (+64 records):
  - Morning Peak UP (8 trips, summing to 32 min): `T-UP-002` (+2 min, 58 records), `T-UP-003` (+3 min, 59 records), `T-UP-004` (+3 min, 59 records), `T-UP-005` (+4 min, 60 records), `T-UP-006` (+4 min, 60 records), `T-UP-007` (+5 min, 61 records), `T-UP-009` (+5 min, 61 records), `T-UP-010` (+6 min, 62 records). (Subtotal: $8 \times 56 + 32 = 480\text{ records}$).
  - Evening Peak DOWN (8 trips, summing to 32 min): `T-DN-030` (+2 min, 58 records), `T-DN-032` (+3 min, 59 records), `T-DN-034` (+4 min, 60 records), `T-DN-035` (+4 min, 60 records), `T-DN-036` (+5 min, 61 records), `T-DN-037` (+5 min, 61 records), `T-DN-038` (+6 min, 62 records), `T-DN-039` (+3 min, 59 records). (Subtotal: $8 \times 56 + 32 = 480\text{ records}$).
  - Combined subtotal for 16 delayed trips: $480 + 480 = (16 \times 56) + 64 = 896 + 64 = \mathbf{960\text{ records}}$.
- **Exact Deterministic Telemetry Count:** 
  $\text{Total Records} = (61 \times 56) + (16 \times 56 + 64) = 3{,}416 + 960 = \mathbf{4,376\text{ position records}}.$
- **Exact Minimum On-Time Baseline Count (if all 77 operated trips were on-time):** $77 \times 56 = \mathbf{4,312\text{ records}}$.
- **Non-Operating Trips:** The 2 cancelled trips (`T-UP-008`, `T-DN-033`) and 7 resource-shortfall trips (`T-UP-016`–`T-UP-020`, `T-DN-031`, `T-DN-042`) produce **0 records**.

### 6.5 Stop Event Actuals (`stop_times.csv`)

- Total rows: $86\text{ trips} \times 12\text{ stops} = \mathbf{1,032\text{ stop-time rows}}$.
  - **77 operated trips:** $77 \times 12 = \mathbf{924\text{ rows}}$ with planned departure slots and recorded arrival/departure actuals (including the three late-operated trips).
  - **9 non-operating trips (2 cancelled + 7 resource shortfall):** $9 \times 12 = \mathbf{108\text{ rows}}$ retaining planned timetable slots with null actuals.

| Operational Case | Injected Pattern |
|------------------|------------------|
| **Normal Service** | Actual arrivals within ±45 s of schedule (e.g. +30 s); regular 12-min headways (720 s). |
| **Late Departure Operation** | Turnaround rotation delays push three peak trips (`T-UP-014`, `T-UP-015`, and `T-DN-043`) to depart sequence 1 exactly 1 minute late; 55-minute travel duration preserved. |
| **Bus Bunching** | Morning peak ($T_{\text{eval}} = \text{08:24:00}$): Evaluated at control stop `marathahalli-up`. Leading bus `BUS-06` (on operating trip `T-UP-006`) departed at 08:22:45. Trailing bus `BUS-07` (on operating trip `T-UP-007`) is confirmed actively dwelling (`speed_kmh = 0`, stationary geofence within 100 m, fresh telemetry, null actual departure at $T_{\text{eval}}$) at control stop `marathahalli-up`. The evaluated metric is the **current elapsed departure separation**: $\Delta T_{\text{current}} = T_{\text{eval}} - \text{08:22:45} = 75\text{ seconds}$ (< 120 s bunching threshold), which triggers the holding evaluation. The system evaluates current elapsed departure separation and explicitly does **not** claim an arrival-to-arrival headway of 75 seconds. Hold is capped at 300 s ($M_{\text{delay}}$); projected post-hold departure gap of 375 s is disclosed as a partial correction. Cancelled trip `T-UP-008` (scheduled for `BUS-08`) produces no actuals or telemetry. |
| **Large Gap (Cancelled Trip)** | Evening peak ($T_{\text{eval}} = \text{18:15:00}$): Scheduled trip slot `T-DN-033` (scheduled for `BUS-05` at 17:48 departure from Hebbal) is cancelled due to a pre-dispatch mechanical defect. Preceding operating bus `BUS-06` (`T-DN-032`, departed Hebbal at 17:36:00) and succeeding operating bus `BUS-07` (`T-DN-034`, departed Hebbal at 18:00:00) both have confirmed departure events prior to $T_{\text{eval}}$, establishing a **terminal departure gap** of **exactly 24 minutes** (1,440 s) at common origin terminal `hebbal-down`. Evaluated as a departure-to-departure measurement at a common origin terminal (not an observed stop-arrival headway) against the nominal scheduled departure interval of 12 minutes ($720\text{ s}$), with the 1.5 multiplier ($1,080\text{ s}$ threshold), the large-gap alert triggers ($1,440 > 1,080\text{ s}$). Standby bus `BUS-13` staged at `hebbal-down` and standby driver `CREW-24` on shift enable a confirmed relief deployment recommendation. |
| **Resource Shortfalls** | 7 planned timetable slots retain planned timestamps and null actuals across 12 stops. Breakdown: 6 physical availability shortfalls (`T-UP-016` to `T-UP-020` at Silk Board, `T-DN-042` at Hebbal) due to physical bus staging deficits; and 1 synthetic allocation-priority shortfall (`T-DN-031` at Hebbal) where `BUS-05` was physically ready at 17:20:00 but held by synthetic dispatch reservation priority for `T-DN-033` (an illustrative prototype decision, not an established BMTC dispatch policy). |
| **Schedule Delay** | Heavy evening congestion causes cumulative delays of up to 350+ seconds on downstream stops. |
| **Missing Observations** | 2 trips with null arrival/departure times at intermediate stops to verify data-guard resilience. |

### 6.6 Passenger Loads (`passenger_loads.csv`)

- Non-operating trips (2 cancelled trips and 7 resource-shortfall trips) produce 0 load rows.
- Total rows: $77\text{ operated trips} \times 12\text{ stops} = \mathbf{924\text{ load rows}}$.

| Operational Case | Injected Pattern |
|------------------|------------------|
| **Normal Occupancy** | Off-peak: Onboard loads between 25 and 45 passengers (42%–75% occupancy). |
| **Overcrowding Warning** | Peak trips with 62–70 passengers onboard (103%–117% of capacity). |
| **Severe Overcrowding** | Morning peak trip at Bellandur / Marathahalli with 92 passengers onboard (153% occupancy). Triggers critical crowding alert and validates the illustrative 150% threshold. |
| **Load Unknown** | Null boardings/alightings/onboard counts on 2 stop-visits to test empty/unknown UI states. Missing observations preserved as null, not zero. |

### 6.7 Minimum Record Count Inventory

| File | Exact Minimum Rows | Expected Total Rows | Rationale |
|------|--------------------|---------------------|-----------|
| `routes.csv` | 1 | 1 | 1 corridor (`silk-board-hebbal`) |
| `stops.csv` | 24 | 24 | 12 directional stops UP + 12 directional stops DOWN |
| `vehicles.csv` | 13 | 13 | 11 active buses (130-min cycle / 12-min headway) + 2 standby buses |
| `crew_availability.csv` | 24 | 24 | 24 drivers across 2 shifts (11 active + 1 standby per shift) |
| `scheduled_trips.csv` | 86 | 86 | Timetable across $[07:00, 20:00)$ (77 operated + 2 cancelled + 7 resource shortfall) |
| `stop_times.csv` | 1,032 | 1,032 | 86 trips × 12 stops (924 operated rows + 108 retained non-operating rows) |
| `bus_positions.csv` | 4,312 | 4,376 | 77 operated trips: 61 with 55m travel duration × 56 (3,416) + 16 delayed × 56 + 64 deterministic delay records (960) = exactly 4,376 records. 0 rows for cancelled or shortfall trips |
| `passenger_loads.csv` | 924 | 924 | 77 operated trips × 12 stops (0 rows for cancelled or shortfall trips) |
| `demo_assumptions.json` | 1 | 1 | Config file with all illustrative assumptions |

---

## 7. Data Provenance & Inventory

### 7.1 Source Labels

Every CSV row carries a `source_label` attribute:

| Value | Meaning |
|-------|---------|
| `synthetic` | Generated by HOGANA synthetic demo scripts; not official BMTC data. |
| `uploaded_csv` | Uploaded by an analyst via data management UI (future). |
| `live_feed` | Ingested via live transit telemetry connector (future). |

### 7.2 UI Disclaimers & Provenance Tags

1. **Global Banner:** *"Demo mode — data is simulated."* must be visible across dashboard and telemetry views.
2. **Assumption Tooltip:** Any metric derived from `demo_assumptions.json` must be badged *"Illustrative assumption — not from BMTC"*.
3. **Scenario Simulator:** Displays the disclaimer in §5.3 on all scenario runs.
4. **Reports:** Exported reports must include a footer: *"Data source: synthetic demo corridor"*.

### 7.3 Inventory of Known vs. Unavailable Data

| Data item | Status | Notes |
|-----------|--------|-------|
| Silk Board–Hebbal corridor definition | **Synthetic** | Representative corridor for prototype demonstration. |
| Stop coordinates & landmarks | **Synthetic** | Plausible landmark locations, not surveyed BMTC bus stop coordinates. |
| Scheduled timetable & trips | **Synthetic** | Simulated weekday schedule (86 departures: 77 operated, 2 cancelled, 7 resource shortfall). |
| Bus GPS positions (`bus_positions.csv`) | **Synthetic** | Interpolated simulated positions (min 4,312, expected 4,376 rows), not live GPS telemetry. |
| Actual arrival & departure events | **Synthetic** | Generated with deliberate bunching, gaps, and delays for demonstration. |
| Passenger boarding, alighting & onboard load | **Synthetic** | Simulated counts; no automated passenger counter (APC) data. |
| Vehicle fleet register & capacities | **Synthetic** | 11 active + 2 standby buses; 40 seated + 20 standing = 60 total capacity. |
| Crew rosters & standby availability | **Synthetic** | 24 drivers across 2 shifts; verified shift coverage for standby deployments. |
| Fare revenue per bus per day (Rs 14,000) | **Illustrative assumption** | From concept PDF; not verified BMTC revenue. |
| Capacity loss (25% fixed vs. 8% dynamic) | **Illustrative assumption** | From concept PDF; not verified empirical findings. |
| Revenue uplift from intervention (3%) | **Illustrative assumption** | From concept PDF; not validated revenue outcome. |
| Cost per bus-hour | **Placeholder (`null`)** | Unavailable in concept PDF. Marked unavailable in simulator. |
| Trips per hour | **Placeholder (`null`)** | Unavailable in concept PDF. |
| Subscription price (Rs 1,200/bus/month) | **Commercial assumption** | Proposed commercial assumption, not validated pricing. |
| 1,000-bus revenue example | **Arithmetic example** | Simple calculation ($1000 \times 1200$), not a customer commitment. |
| 150%–200% overcapacity claim | **Source‑pending** | Original infographic claim; demo adopts 150% of capacity as an illustrative critical threshold. |
| Live BMTC GPS feed | **Unavailable** | Not connected; simulated via synthetic time-series. |
| Live passenger sensors / smart ticketing | **Unavailable** | Not connected. |
| `Bus_Commuter_Survey_100.xlsx` | **Excluded context data** | Simulated commuter perception survey data. **Must NOT be used to derive bus positions, actual headways, or vehicle occupancy.** |

---

## 8. Readiness Checklist

The items below have been audited and verified for internal consistency:

| # | Item | Status | Verification Summary |
|---|------|--------|----------------------|
| 1 | Window conventions & departure formula | ✅ Verified | All windows are $[T_{\text{start}}, T_{\text{end}})$ start-inclusive, end-exclusive. $N_{\text{prop}} = \lceil (T_{\text{end}} - T_{\text{start}}) / f \rceil$. |
| 2 | Timetable count, outcomes & service fulfillment KPIs | ✅ Verified | 86 scheduled departures ($15 + 56 + 15$); 77 operated, 2 cancelled (`T-UP-008` and `T-DN-033`), 7 resource shortfalls (6 physical availability shortfalls `T-UP-016`–`T-UP-020`, `T-DN-042`; 1 synthetic allocation-priority shortfall `T-DN-031`). Rates verified: cancellation $2.33\%$, shortfall $8.14\%$, combined non-operated $10.47\%$, fulfillment $89.53\%$. |
| 3 | Non-operating slots in `stop_times.csv` | ✅ Verified | Retained with scheduled timestamps present and actuals null ($9 \times 12 = 108$ rows). 0 rows in positions and loads. |
| 4 | Trip-level vs stop-level timestamp invariants & normal arrivals | ✅ Verified | `scheduled_trips.scheduled_departure` matches stop 1 `scheduled_departure`; `scheduled_arrival` matches stop 12 `scheduled_arrival` (55 min travel duration). Normal-service actuals remain within $\pm 45\text{ s}$ of schedule (e.g. +30 s). |
| 5 | Fleet, cycle time & vehicle assignment validation | ✅ Verified (Full Chronological Rotation Audited) | Complete chronological vehicle rotation audit for all 11 active buses (`BUS-01`–`BUS-11`) verified across all 86 slots with non-negative turnaround buffers. Physical vehicle availability accurately represented with 77 operated trips, 2 cancellations (`T-UP-008` defect logged 08:10:00, `T-DN-033` defect logged 17:40:00), and 7 explicit resource shortfalls (6 physical availability shortfalls: 5 morning UP `T-UP-016`–`T-UP-020`, 1 evening DOWN `T-DN-042`; plus 1 synthetic allocation-priority shortfall `T-DN-031` where `BUS-05` was ready at 17:20:00 but held for `T-DN-033`). Three peak 1-minute gate breaches (`T-UP-014`, `T-UP-015`, `T-DN-043`) reconciled as operated late (+1 min) with 55 min travel duration. Standby buses `BUS-12` and `BUS-13` preserved strictly for emergency relief. Peak non-revenue return movements untracked and excluded from telemetry. |
| 6 | Crew shifts & handover boundary | ✅ Verified & Documented Limitation | Shifts are $[06:00, 14:00)$ and $[14:00, 22:00)$ start-inclusive, end-exclusive for standby eligibility. At 14:00:00, Shift 2 standby driver `CREW-24` is on duty without double-counting. *Limitation documented:* In-transit crew swaps for boundary-crossing trips (`T-DN-015`) are outside the model; initiating driver operates through to terminal. |
| 7 | Position sampling rule, deterministic delays & exact count | ✅ Verified | Telemetry sampled at 60-s intervals from departure through arrival inclusive ($M + 1$ points). 61 trips with 55m duration × 56 (3,416 records) + 16 delayed trips × 56 + 64 deterministic delay records (960 records) = **exactly 4,376 records**. Baseline minimum = 4,312. |
| 8 | Derived replay status, dwelling criteria & load timing | ✅ Verified | $\text{status}(T_{\text{eval}})$ derived without lookahead across all three outcomes (`operated`, `cancelled`, `resource_shortfall`). A cancellation or shortfall does not appear in replay before its recorded outcome time. If scheduled departure passed without actual departure or recorded outcome, status is `unknown` (`insufficient_data`). Never infer bus movement from missing departure evidence alone. `onboard_after` evaluated only from latest confirmed departure stop $\le T_{\text{eval}}$. |
| 9 | Bunching scenario & partial hold disclosure | ✅ Verified | Operating trips `T-UP-006` (`BUS-06`) and `T-UP-007` (`BUS-07`) bunched at 08:24:00 at control stop `marathahalli-up`. Metric verified as current elapsed departure separation ($75\text{ s} = \text{08:24:00} - \text{08:22:45} < 120\text{ s}$) with live dwelling confirmation for `BUS-07`; system explicitly does not claim an arrival-to-arrival headway of 75 s. Hold capped at 300 s ($M_{\text{delay}}$); projected gap 375 s explicitly disclosed as partial correction. |
| 10 | Large-gap scenario with correct cancelled ID & bus IDs | ✅ Verified | Cancelled slot `T-DN-033` (scheduled for `BUS-05` at 17:48:00) leaves 24-min terminal departure gap (1,440 s) between surviving operating buses `BUS-06` (`T-DN-032`, dep 17:36:00) and `BUS-07` (`T-DN-034`, dep 18:00:00) at common origin `hebbal-down`. Both departures confirmed $\le T_{\text{eval}}$ (18:15:00). Verified as a terminal departure gap, not an observed stop-arrival headway. Preceding bus ID verified as `BUS-06` and succeeding bus ID as `BUS-07` across all sections. Triggers 1.5x alert against nominal 12-min interval ($1440 > 1080\text{ s}$). |
| 11 | Relief deployment feasibility & non-claims | ✅ Verified | Standby bus `BUS-13` at Hebbal and on-shift driver `CREW-24` verified. Deadhead travel times explicitly not claimed. Unconfirmed status returned if data missing. |
| 12 | Load projection with integer baseline departure count ($N_{\text{base}}$) & holding simulation | ✅ Verified | $N_{\text{base}}$ counted directly from scheduled departure slots in `scheduled_trips.csv` across single or multi-frequency windows; stop denominator $N_{\text{valid}}(s) = |V(s)|$ with $< 2$ guard. Deterministic holding effect propagates downstream without modifying prior stops. |
| 13 | Entity relationships aligned | ✅ Verified | Section 2.1 notes 77 operating trips have position (4,376) and load (924) records; 2 cancelled and 7 resource-shortfall trips (6 physical availability + 1 synthetic allocation-priority) have none. Nullable `bus_id` for resource shortfalls. |
| 14 | 150% overcrowding threshold & source-pending status | ✅ Verified | Clarified as 150% of design capacity ($1.5 \times \text{capacity\_total}$); 150%–200% claim marked source-pending. |
| 15 | Survey workbook exclusion | ✅ Verified | `Bus_Commuter_Survey_100.xlsx` explicitly excluded from operational telemetry and load calculations. |
| 16 | Dispatcher approval mandatory | ✅ Verified | All recommendations advisory; human dispatcher approval required for any action. No automated dispatch. |
| 17 | Concept PDF illustrative figures preserved | ✅ Verified | Rs 14,000/day revenue, 25% vs 8% capacity loss, 3% revenue uplift, Rs 1,200/bus/month, 1,000-bus arithmetic example, and null placeholders for cost/hr and trips/hr preserved with caveats. |
| 18 | No application code or datasets generated | ✅ Confirmed | Specification work only. No CSV/JSON files, code, or package installations executed. |

---

## 9. Unresolved Data Questions

1. **Cost per Bus-Hour:** Exact hourly operating cost is unspecified in the concept PDF. Until provided or assumed, simulator operational cost impact is displayed as "Unavailable".
2. **Surveyed BMTC Stop Coordinates:** Exact physical stop coordinates on the Outer Ring Road are unavailable; synthetic landmark coordinates are utilized.
3. **Official Bus Capacity Standard:** Assumed 60 total (40 seated + 20 standing). If BMTC releases official capacity specifications, configuration can be adjusted in `demo_assumptions.json`.
4. **Infographic Citation:** The 150%–200% overcrowding statistic remains source-pending.
5. **Fleet Scheduling Feasibility & Alternative 1 Operational Implementation:** Alternative 1 has been adopted as the specification baseline: the published 86-trip schedule definition in `scheduled_trips.csv` represents the authority's nominal target grid, while physical fleet constraints are explicitly modeled via 77 operated trips, 2 cancelled trips, and 7 resource-shortfall trips (6 physical availability shortfalls `T-UP-016` to `T-UP-020`, `T-DN-042`; and 1 synthetic allocation-priority shortfall `T-DN-031`). The remaining real-world physical scheduling limitation is that unless transit management alters early morning vehicle staging (Alternative 2) or staggers off-peak commencement (Alternative 3), the 10:00–11:00 off-peak transition from Silk Board and the 17:00–17:30 evening transition from Hebbal will inherently experience vehicle shortfalls due to peak fleet displacement. Transit management may calibrate initial depot distributions prior to production field deployment.
