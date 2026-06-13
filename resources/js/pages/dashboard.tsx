import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Bell,
  Circle,
  Wind,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle as LeafletCircle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ========== Types ==========
interface Alert {
  id: string;
  station: string;
  message: string;
  timestamp: string;
  severity?: 'warning' | 'critical' | 'info';
}

interface AQIDataPoint {
  hour: string;
  value: number;
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'healthy' | 'warning' | 'critical';
  aqi: number;
  lastReading: string;
}

// ========== Mock Data ==========
const generateAQIData = (): AQIDataPoint[] => {
  const hours = [
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00', 
    '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00'
  ];
  
  const baseValues = [48, 52, 55, 58, 61, 63, 62, 59, 56, 53, 50, 47, 45, 44, 43, 42, 41, 43, 46, 49, 53, 56, 54, 51];
  
  return hours.map((hour, index) => ({
    hour,
    value: baseValues[index]
  }));
};

const mockAlerts: Alert[] = [
  { 
    id: '1', 
    station: 'Kikuube', 
    message: 'PM2.5 above threshold', 
    timestamp: '12m ago',
    severity: 'warning'
  },
  { 
    id: '2', 
    station: 'Lake Albert Shore', 
    message: 'Humidity sensor offline', 
    timestamp: '1h ago',
    severity: 'info'
  },
];

// Albertine Graben region coordinates (Uganda)
const regionBounds = {
  center: { lat: 1.9, lng: 31.5 },
  zoom: 9,
  stations: [
    { id: 'bulisa', name: 'Bulisa', lat: 2.1289, lng: 31.4167, status: 'warning' as const, aqi: 142, lastReading: '2 min ago' },
    { id: 'hoima', name: 'Hoima', lat: 1.4333, lng: 31.3500, status: 'healthy' as const, aqi: 68, lastReading: '5 min ago' },
    { id: 'nwoya', name: 'Nwoya', lat: 2.6333, lng: 32.0000, status: 'healthy' as const, aqi: 55, lastReading: '3 min ago' },
    { id: 'kikuube', name: 'Kikuube', lat: 1.4500, lng: 31.2500, status: 'critical' as const, aqi: 215, lastReading: '1 min ago' },
    { id: 'kibale', name: 'Kibale', lat: 2.1500, lng: 31.2000, status: 'healthy' as const, aqi: 72, lastReading: '7 min ago' },
    { id: 'buliisa', name: 'Buliisa', lat: 2.1167, lng: 31.4000, status: 'warning' as const, aqi: 118, lastReading: '4 min ago' },
  ]
};

// ========== Metric Card Component - Clean & Simple ==========
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{value}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>
      <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
        {icon}
      </div>
    </div>
  </div>
);

// ========== Custom Tooltip for Chart ==========
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
          AQI: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

// ========== Air Quality Trend Chart ==========
const AQITrendChart = ({ data }: { data: AQIDataPoint[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis 
            dataKey="hour" 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
            interval={3}
          />
          <YAxis 
            domain={[0, 80]}
            ticks={[0, 20, 40, 60, 80]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine 
            y={50} 
            stroke="#eab308" 
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ========== Map Controller Component ==========
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// ========== Station Status Map ==========
const StationStatusMap = () => {
  const [mapCenter] = useState<[number, number]>([regionBounds.center.lat, regionBounds.center.lng]);
  const [mapZoom] = useState(regionBounds.zoom);

  const getStatusColor = (status: Station['status']) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#eab308';
      case 'critical': return '#ef4444';
    }
  };

  const getStatusIcon = (status: Station['status']) => {
    const color = status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red';
    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Station status map</h3>
        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            <span>Critical</span>
          </div>
        </div>
      </div>
      
      <div className="relative w-full overflow-hidden rounded-b-lg" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {regionBounds.stations.map((station) => (
            <div key={station.id}>
              <Marker
                position={[station.lat, station.lng]}
                icon={getStatusIcon(station.status)}
              >
                <Popup>
                  <div className="min-w-[160px]">
                    <h4 className="font-bold text-sm">{station.name}</h4>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${
                          station.status === 'healthy' ? 'text-green-600' :
                          station.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {station.status === 'healthy' ? 'Normal' :
                           station.status === 'warning' ? 'Warning' : 'Critical'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">AQI:</span>
                        <span className="font-medium">{station.aqi}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
              
              <LeafletCircle
                center={[station.lat, station.lng]}
                radius={station.status === 'critical' ? 5000 : station.status === 'warning' ? 3000 : 2000}
                pathOptions={{
                  color: getStatusColor(station.status),
                  fillColor: getStatusColor(station.status),
                  fillOpacity: 0.1,
                  weight: 1.5
                }}
              />
            </div>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

// ========== Live Alert Feed ==========
const LiveAlertFeed = ({ alerts }: { alerts: Alert[] }) => (
  <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50">
    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Live alert feed</h3>
      </div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {alerts.map((alert) => (
        <div key={alert.id} className="px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.station}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{alert.message}</p>
            </div>
            <p className="ml-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
              {alert.timestamp}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ========== Main Dashboard Component - Full Width ==========
export default function Dashboard() {
  const [aqiData] = useState<AQIDataPoint[]>(generateAQIData());
  
  const metrics = {
    openAlerts: 2,
    avgAQI: 51,
    activeStations: '5/5',
    lastReading: '11:04 AM'
  };
  
  return (
    <>
      <Head title="Dashboard | AGEMS" />
      <div className="min-h-full bg-gray-50 dark:bg-gray-950">
        {/* Full width container - no max-w constraint */}
        <div className="w-full space-y-5 p-5">
          {/* Header */}
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Environmental Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Live monitoring across the Albertine Graben region
            </p>
          </div>
          
          {/* Metrics Grid - 4 columns full width */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="OPEN ALERTS"
              value={metrics.openAlerts}
              icon={<AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
            <MetricCard
              title="AVG AQI (24H)"
              value={metrics.avgAQI}
              subtitle="hourly mean"
              icon={<Wind className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
            <MetricCard
              title="ACTIVE STATIONS"
              value={metrics.activeStations}
              icon={<MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
            <MetricCard
              title="LAST READING"
              value={metrics.lastReading}
              icon={<Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
            />
          </div>
          
          {/* Air Quality Trend - Full width */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Air quality trend (24h)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hourly averages across stations
              </p>
            </div>
            <AQITrendChart data={aqiData} />
          </div>
          
          {/* Two-column layout for Alert Feed and Map - Full width */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <LiveAlertFeed alerts={mockAlerts} />
            <StationStatusMap />
          </div>
        </div>
      </div>
    </>
  );
}

// Preserve original layout configuration
Dashboard.layout = {
  breadcrumbs: [
    {
      title: 'Dashboard',
      href: dashboard(),
    },
  ],
};