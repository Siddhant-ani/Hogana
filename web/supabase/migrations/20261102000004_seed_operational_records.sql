-- =============================================================================
-- HOGANA — Operational Dataset Canonical Baseline Seed (V1)
-- Auto-generated from canonical data/demo/ files
-- =============================================================================

-- Register the 9 canonical source files
INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'routes.csv', 'csv', 187, '3a82524a7b1b981e52c720035ff150a0d1e61555f5cdb73c2e47119dfb3a8197', 'org_a0000000-0000-0000-0000-000000000001/v1/routes.csv', 2, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'stops.csv', 'csv', 2310, 'c94236a962870cf1220101e82767a1d83ae130abce0c825b129f615ff3572c2c', 'org_a0000000-0000-0000-0000-000000000001/v1/stops.csv', 25, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'scheduled_trips.csv', 'csv', 9382, '922f2cc3ccc71ab063fa718d4b7c6551aeeb10003825d0784d694b2ca0551672', 'org_a0000000-0000-0000-0000-000000000001/v1/scheduled_trips.csv', 87, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'stop_times.csv', 'csv', 117355, 'e31521a337099f8fbac12c93feb730d0c9c49a47e1d058d633fd4787f5c8ad8d', 'org_a0000000-0000-0000-0000-000000000001/v1/stop_times.csv', 1033, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'passenger_loads.csv', 'csv', 59095, '25801f4a87f178c34d994133a265a7cd53916f55cc5bbe9ca3275cdbf4c3b569', 'org_a0000000-0000-0000-0000-000000000001/v1/passenger_loads.csv', 925, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'bus_positions.csv', 'csv', 428897, 'b6a6550b81b6c2bd75986e6fa7e33dfcd5b3fda0c498bb2e5a10acc37d5b4559', 'org_a0000000-0000-0000-0000-000000000001/v1/bus_positions.csv', 4377, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'vehicles.csv', 'csv', 902, 'dbd3233530a56b328d308828cf631012703e2ceeb8cff1d10a661e58671ce122', 'org_a0000000-0000-0000-0000-000000000001/v1/vehicles.csv', 14, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'crew_availability.csv', 'csv', 1307, '68a7a2594e62ca5cf92debf3d0fcb1e5c1241d7b9412519310cd33c7762bbd9a', 'org_a0000000-0000-0000-0000-000000000001/v1/crew_availability.csv', 25, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

INSERT INTO dataset_files (organization_id, dataset_version_id, file_name, file_type, file_size_bytes, sha256_hash, storage_path, line_count, validation_passed, validation_errors)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'demo_assumptions.json', 'json', 3465, '6fdc8b067146a65ec7502f3260fb0eccb8b6c63c54fa3f2032afd93416162fff', 'org_a0000000-0000-0000-0000-000000000001/v1/demo_assumptions.json', 54, TRUE, '[]'::jsonb)
ON CONFLICT (dataset_version_id, file_name) DO UPDATE SET file_size_bytes = EXCLUDED.file_size_bytes, sha256_hash = EXCLUDED.sha256_hash;

-- Routes (1 record)
INSERT INTO routes (organization_id, dataset_version_id, route_id, route_short_name, route_long_name, route_type, agency_id, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'silk-board-hebbal', 'silk-board-hebbal', 'Silk Board ↔ Hebbal Corridor', 3, 'BMTC', 'synthetic')
ON CONFLICT (dataset_version_id, route_id) DO NOTHING;

-- Stops (24 records)
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'silk-board-up', 'Silk Board Junction', 12.9172, 77.623, 1, 'UP', true, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'hsr-layout-up', 'HSR Layout', 12.9116, 77.6389, 2, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'agara-junction-up', 'Agara Junction', 12.9248, 77.6508, 3, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'iblur-junction-up', 'Iblur Junction', 12.9345, 77.6688, 4, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'bellandur-up', 'Bellandur', 12.926, 77.6762, 5, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kadubeesanahalli-up', 'Kadubeesanahalli', 12.9352, 77.6946, 6, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'marathahalli-up', 'Marathahalli', 12.9591, 77.6974, 7, 'UP', true, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'mahadevapura-up', 'Mahadevapura', 12.988, 77.6896, 8, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kr-puram-up', 'KR Puram Railway Station', 13.0012, 77.678, 9, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kasturi-nagar-up', 'Kasturi Nagar', 13.0118, 77.6542, 10, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kalyan-nagar-up', 'Kalyan Nagar', 13.0238, 77.6432, 11, 'UP', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'hebbal-up', 'Hebbal Flyover', 13.0358, 77.597, 12, 'UP', true, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'hebbal-down', 'Hebbal Flyover', 13.0358, 77.597, 1, 'DOWN', true, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kalyan-nagar-down', 'Kalyan Nagar', 13.0238, 77.6432, 2, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kasturi-nagar-down', 'Kasturi Nagar', 13.0118, 77.6542, 3, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kr-puram-down', 'KR Puram Railway Station', 13.0012, 77.678, 4, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'mahadevapura-down', 'Mahadevapura', 12.988, 77.6896, 5, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'marathahalli-down', 'Marathahalli', 12.9591, 77.6974, 6, 'DOWN', true, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'kadubeesanahalli-down', 'Kadubeesanahalli', 12.9352, 77.6946, 7, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'bellandur-down', 'Bellandur', 12.926, 77.6762, 8, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'iblur-junction-down', 'Iblur Junction', 12.9345, 77.6688, 9, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'agara-junction-down', 'Agara Junction', 12.9248, 77.6508, 10, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'hsr-layout-down', 'HSR Layout', 12.9116, 77.6389, 11, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;
INSERT INTO stops (organization_id, dataset_version_id, stop_id, stop_name, stop_lat, stop_lon, stop_sequence_order, direction, is_control_point, is_terminal, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'silk-board-down', 'Silk Board Junction', 12.9172, 77.623, 12, 'DOWN', false, FALSE, 'synthetic')
ON CONFLICT (dataset_version_id, stop_id) DO NOTHING;

-- Vehicles (13 records)
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-01', 'KA-01-F-1001', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-02', 'KA-01-F-1002', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-03', 'KA-01-F-1003', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-04', 'KA-01-F-1004', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-05', 'KA-01-F-1005', 40, 20, 60, 'maintenance', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-06', 'KA-01-F-1006', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-07', 'KA-01-F-1007', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-08', 'KA-01-F-1008', 40, 20, 60, 'maintenance', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-09', 'KA-01-F-1009', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-10', 'KA-01-F-1010', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-11', 'KA-01-F-1011', 40, 20, 60, 'active', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-12', 'KA-01-F-2001', 40, 20, 60, 'standby', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;
INSERT INTO vehicles (organization_id, dataset_version_id, bus_id, vehicle_model, capacity_seated, capacity_standing, capacity_total, status, depot_assignment, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BUS-13', 'KA-01-F-2002', 40, 20, 60, 'standby', 'Hebbal Depot', 'synthetic')
ON CONFLICT (dataset_version_id, bus_id) DO NOTHING;

-- Crew Availability (24 records)
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-01', 'CREW-01', 'SHIFT-1', '06:00', '14:00', 'BUS-01', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-02', 'CREW-02', 'SHIFT-1', '06:00', '14:00', 'BUS-02', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-03', 'CREW-03', 'SHIFT-1', '06:00', '14:00', 'BUS-03', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-04', 'CREW-04', 'SHIFT-1', '06:00', '14:00', 'BUS-04', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-05', 'CREW-05', 'SHIFT-1', '06:00', '14:00', 'BUS-05', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-06', 'CREW-06', 'SHIFT-1', '06:00', '14:00', 'BUS-06', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-07', 'CREW-07', 'SHIFT-1', '06:00', '14:00', 'BUS-07', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-08', 'CREW-08', 'SHIFT-1', '06:00', '14:00', 'BUS-08', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-09', 'CREW-09', 'SHIFT-1', '06:00', '14:00', 'BUS-09', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-10', 'CREW-10', 'SHIFT-1', '06:00', '14:00', 'BUS-10', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-11', 'CREW-11', 'SHIFT-1', '06:00', '14:00', 'BUS-11', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-12', 'CREW-12', 'SHIFT-1', '06:00', '14:00', NULL, 'standby', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-13', 'CREW-13', 'SHIFT-1', '14:00', '22:00', 'BUS-01', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-14', 'CREW-14', 'SHIFT-1', '14:00', '22:00', 'BUS-02', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-15', 'CREW-15', 'SHIFT-1', '14:00', '22:00', 'BUS-03', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-16', 'CREW-16', 'SHIFT-1', '14:00', '22:00', 'BUS-04', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-17', 'CREW-17', 'SHIFT-1', '14:00', '22:00', 'BUS-05', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-18', 'CREW-18', 'SHIFT-1', '14:00', '22:00', 'BUS-06', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-19', 'CREW-19', 'SHIFT-1', '14:00', '22:00', 'BUS-07', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-20', 'CREW-20', 'SHIFT-1', '14:00', '22:00', 'BUS-08', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-21', 'CREW-21', 'SHIFT-1', '14:00', '22:00', 'BUS-09', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-22', 'CREW-22', 'SHIFT-1', '14:00', '22:00', 'BUS-10', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-23', 'CREW-23', 'SHIFT-1', '14:00', '22:00', 'BUS-11', 'on_duty', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;
INSERT INTO crew_availability (organization_id, dataset_version_id, crew_id, driver_name, shift_id, shift_start, shift_end, assigned_bus_id, status, depot_location, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'CREW-24', 'CREW-24', 'SHIFT-1', '14:00', '22:00', NULL, 'standby', 'Silk Board Depot', 'synthetic')
ON CONFLICT (dataset_version_id, crew_id) DO NOTHING;

-- Scheduled Trips (86 records)
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-001', 'silk-board-hebbal', 'UP', '2025-03-10T07:00:00', '2025-03-10T07:55:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-002', 'silk-board-hebbal', 'UP', '2025-03-10T07:12:00', '2025-03-10T08:07:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-003', 'silk-board-hebbal', 'UP', '2025-03-10T07:24:00', '2025-03-10T08:19:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-004', 'silk-board-hebbal', 'UP', '2025-03-10T07:36:00', '2025-03-10T08:31:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-005', 'silk-board-hebbal', 'UP', '2025-03-10T07:48:00', '2025-03-10T08:43:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-006', 'silk-board-hebbal', 'UP', '2025-03-10T08:00:00', '2025-03-10T08:55:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-007', 'silk-board-hebbal', 'UP', '2025-03-10T08:12:00', '2025-03-10T09:07:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-008', 'silk-board-hebbal', 'UP', '2025-03-10T08:24:00', '2025-03-10T09:19:00', 720, 'BUS-08', NULL, 'cancelled', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-009', 'silk-board-hebbal', 'UP', '2025-03-10T08:36:00', '2025-03-10T09:31:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-010', 'silk-board-hebbal', 'UP', '2025-03-10T08:48:00', '2025-03-10T09:43:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-011', 'silk-board-hebbal', 'UP', '2025-03-10T09:00:00', '2025-03-10T09:55:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-012', 'silk-board-hebbal', 'UP', '2025-03-10T09:12:00', '2025-03-10T10:07:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-013', 'silk-board-hebbal', 'UP', '2025-03-10T09:24:00', '2025-03-10T10:19:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-014', 'silk-board-hebbal', 'UP', '2025-03-10T09:36:00', '2025-03-10T10:31:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-015', 'silk-board-hebbal', 'UP', '2025-03-10T09:48:00', '2025-03-10T10:43:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-001', 'silk-board-hebbal', 'DOWN', '2025-03-10T10:00:00', '2025-03-10T10:55:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-002', 'silk-board-hebbal', 'DOWN', '2025-03-10T10:15:00', '2025-03-10T11:10:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-003', 'silk-board-hebbal', 'DOWN', '2025-03-10T10:30:00', '2025-03-10T11:25:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-004', 'silk-board-hebbal', 'DOWN', '2025-03-10T10:45:00', '2025-03-10T11:40:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-005', 'silk-board-hebbal', 'DOWN', '2025-03-10T11:00:00', '2025-03-10T11:55:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-006', 'silk-board-hebbal', 'DOWN', '2025-03-10T11:15:00', '2025-03-10T12:10:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-007', 'silk-board-hebbal', 'DOWN', '2025-03-10T11:30:00', '2025-03-10T12:25:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-008', 'silk-board-hebbal', 'DOWN', '2025-03-10T11:45:00', '2025-03-10T12:40:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-009', 'silk-board-hebbal', 'DOWN', '2025-03-10T12:00:00', '2025-03-10T12:55:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-010', 'silk-board-hebbal', 'DOWN', '2025-03-10T12:15:00', '2025-03-10T13:10:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-011', 'silk-board-hebbal', 'DOWN', '2025-03-10T12:30:00', '2025-03-10T13:25:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-012', 'silk-board-hebbal', 'DOWN', '2025-03-10T12:45:00', '2025-03-10T13:40:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-013', 'silk-board-hebbal', 'DOWN', '2025-03-10T13:00:00', '2025-03-10T13:55:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-014', 'silk-board-hebbal', 'DOWN', '2025-03-10T13:15:00', '2025-03-10T14:10:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-015', 'silk-board-hebbal', 'DOWN', '2025-03-10T13:30:00', '2025-03-10T14:25:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-016', 'silk-board-hebbal', 'DOWN', '2025-03-10T13:45:00', '2025-03-10T14:40:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-017', 'silk-board-hebbal', 'DOWN', '2025-03-10T14:00:00', '2025-03-10T14:55:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-018', 'silk-board-hebbal', 'DOWN', '2025-03-10T14:15:00', '2025-03-10T15:10:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-019', 'silk-board-hebbal', 'DOWN', '2025-03-10T14:30:00', '2025-03-10T15:25:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-020', 'silk-board-hebbal', 'DOWN', '2025-03-10T14:45:00', '2025-03-10T15:40:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-021', 'silk-board-hebbal', 'DOWN', '2025-03-10T15:00:00', '2025-03-10T15:55:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-022', 'silk-board-hebbal', 'DOWN', '2025-03-10T15:15:00', '2025-03-10T16:10:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-023', 'silk-board-hebbal', 'DOWN', '2025-03-10T15:30:00', '2025-03-10T16:25:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-024', 'silk-board-hebbal', 'DOWN', '2025-03-10T15:45:00', '2025-03-10T16:40:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-025', 'silk-board-hebbal', 'DOWN', '2025-03-10T16:00:00', '2025-03-10T16:55:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-026', 'silk-board-hebbal', 'DOWN', '2025-03-10T16:15:00', '2025-03-10T17:10:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-027', 'silk-board-hebbal', 'DOWN', '2025-03-10T16:30:00', '2025-03-10T17:25:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-028', 'silk-board-hebbal', 'DOWN', '2025-03-10T16:45:00', '2025-03-10T17:40:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-016', 'silk-board-hebbal', 'UP', '2025-03-10T10:00:00', '2025-03-10T10:55:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-017', 'silk-board-hebbal', 'UP', '2025-03-10T10:15:00', '2025-03-10T11:10:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-018', 'silk-board-hebbal', 'UP', '2025-03-10T10:30:00', '2025-03-10T11:25:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-019', 'silk-board-hebbal', 'UP', '2025-03-10T10:45:00', '2025-03-10T11:40:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-020', 'silk-board-hebbal', 'UP', '2025-03-10T11:00:00', '2025-03-10T11:55:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-021', 'silk-board-hebbal', 'UP', '2025-03-10T11:15:00', '2025-03-10T12:10:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-022', 'silk-board-hebbal', 'UP', '2025-03-10T11:30:00', '2025-03-10T12:25:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-023', 'silk-board-hebbal', 'UP', '2025-03-10T11:45:00', '2025-03-10T12:40:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-024', 'silk-board-hebbal', 'UP', '2025-03-10T12:00:00', '2025-03-10T12:55:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-025', 'silk-board-hebbal', 'UP', '2025-03-10T12:15:00', '2025-03-10T13:10:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-026', 'silk-board-hebbal', 'UP', '2025-03-10T12:30:00', '2025-03-10T13:25:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-027', 'silk-board-hebbal', 'UP', '2025-03-10T12:45:00', '2025-03-10T13:40:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-028', 'silk-board-hebbal', 'UP', '2025-03-10T13:00:00', '2025-03-10T13:55:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-029', 'silk-board-hebbal', 'UP', '2025-03-10T13:15:00', '2025-03-10T14:10:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-030', 'silk-board-hebbal', 'UP', '2025-03-10T13:30:00', '2025-03-10T14:25:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-031', 'silk-board-hebbal', 'UP', '2025-03-10T13:45:00', '2025-03-10T14:40:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-032', 'silk-board-hebbal', 'UP', '2025-03-10T14:00:00', '2025-03-10T14:55:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-033', 'silk-board-hebbal', 'UP', '2025-03-10T14:15:00', '2025-03-10T15:10:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-034', 'silk-board-hebbal', 'UP', '2025-03-10T14:30:00', '2025-03-10T15:25:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-035', 'silk-board-hebbal', 'UP', '2025-03-10T14:45:00', '2025-03-10T15:40:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-036', 'silk-board-hebbal', 'UP', '2025-03-10T15:00:00', '2025-03-10T15:55:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-037', 'silk-board-hebbal', 'UP', '2025-03-10T15:15:00', '2025-03-10T16:10:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-038', 'silk-board-hebbal', 'UP', '2025-03-10T15:30:00', '2025-03-10T16:25:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-039', 'silk-board-hebbal', 'UP', '2025-03-10T15:45:00', '2025-03-10T16:40:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-040', 'silk-board-hebbal', 'UP', '2025-03-10T16:00:00', '2025-03-10T16:55:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-041', 'silk-board-hebbal', 'UP', '2025-03-10T16:15:00', '2025-03-10T17:10:00', 720, 'BUS-05', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-042', 'silk-board-hebbal', 'UP', '2025-03-10T16:30:00', '2025-03-10T17:25:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-UP-043', 'silk-board-hebbal', 'UP', '2025-03-10T16:45:00', '2025-03-10T17:40:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-029', 'silk-board-hebbal', 'DOWN', '2025-03-10T17:00:00', '2025-03-10T17:55:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-030', 'silk-board-hebbal', 'DOWN', '2025-03-10T17:12:00', '2025-03-10T18:07:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-031', 'silk-board-hebbal', 'DOWN', '2025-03-10T17:24:00', '2025-03-10T18:19:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-032', 'silk-board-hebbal', 'DOWN', '2025-03-10T17:36:00', '2025-03-10T18:31:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-033', 'silk-board-hebbal', 'DOWN', '2025-03-10T17:48:00', '2025-03-10T18:43:00', 720, 'BUS-05', NULL, 'cancelled', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-034', 'silk-board-hebbal', 'DOWN', '2025-03-10T18:00:00', '2025-03-10T18:55:00', 720, 'BUS-07', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-035', 'silk-board-hebbal', 'DOWN', '2025-03-10T18:12:00', '2025-03-10T19:07:00', 720, 'BUS-09', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-036', 'silk-board-hebbal', 'DOWN', '2025-03-10T18:24:00', '2025-03-10T19:19:00', 720, 'BUS-10', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-037', 'silk-board-hebbal', 'DOWN', '2025-03-10T18:36:00', '2025-03-10T19:31:00', 720, 'BUS-11', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-038', 'silk-board-hebbal', 'DOWN', '2025-03-10T18:48:00', '2025-03-10T19:43:00', 720, 'BUS-01', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-039', 'silk-board-hebbal', 'DOWN', '2025-03-10T19:00:00', '2025-03-10T19:55:00', 720, 'BUS-02', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-040', 'silk-board-hebbal', 'DOWN', '2025-03-10T19:12:00', '2025-03-10T20:07:00', 720, 'BUS-03', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-041', 'silk-board-hebbal', 'DOWN', '2025-03-10T19:24:00', '2025-03-10T20:19:00', 720, 'BUS-04', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-042', 'silk-board-hebbal', 'DOWN', '2025-03-10T19:36:00', '2025-03-10T20:31:00', 720, NULL, NULL, 'resource_shortfall', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;
INSERT INTO scheduled_trips (organization_id, dataset_version_id, trip_id, route_id, direction, scheduled_departure_time, scheduled_arrival_time, scheduled_headway_seconds, vehicle_id, driver_id, operational_status, source_label)
VALUES ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'T-DN-043', 'silk-board-hebbal', 'DOWN', '2025-03-10T19:48:00', '2025-03-10T20:43:00', 720, 'BUS-06', NULL, 'operated', 'synthetic')
ON CONFLICT (dataset_version_id, trip_id) DO NOTHING;

