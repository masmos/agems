import React, { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    MapPin,
    Activity,
    AlertTriangle,
    Signal,
    Wifi,
    WifiOff,
    Clock,
    Calendar,
    Thermometer,
    Wind,
    Eye,
    Pencil,
    Trash2,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Circle,
    LineChart as LineChartIcon,
    CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
    BarChart,
    Bar
} from 'recharts';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { MonitoringStation, TelemetryReading, Alert } from '@/types';

interface StationShowProps {
    station: {
        id: number;
        station_name: string;
        location: string;
        latitude: number | null;
        longitude: number | null;
        status: 'active' | 'maintenance' | 'offline';
        status_color: string;
        created_at: string;
        updated_at: string;
        alerts: Alert[];
        total_readings: number;
        total_alerts: number;
        unacknowledged_alerts: number;
        latest_reading: TelemetryReading | null;
        aqi_category: { label: string; color: string };
    };
    chartData: Array<{
        hour: string;
        avg_aqi: number;
        avg_pm25: number;
        avg_pm10: number;
        avg_methane: number;
        avg_co2: number;
        count: number;
    }>;
    recentReadings: TelemetryReading[];
    alertStats: Record<string, number>;
}

const StationShow: React.FC<StationShowProps> = ({
    station,
    chartData,
    recentReadings,
    alertStats,
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [realtimeData, setRealtimeData] = useState<any>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <Wifi className="h-4 w-4 text-green-500" />;
            case 'maintenance': return <Signal className="h-4 w-4 text-yellow-500" />;
            case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
            default: return <Signal className="h-4 w-4" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Active';
            case 'maintenance': return 'Under Maintenance';
            case 'offline': return 'Offline';
            default: return status;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const fetchRealtimeData = async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch(`/stations/${station.id}/realtime`);
            const data = await response.json();
            setRealtimeData(data);
        } catch (error) {
            console.error('Failed to fetch realtime data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRealtimeData();
        const interval = setInterval(fetchRealtimeData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = () => {
        router.delete(`/stations/${station.id}`, {
            onSuccess: () => {
                toast.success('Station deleted successfully');
                router.visit('/stations');
            },
            onError: () => {
                toast.error('Failed to delete station');
            },
        });
    };

    const latestReading = station.latest_reading;

    return (
        <>
            <Head title={`${station.station_name} | Station Details`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/stations')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <Heading
                                    title={station.station_name}
                                    description={station.location}
                                />
                                <Badge className={station.status_color}>
                                    <div className="flex items-center gap-1.5">
                                        {getStatusIcon(station.status)}
                                        <span>{getStatusLabel(station.status)}</span>
                                    </div>
                                </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {station.latest_reading && (
                                    <Badge variant="outline" className={station.aqi_category.color}>
                                        AQI: {station.latest_reading.aqi} - {station.aqi_category.label}
                                    </Badge>
                                )}
                                <Badge variant="outline">
                                    <Activity className="h-3 w-3 mr-1" />
                                    {station.total_readings} Readings
                                </Badge>
                                <Badge variant="outline" className={station.total_alerts > 0 ? 'border-red-200 text-red-600' : ''}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {station.total_alerts} Alerts
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchRealtimeData} disabled={isRefreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={`/stations/${station.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Station</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        station and all associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current AQI</CardTitle>
                            <Wind className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{latestReading?.aqi ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">
                                {latestReading ? new Date(latestReading.reading_datetime).toLocaleString() : 'No data'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PM2.5</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{latestReading?.pm2_5?.toFixed(1) ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">µg/m³</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PM10</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{latestReading?.pm10?.toFixed(1) ?? 'N/A'}</div>
                            <p className="text-xs text-muted-foreground">µg/m³</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{latestReading?.temperature?.toFixed(1) ?? 'N/A'}°C</div>
                            <p className="text-xs text-muted-foreground">Ambient temperature</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="readings" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="readings">Readings & Trends</TabsTrigger>
                        <TabsTrigger value="alerts">Alert History</TabsTrigger>
                        <TabsTrigger value="details">Station Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="readings" className="space-y-4">
                        {/* AQI Trend Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Air Quality Trends (7 Days)</CardTitle>
                                <CardDescription>Hourly averages of AQI, PM2.5, and PM10</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="avg_aqi"
                                                stroke="#ef4444"
                                                name="AQI"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="avg_pm25"
                                                stroke="#f59e0b"
                                                name="PM2.5"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="avg_pm10"
                                                stroke="#8b5cf6"
                                                name="PM10"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Gas Levels Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Gas Levels (7 Days)</CardTitle>
                                <CardDescription>Methane and CO2 concentrations</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="avg_methane"
                                                stroke="#ec4899"
                                                fill="#ec4899"
                                                fillOpacity={0.2}
                                                name="Methane (ppm)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="avg_co2"
                                                stroke="#06b6d4"
                                                fill="#06b6d4"
                                                fillOpacity={0.2}
                                                name="CO2 (ppm)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Readings Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Readings</CardTitle>
                                <CardDescription>Latest 20 telemetry readings</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-2">Timestamp</th>
                                                <th className="text-left py-3 px-2">AQI</th>
                                                <th className="text-left py-3 px-2">PM2.5</th>
                                                <th className="text-left py-3 px-2">PM10</th>
                                                <th className="text-left py-3 px-2">Methane</th>
                                                <th className="text-left py-3 px-2">CO2</th>
                                                <th className="text-left py-3 px-2">Temp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentReadings.length > 0 ? (
                                                recentReadings.map((reading) => (
                                                    <tr key={reading.id} className="border-b hover:bg-muted/50">
                                                        <td className="py-2 px-2">
                                                            {new Date(reading.reading_datetime).toLocaleString()}
                                                        </td>
                                                        <td className="py-2 px-2 font-mono">{reading.aqi ?? '-'}</td>
                                                        <td className="py-2 px-2 font-mono">{reading.pm2_5?.toFixed(1) ?? '-'}</td>
                                                        <td className="py-2 px-2 font-mono">{reading.pm10?.toFixed(1) ?? '-'}</td>
                                                        <td className="py-2 px-2 font-mono">{reading.methane?.toFixed(1) ?? '-'}</td>
                                                        <td className="py-2 px-2 font-mono">{reading.co2?.toFixed(0) ?? '-'}</td>
                                                        <td className="py-2 px-2 font-mono">{reading.temperature?.toFixed(1) ?? '-'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        No readings recorded yet
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="alerts" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Alert History</CardTitle>
                                        <CardDescription>All alerts generated for this station</CardDescription>
                                    </div>
                                    <Badge variant="outline" className={station.total_alerts > 0 ? 'border-red-200' : ''}>
                                        {station.total_alerts} Total Alerts
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {station.alerts && station.alerts.length > 0 ? (
                                    <div className="space-y-4">
                                        {station.alerts.map((alert) => (
                                            <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg border">
                                                <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' :
                                                        alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                                    }`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={getSeverityBadge(alert.severity)}>
                                                            {alert.severity}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(alert.created_at).toLocaleString()}
                                                        </span>
                                                        {alert.acknowledged ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700">
                                                                Acknowledged
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                                                Pending
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm">{alert.message}</p>
                                                    {alert.acknowledged_by && (
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Acknowledged by {alert.acknowledged_by}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                        <p>No alerts recorded for this station</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Station Information</CardTitle>
                                <CardDescription>Detailed information about the monitoring station</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Station Name</label>
                                        <p className="mt-1">{station.station_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                                        <p className="mt-1">{station.location}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                                        <p className="mt-1 capitalize">{getStatusLabel(station.status)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                                        <p className="mt-1">
                                            {station.latitude && station.longitude
                                                ? `${station.latitude}, ${station.longitude}`
                                                : 'Not set'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                                        <p className="mt-1">{new Date(station.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                        <p className="mt-1">{new Date(station.updated_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Total Readings</label>
                                        <p className="mt-1">{station.total_readings}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Total Alerts</label>
                                        <p className="mt-1">{station.total_alerts}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
};

// Preserve layout configuration
(StationShow as any).layout = {
    breadcrumbs: [
        {
            title: 'Monitoring Stations',
            href: '/stations',
        },
        {
            title: 'Station Details',
            href: '#',
        },
    ],
};

export default StationShow;