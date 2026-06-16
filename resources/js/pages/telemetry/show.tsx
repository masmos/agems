import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Activity,
    Wind,
    Thermometer,
    Calendar,
    MapPin,
    AlertTriangle,
    Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { TelemetryReading, MonitoringStation } from '@/types';
import { toast } from 'sonner';

interface TelemetryShowProps {
    reading: TelemetryReading & { monitoring_station: MonitoringStation };
    previous: TelemetryReading | null;
    next: TelemetryReading | null;
}

const TelemetryShow: React.FC<TelemetryShowProps> = ({ reading, previous, next }) => {

    const getAQILevel = (aqi: number | null) => {
        if (!aqi) return { level: 'No Data', color: 'bg-gray-100 text-gray-800', description: '' };
        if (aqi <= 50) return { level: 'Good', color: 'bg-green-100 text-green-800', description: 'Air quality is satisfactory' };
        if (aqi <= 100) return { level: 'Moderate', color: 'bg-yellow-100 text-yellow-800', description: 'Acceptable air quality' };
        if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: 'bg-orange-100 text-orange-800', description: 'Members of sensitive groups may experience health effects' };
        if (aqi <= 200) return { level: 'Unhealthy', color: 'bg-red-100 text-red-800', description: 'Everyone may begin to experience health effects' };
        return { level: 'Very Unhealthy', color: 'bg-purple-100 text-purple-800', description: 'Health alert: everyone may experience more serious health effects' };
    };

    const handleDelete = () => {
        router.delete(`/telemetry/${reading.id}`, {
            onSuccess: () => {
                toast.success('Reading deleted successfully');
                router.visit('/telemetry');
            },
            onError: () => {
                toast.error('Failed to delete reading');
            }
        });
    };

    const aqiInfo = getAQILevel(reading.aqi);

    return (
        <AppLayout>
            <Head title="Telemetry Reading Details" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit('/telemetry')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <Heading
                                title="Telemetry Reading Details"
                                description={`Recorded at ${reading.monitoring_station?.station_name || 'Unknown'}`}

                            />
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Reading
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Reading</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    telemetry reading from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Navigation between readings */}
                <div className="flex justify-between gap-4">
                    {previous ? (
                        <Link href={`/telemetry/${previous.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                                ← Previous Reading
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="outline" disabled className="flex-1">
                            ← No Previous
                        </Button>
                    )}
                    {next ? (
                        <Link href={`/telemetry/${next.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                                Next Reading →
                            </Button>
                        </Link>
                    ) : (
                        <Button variant="outline" disabled className="flex-1">
                            No Next →
                        </Button>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* AQI Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Air Quality Index (AQI)</CardTitle>
                            <CardDescription>Current air quality assessment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center">
                                <div className={`inline-flex items-center justify-center rounded-full p-6 ${aqiInfo.color.replace('text', 'bg').replace('800', '100')}`}>
                                    <span className="text-5xl font-bold">{reading.aqi || 'N/A'}</span>
                                </div>
                                <Badge className={`mt-4 ${aqiInfo.color}`}>
                                    {aqiInfo.level}
                                </Badge>
                                <p className="mt-4 text-sm text-muted-foreground">{aqiInfo.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reading Information</CardTitle>
                            <CardDescription>Metadata and location details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Date & Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(reading.reading_datetime).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Station</p>
                                    <Link
                                        href={`/stations/${reading.monitoring_station_id}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        {reading.monitoring_station?.station_name || 'Unknown'}
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Alert Status</p>
                                    <p className="text-sm text-muted-foreground">
                                        {reading.aqi && reading.aqi > 100 ? 'Threshold exceeded' : 'Within limits'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Measurements */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Measurements</CardTitle>
                        <CardDescription>Complete set of environmental parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Wind className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">PM2.5</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{reading.pm2_5?.toFixed(1) || '-'} <span className="text-sm font-normal">µg/m³</span></p>
                                <p className="text-xs text-muted-foreground">Particulate Matter &lt; 2.5µm</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Wind className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">PM10</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{reading.pm10?.toFixed(1) || '-'} <span className="text-sm font-normal">µg/m³</span></p>
                                <p className="text-xs text-muted-foreground">Particulate Matter &lt; 10µm</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Methane</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{reading.methane?.toFixed(1) || '-'} <span className="text-sm font-normal">ppm</span></p>
                                <p className="text-xs text-muted-foreground">Methane concentration</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">CO2</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{reading.co2?.toFixed(0) || '-'} <span className="text-sm font-normal">ppm</span></p>
                                <p className="text-xs text-muted-foreground">Carbon Dioxide</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Temperature</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">{reading.temperature?.toFixed(1) || '-'} <span className="text-sm font-normal">°C</span></p>
                                <p className="text-xs text-muted-foreground">Ambient temperature</p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Record ID</span>
                                </div>
                                <p className="mt-2 text-2xl font-bold">#{reading.id}</p>
                                <p className="text-xs text-muted-foreground">Unique identifier</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quality Assessment */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quality Assessment</CardTitle>
                        <CardDescription>Compliance and threshold analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">AQI Threshold (Warning: 100)</span>
                                <Badge variant={reading.aqi && reading.aqi > 100 ? "destructive" : "default"}>
                                    {reading.aqi && reading.aqi > 100 ? 'Exceeded' : 'Within Limit'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">PM2.5 Threshold (35 µg/m³)</span>
                                <Badge variant={reading.pm2_5 && reading.pm2_5 > 35 ? "destructive" : "default"}>
                                    {reading.pm2_5 && reading.pm2_5 > 35 ? 'Exceeded' : 'Within Limit'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">PM10 Threshold (50 µg/m³)</span>
                                <Badge variant={reading.pm10 && reading.pm10 > 50 ? "destructive" : "default"}>
                                    {reading.pm10 && reading.pm10 > 50 ? 'Exceeded' : 'Within Limit'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

// Preserve layout configuration
(TelemetryShow as any).layout = {
    breadcrumbs: [
        {
            title: 'Telemetry',
            href: '/telemetry',
        },
        {
            title: 'Reading Details',
            href: '#',
        },
    ],
};

export default TelemetryShow;