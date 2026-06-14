import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SignalIcon,
  FireIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import type {
  DashboardStats,
  Alert,
  AlertTrend,
  AirQualityTrend,
  EmissionTrend,
  TopStation
} from '@/types';

interface DashboardProps {
  stats: DashboardStats;
  recentAlerts: Alert[];
  alertsBySeverity: AlertTrend[];
  airQualityTrends: AirQualityTrend[];
  emissionTrends: EmissionTrend[];
  topStations: TopStation[];
  complianceRate: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'yellow' | 'blue';
}

interface AlertItemProps {
  alert: Alert;
  onAcknowledge?: (id: number) => void;
}

const COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6'
};

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`rounded-md p-3 ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  );
};

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  const severityStyles = {
    critical: 'bg-red-50 border-red-400 text-red-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };

  const severityIcons = {
    critical: <XCircleIcon className="h-5 w-5 text-red-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
    info: <BellIcon className="h-5 w-5 text-blue-500" />,
  };

  const sourceName = 
    alert.source && 'station_name' in alert.source 
      ? alert.source.station_name 
      : alert.source && 'site_name' in alert.source
      ? alert.source.site_name
      : 'Unknown Source';

  const handleAcknowledge = () => {
    if (onAcknowledge && alert.id) {
      onAcknowledge(alert.id);
    }
  };

  return (
    <div className={`px-6 py-4 border-l-4 ${severityStyles[alert.severity]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          {severityIcons[alert.severity]}
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{sourceName}</p>
            <p className="text-sm text-gray-500">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(alert.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {!alert.acknowledged && onAcknowledge && (
          <button
            onClick={handleAcknowledge}
            className="ml-4 text-sm text-indigo-600 hover:text-indigo-900"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  stats: initialStats,
  recentAlerts: initialAlerts,
  alertsBySeverity,
  airQualityTrends,
  emissionTrends,
  topStations,
  complianceRate,
}) => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>(initialAlerts);

  // Poll for real-time updates every 30 seconds
  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        const response = await fetch('/dashboard/realtime');
        const data = await response.json();
        setStats(data.stats);
        setRecentAlerts(data.latest_alerts);
      } catch (error) {
        console.error('Failed to fetch realtime data:', error);
      }
    };

    const interval = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetch(`/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        setRecentAlerts(prevAlerts =>
          prevAlerts.map(alert =>
            alert.id === alertId ? { ...alert, acknowledged: true } : alert
          )
        );
        toast.success('Alert acknowledged successfully');
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  // Prepare data for severity chart
  const severityData = [
    { name: 'Critical', value: stats.critical_alerts, color: COLORS.critical },
    { name: 'Warning', value: stats.active_alerts - stats.critical_alerts, color: COLORS.warning },
  ];

  return (
    <>
      <Head title="Dashboard" />

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Environmental Monitoring Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Real-time monitoring of air quality and flare emissions in Albertine Graben
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Stations"
              value={`${stats.active_stations}/${stats.total_stations}`}
              description="Monitoring stations online"
              icon={<SignalIcon className="h-6 w-6" />}
              color="green"
            />

            <StatCard
              title="Active Alerts"
              value={stats.active_alerts}
              description={`${stats.critical_alerts} critical`}
              icon={<BellIcon className="h-6 w-6" />}
              color={stats.critical_alerts > 0 ? "red" : "yellow"}
            />

            <StatCard
              title="Air Quality Index"
              value={Math.round(stats.average_aqi)}
              description={`PM2.5: ${Math.round(stats.average_pm25)} µg/m³`}
              icon={<ChartBarIcon className="h-6 w-6" />}
              color="blue"
            />

            <StatCard
              title="Compliance Rate"
              value={`${complianceRate}%`}
              description={`${stats.pending_inspections} pending inspections`}
              icon={<CheckCircleIcon className="h-6 w-6" />}
              color={complianceRate >= 80 ? "green" : "yellow"}
            />
          </div>

          {/* Charts Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Air Quality Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Air Quality Trends (Last 24h)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={airQualityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_aqi"
                    stroke={COLORS.critical}
                    name="AQI"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_pm25"
                    stroke={COLORS.warning}
                    name="PM2.5"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_pm10"
                    stroke={COLORS.info}
                    name="PM10"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Emission Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Flare Emission Trends (Last 24h)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={emissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avg_methane"
                    stroke="#8B5CF6"
                    name="Methane (ppm)"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_so2"
                    stroke="#EC4899"
                    name="SO2 (ppm)"
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_nox"
                    stroke={COLORS.warning}
                    name="NOx (ppm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts and Compliance Row */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Alerts */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledgeAlert}
                  />
                ))}
                {recentAlerts.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No active alerts. All systems normal.
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/alerts" className="text-sm text-indigo-600 hover:text-indigo-900">
                  View all alerts →
                </Link>
              </div>
            </div>

            {/* Alerts Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Alert Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Top Violating Stations
                </h4>
                <div className="mt-2 space-y-2">
                  {topStations.map((station, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{station.name}</span>
                      <span className="font-medium text-red-600">
                        {station.alert_count} alerts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;