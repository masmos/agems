export type * from './auth';
export type * from './navigation';
export type * from './ui';

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface MonitoringStation {
    id: number;
    station_name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    status: 'active' | 'maintenance' | 'offline';
    alerts_count?: number;
    created_at: string;
    updated_at: string;
    latestReading?: TelemetryReading;
    alerts?: Alert[];
}

export interface FlareSite {
    id: number;
    site_name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    status: 'active' | 'inactive';
    alerts_count?: number;
    created_at: string;
    updated_at: string;
    latestEmission?: FlareEmission;
    alerts?: Alert[];
}

export interface TelemetryReading {
    id: number;
    monitoring_station_id: number;
    reading_datetime: string;
    aqi: number | null;
    pm2_5: number | null;
    pm10: number | null;
    methane: number | null;
    co2: number | null;
    temperature: number | null;
    created_at: string;
    updated_at: string;
}

export interface FlareEmission {
    id: number;
    flare_site_id: number;
    reading_datetime: string;
    methane_level: number | null;
    co2_level: number | null;
    so2_level: number | null;
    nox_level: number | null;
    created_at: string;
    updated_at: string;
}

export interface Threshold {
    id: number;
    parameter: string;
    source_type: 'monitoring_station' | 'flare_site';
    severity: 'warning' | 'critical';
    min_value: number | null;
    max_value: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Alert {
    id: number;
    alert_type: string;
    source_type: string;
    source_id: number;
    threshold_id: number;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    acknowledged: boolean;
    acknowledged_by: number | null;
    acknowledged_at: string | null;
    created_at: string;
    updated_at: string;
    source?: MonitoringStation | FlareSite;
    threshold?: Threshold;
    acknowledgedBy?: User;
}

export interface Inspection {
    id: number;
    inspector_id: number;
    inspection_date: string;
    location: string;
    findings: string;
    status: 'pending' | 'compliant' | 'non_compliant';
    inspectable_type: string | null;
    inspectable_id: number | null;
    corrective_action: string | null;
    follow_up_date: string | null;
    created_at: string;
    updated_at: string;
    inspector?: User;
}

export interface DashboardStats {
    total_stations: number;
    active_stations: number;
    total_flares: number;
    active_flares: number;
    active_alerts: number;
    critical_alerts: number;
    total_inspections: number;
    pending_inspections: number;
    average_aqi: number;
    average_pm25: number;
}

export interface AlertTrend {
    date: string;
    critical: number;
    warning: number;
    info: number;
}

export interface AirQualityTrend {
    hour: number;
    avg_aqi: number;
    avg_pm25: number;
    avg_pm10: number;
}

export interface EmissionTrend {
    hour: number;
    avg_methane: number;
    avg_so2: number;
    avg_nox: number;
}

export interface TopStation {
    name: string;
    alert_count: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];

    // Laravel paginator also includes these URLs; used by telemetry index page.
    prev_page_url: string | null;
    next_page_url: string | null;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

// Update the User interface to include roles and permissions
export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    password?: string;
    remember_token?: string | null;
    created_at: string;
    updated_at: string;
    last_login_at?: string | null;
    roles?: Role[];
    permissions?: Permission[];
    activity?: Activity[];
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions?: Permission[];
    created_at: string;
    updated_at: string;
    pivot?: {
        model_id: number;
        role_id: number;
        model_type: string;
    };
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
    pivot?: {
        model_id: number;
        permission_id: number;
        model_type: string;
    };
}

export interface Activity {
    id: number;
    log_name: string;
    description: string;
    subject_id: number | null;
    subject_type: string | null;
    causer_id: number | null;
    causer_type: string | null;
    properties: Record<string, any>;
    created_at: string;
    updated_at: string;
}
