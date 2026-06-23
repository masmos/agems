# AGEMS Project Documentation

> This document describes the architecture, domain model, and operational flow of the AGEMS application.

---

## 1. Overview

AGEMS is a Laravel (PHP) + Inertia.js + React (TypeScript) web application for monitoring environmental data from:

- **Monitoring Stations** (air quality telemetry)
- **Flare Sites** (flare emission telemetry)
- **Pipeline Projects** (project-level compliance/inspections)

The system continuously evaluates telemetry against configured **Thresholds** and generates **Alerts** when thresholds are breached. Alerts can be **acknowledged** by users and trigger **email notifications** (currently mail-only; critical alerts use the mail channel).

A real-time style dashboard is provided by polling JSON endpoints.

---

## 2. Tech Stack

### Backend
- **Laravel** (application framework)
- **Inertia.js** (server-driven SPA routing)
- **Spatie activitylog** (auditing changes to key models)
- **spatie/laravel-permission** (role-based notification targeting and authorization)
- **Laravel Fortify** (authentication)
- **Scheduler** (console commands)

### Frontend
- **React** with **TypeScript**
- **Inertia React adapter**
- **Vite** build tooling
- **UI components** via `@/components/ui/*` (shadcn/ui style)
- **Leaflet + react-leaflet** for maps (evidenced by dependencies and dashboard map endpoints)

---

## 3. Repository Structure (high-level)

Key folders:

- `app/` – Laravel application code
  - `app/Http/Controllers/` – request handlers (Inertia + JSON endpoints)
  - `app/Models/` – Eloquent domain models
  - `app/Services/` – domain services (alert engine)
  - `app/Notifications/` – notification classes
  - `app/Actions/` – Fortify actions (user/password flows)
  - `app/Console/Commands/` – scheduled/background commands
- `resources/js/` – React UI pages/components
- `routes/` – route definitions

---

## 4. Routing & Entry Points

### Main UI Routes (`routes/web.php`)

- `/` → Inertia page `welcome` (registration can be enabled)
- Protected by `auth` + `verified`:
  - `GET /dashboard` → `DashboardController@index`
  - `GET /dashboard/realtime` → `DashboardController@getRealtimeData` (JSON)

Resources:
- Alerts
  - `Route::resource('alerts', AlertController::class)`
  - `POST alerts/{alert}/acknowledge` → acknowledge
  - `POST alerts/bulk-acknowledge` → bulk acknowledge

- Thresholds
  - `Route::resource('/thresholds', ThresholdController::class)`

- Stations (Monitoring Stations)
  - `Route::resource('/stations', MonitoringStationController::class)`
  - `GET /stations/{station}/readings` → telemetry listing for a station

- Flare Sites
  - `Route::resource('flare-sites', FlareSiteController::class)`
  - `GET /flare-sites/{flareSite}/realtime` → flare realtime JSON

- Telemetry
  - `Route::resource('telemetry', TelemetryReadingController::class)`
  - `GET /stations/{station}/readings` → `TelemetryReadingController@getStationReadings`

- Users / Roles / Permissions
  - `Route::resource('users', UserController::class)`
  - `Route::resource('roles', RoleController::class)`
  - `Route::resource('permissions', PermissionController::class)`

- Pipeline Projects
  - `Route::resource('pipeline', PipelineProjectController::class)`
  - `PATCH /pipeline/{pipelineProject}/progress` → `updateProgress`

### Settings (`routes/settings.php`)

- Profile edit/update/destroy
- Security edit/update (password)
- Appearance (Inertia page)

### Console Scheduling (`routes/console.php`)

Scheduler triggers:
- `environmental:check-thresholds` every 5 minutes
- Additionally `environmental:check-thresholds --once` every minute when there are critical, unacknowledged alerts in last hour

---

## 5. Domain Model

### MonitoringStation
Located: `app/Models/MonitoringStation.php`

Fillable:
- `station_name`, `location`, `latitude`, `longitude`, `status`

Relationships:
- `telemetryReadings()` → one-to-many `TelemetryReading`
- `alerts()` → polymorphic morphMany `Alert` with `source`
- `inspections()` → polymorphic morphMany `Inspection` with `inspectable`
- `latestReading()` → latest telemetry by `reading_datetime`

### TelemetryReading
Located: `app/Models/TelemetryReading.php`

Fillable:
- `monitoring_station_id`, `reading_datetime`
- `aqi`, `pm2_5`, `pm10`, `methane`, `co2`, `temperature`

Relationships:
- `monitoringStation()` → belongsTo
- `alerts()` → polymorphic morphMany `Alert` with `source`

### FlareSite / FlareEmission
Controllers exist for both; flare alert evaluation is integrated into the alert engine.

### Threshold
Located: `app/Models/Threshold.php`

Fillable:
- `parameter` (string)
- `source_type` (e.g. `monitoring_station` or `flare_site`)
- `min_value`, `max_value`
- `severity` (`warning` / `critical`)
- `is_active`

Scopes:
- `scopeActive()`

### Alert
Located: `app/Models/Alert.php`

Fillable:
- `alert_type`, `source_type`, `source_id`
- `threshold_id`, `severity`, `message`
- `acknowledged`, `acknowledged_by`, `acknowledged_at`

Relationships:
- `source()` → polymorphic morphTo
- `threshold()` → belongsTo Threshold
- `acknowledgedBy()` → belongsTo User

Behavior:
- `acknowledge(User $user)` sets acknowledged flags/timestamps

---

## 6. Alert Evaluation Engine

### Core service: `AlertEngineService`
Located: `app/Services/AlertEngineService.php`

Responsibilities:
1. Load **active thresholds** for each source type
2. Fetch **active sources** with their latest reading/emission
3. For each relevant parameter value, compare with min/max thresholds
4. Create or update an unacknowledged alert
5. Send notifications for newly created alerts

#### Threshold breach logic
- If `min_value != null` and current value `< min_value` → breached
- If `max_value != null` and current value `> max_value` → breached

#### Alerts creation/update
To prevent alert spam:
- It searches for an existing unacknowledged alert matching:
  - `source_type`, `source_id`, `threshold_id`
  - `created_at >= now() - 24 hours`
- If found: updates the message and timestamp
- If not found: creates a new alert with `acknowledged=false`

#### Notification targeting
`getUsersToNotify($severity)`:
- `critical` → roles `Administrator`, `Compliance Officer`
- otherwise → roles `Administrator`, `Environmental Officer`

`ThresholdBreachedNotification` is sent via Laravel `Notification::send(...)`.

---

## 7. Request/Response Flows (Key Use Cases)

### 7.1 Recording Telemetry (Station)
Controller: `TelemetryReadingController@store`

1. Validates inputs (aqi/pm values, datetime, station_id)
2. Creates a `TelemetryReading`
3. Triggers `AlertEngineService->checkAllThresholds()` immediately
4. Redirects to `telemetry.show` for the created reading

> Bulk insert variant exists as `storeBulk` and also triggers alert evaluation.

### 7.2 Viewing Dashboard
Controller: `DashboardController@index`

- Computes statistics (counts + averages)
- Loads recent unacknowledged alerts (limit 10)
- Loads hourly trends for last 24 hours (telemetry + flare emissions)
- Loads stations for map view; falls back to demo stations when no stations exist

Real-time update:
- `DashboardController@getRealtimeData()` returns JSON with latest stats and stations.

### 7.3 Managing Thresholds
Controller: `ThresholdController`

- `index` supports filters (severity, source_type, is_active)
- `store` enforces:
  - at least one of `min_value` or `max_value` must be set
  - `source_type` must be either `monitoring_station` or `flare_site`
  - `severity` must be `warning` or `critical`
- Uses `Threshold::updateOrCreate()` keyed by (`parameter`, `source_type`, `severity`)

### 7.4 Acknowledging Alerts
Controller: `AlertController`

- `acknowledge(Alert $alert)` calls `$alert->acknowledge(Auth::user())`
- `bulkAcknowledge` updates multiple alerts where `acknowledged=false`

### 7.5 CRUD for Stations
UI example: `resources/js/pages/stations/edit.tsx`

- Uses Inertia `useForm` to prefill fields
- Submits via `put(/stations/{id})`
- Delete uses `router.delete(/stations/{id})`
- Displays summary counts passed from the backend (`alerts_count`, `telemetry_readings_count`)

Backend: `MonitoringStationController`

- `index` uses `withCount` for `alerts` and `telemetryReadings`, supports search + status filter
- `show` loads alerts (latest 10), chart data (last 7 days), and latest reading
- `store/update/destroy` are standard CRUD with validation

---

## 8. Database Schema (How to Reason About It)

Migrations exist for:
- `users`, `passkeys`, `two_factor` columns (Fortify)
- permission tables (`spatie/laravel-permission`)
- activity log tables (activitylog package)
- domain tables:
  - `pipeline_projects`
  - `monitoring_stations`
  - `telemetry_readings`
  - `flare_sites`
  - `flare_emissions`
  - `thresholds`
  - `alerts`
  - `inspections`
  - `audit_reports`

When extending the domain model, follow the existing conventions:
- Use `*_id` foreign keys for ownership where applicable
- Use polymorphic `morphMany/morphTo` for `Alert::source` and `Inspection::inspectable`

---

## 9. Scheduled Jobs & Console Commands

Console commands are defined under `app/Console/Commands/`.

Scheduler invokes:
- `environmental:check-thresholds` (5-minute cadence)

There is also a `TestAlertEngine` command and a `CheckEnvironmentalThresholds` command (names visible from files list) used for testing/verification.

---

## 10. Testing

Testing uses `pestphp/pest` (see `tests/` folder).

The suite includes:
- feature tests (e.g. dashboard test)
- unit tests

---

## 11. Development & Operations

Scripts (from `composer.json` and `package.json`):

Frontend:
- `npm run dev` (Vite)
- `npm run build`

Backend/Dev:
- `php artisan serve`
- `php artisan queue:listen --tries=1` (dev script also starts queue listener)

Quality checks:
- PHP: `pint` / `phpstan analyse`
- JS/TS: `eslint .`, `tsc --noEmit`

---

## 12. Known TODOs / Maintenance

A project TODO file exists at `TODO.md`.

Example items (from current content):
- Pagination typing issue (`prev`/`next` in a paginated response)

---

## 13. Adding a New Threshold Parameter (Implementation Notes)

To add a new telemetry parameter:
1. Add a column to `telemetry_readings` (and/or `flare_emissions` as appropriate)
2. Update `AlertEngineService` to include the parameter mapping and unit formatting
3. Ensure thresholds are created with the new `parameter` string
4. Update any UI components that render parameter charts/tables

---

## Appendix A: Where to Start Reading in Code

- `routes/web.php` – app entry points and CRUD endpoints
- `app/Services/AlertEngineService.php` – alert generation core
- `app/Http/Controllers/DashboardController.php` – dashboard aggregation & map data
- `app/Http/Controllers/*Controller.php` – CRUD per domain entity
- `app/Models/*` – model relationships and scopes

