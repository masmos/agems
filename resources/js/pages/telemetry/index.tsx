import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import EmptyState from '@/components/shared/EmptyState';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Eye,
  Trash2,
  TrendingUp,
  Wind,
  Thermometer,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import type { TelemetryReading, MonitoringStation, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

interface TelemetryIndexProps {
  readings: PaginatedResponse<TelemetryReading & { monitoring_station: MonitoringStation }>;
  stats: {
    total_readings: number;
    last_24h: number;
    average_aqi: number;
    stations_with_data: number;
  };
  stations: MonitoringStation[];
  currentStationId: string | null;
}

const TelemetryIndex: React.FC<TelemetryIndexProps> = ({ 
  readings, 
  stats, 
  stations,
  currentStationId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<string>(currentStationId || '');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    aqi: '',
    pm2_5: '',
    pm10: '',
    methane: '',
    co2: '',
    temperature: '',
    reading_datetime: new Date().toISOString().slice(0, 16),
  });
  
  const hasReadings = readings.data.length > 0;
  
  const getAQIBadge = (aqi: number | null) => {
    if (!aqi) return { label: 'No Data', color: 'bg-gray-100 text-gray-800' };
    if (aqi <= 50) return { label: 'Good', color: 'bg-green-100 text-green-800' };
    if (aqi <= 100) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    if (aqi <= 150) return { label: 'Unhealthy', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Hazardous', color: 'bg-red-100 text-red-800' };
  };
  
  const handleFilterChange = (value: string) => {
    setSelectedStation(value);
    if (value && value !== 'all') {
      router.visit(`/telemetry?station_id=${value}`);
    } else {
      router.visit('/telemetry');
    }
  };
  
  const handleAddReading = () => {
    // Validate form
    const dataToSubmit = {
      monitoring_station_id: parseInt(selectedStation),
      reading_datetime: formData.reading_datetime,
      aqi: formData.aqi ? parseFloat(formData.aqi) : null,
      pm2_5: formData.pm2_5 ? parseFloat(formData.pm2_5) : null,
      pm10: formData.pm10 ? parseFloat(formData.pm10) : null,
      methane: formData.methane ? parseFloat(formData.methane) : null,
      co2: formData.co2 ? parseFloat(formData.co2) : null,
      temperature: formData.temperature ? parseFloat(formData.temperature) : null,
    };
    
    router.post('/telemetry', dataToSubmit, {
      onSuccess: () => {
        setIsAddDialogOpen(false);

        toast.success('Telemetry reading added successfully');
        setFormData({
          aqi: '',
          pm2_5: '',
          pm10: '',
          methane: '',
          co2: '',
          temperature: '',
          reading_datetime: new Date().toISOString().slice(0, 16),
        });
      },
      onError: (errors) => {
        toast.error('Failed to add reading. Please check your input and try again.');
      }
    });
  };
  
  const handleDelete = (id: number) => {
    router.delete(`/telemetry/${id}`, {
      onSuccess: () => {
        toast.success('Reading deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete reading');
      }
    });
  };
  
  const handleExport = () => {
    // Export current filtered readings as CSV
    const csvHeaders = ['Station', 'DateTime', 'AQI', 'PM2.5', 'PM10', 'Methane', 'CO2', 'Temperature'];
    const csvRows = readings.data.map(r => [
      r.monitoring_station?.station_name || 'Unknown',
      new Date(r.reading_datetime).toLocaleString(),
      r.aqi || '',
      r.pm2_5 || '',
      r.pm10 || '',
      r.methane || '',
      r.co2 || '',
      r.temperature || '',
    ]);
    
    const csvContent = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry_export_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('CSV export started');
  };
  
  return (
    <>
      <Head title="Telemetry Readings | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading 
            title="Telemetry Readings" 
            description="Monitor air quality data from all monitoring stations in real-time." 
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Activity className="h-4 w-4 mr-2" />
                  Add Reading
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Telemetry Reading</DialogTitle>
                  <DialogDescription>
                    Record a new air quality reading from a monitoring station.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Station</Label>
                      <Select value={selectedStation} onValueChange={setSelectedStation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select station" />
                        </SelectTrigger>
                        <SelectContent>
                          {stations.map((station) => (
                            <SelectItem key={station.id} value={station.id.toString()}>
                              {station.station_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date & Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.reading_datetime}
                        onChange={(e) => setFormData({ ...formData, reading_datetime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>AQI</Label>
                      <Input
                        type="number"
                        placeholder="Air Quality Index"
                        value={formData.aqi}
                        onChange={(e) => setFormData({ ...formData, aqi: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PM2.5 (µg/m³)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Particulate Matter 2.5"
                        value={formData.pm2_5}
                        onChange={(e) => setFormData({ ...formData, pm2_5: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PM10 (µg/m³)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Particulate Matter 10"
                        value={formData.pm10}
                        onChange={(e) => setFormData({ ...formData, pm10: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Methane (ppm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Methane concentration"
                        value={formData.methane}
                        onChange={(e) => setFormData({ ...formData, methane: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CO2 (ppm)</Label>
                      <Input
                        type="number"
                        placeholder="Carbon Dioxide"
                        value={formData.co2}
                        onChange={(e) => setFormData({ ...formData, co2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Temperature (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Temperature"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddReading}>Save Reading</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_readings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.stations_with_data} stations reporting
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.last_24h.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Readings recorded</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average AQI</CardTitle>
              <Wind className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_aqi.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">24-hour average</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Status</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Monitor</div>
              <p className="text-xs text-muted-foreground">Auto-generates alerts</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search readings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedStation} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stations</SelectItem>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={station.id.toString()}>
                    {station.station_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Readings Table */}
        {!hasReadings ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <EmptyState
              icon={Activity}
              title="No telemetry readings available"
              description="Add your first reading or wait for data from monitoring stations."
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Station</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>AQI</TableHead>
                    <TableHead>PM2.5</TableHead>
                    <TableHead>PM10</TableHead>
                    <TableHead>Methane</TableHead>
                    <TableHead>CO2</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.data.map((reading) => {
                    const aqiBadge = getAQIBadge(reading.aqi);
                    return (
                      <TableRow key={reading.id}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/stations/${reading.monitoring_station_id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {reading.monitoring_station?.station_name || 'Unknown'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {new Date(reading.reading_datetime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={aqiBadge.color}>
                            {reading.aqi || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{reading.pm2_5?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.pm10?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.methane?.toFixed(1) || '-'}</TableCell>
                        <TableCell>{reading.co2?.toFixed(0) || '-'}</TableCell>
                        <TableCell>
                          {reading.temperature ? `${reading.temperature}°C` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/telemetry/${reading.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
                                  <AlertDialogAction onClick={() => handleDelete(reading.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {/* Pagination */}
         {readings.total > readings.per_page && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {readings.from} to {readings.to} of {readings.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => readings.prev_page_url && router.visit(readings.prev_page_url)}
                disabled={!readings.prev_page_url}
              >

                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => readings.next_page_url && router.visit(readings.next_page_url)}
                disabled={!readings.next_page_url}
              >
                Next
              </Button>

            </div>
          </div>
        )}

      </div>
    </>
  );
};

// Preserve layout configuration
(TelemetryIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Telemetry',
      href: '/telemetry',
    },
  ],
};

export default TelemetryIndex;