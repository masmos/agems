import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import {
  MapPin,
  Plus,
  Search,
  Activity,
  AlertTriangle,
  Circle,
  Eye,
  Pencil,
  Trash2,
  Signal,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import type { MonitoringStation, PaginatedResponse } from '@/types';

interface StationsIndexProps {
  stations: PaginatedResponse<MonitoringStation & { alerts_count: number; telemetry_readings_count: number }>;
  stats: {
    total: number;
    active: number;
    maintenance: number;
    offline: number;
    with_alerts: number;
    average_aqi: number;
  };
  filters: {
    search: string;
    status: string;
  };
}

const StationsIndex: React.FC<StationsIndexProps> = ({ stations, stats, filters }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, setData, post, reset, errors } = useForm({
    station_name: '',
    location: '',
    latitude: '',
    longitude: '',
    status: 'active',
  });

  const filteredStations = stations.data.filter(station =>
    station.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasStations = stations.data.length > 0;

  const getStatusColor = (status: MonitoringStation['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: MonitoringStation['status']) => {
    switch (status) {
      case 'active': return <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />;
      case 'maintenance': return <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />;
      case 'offline': return <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />;
    }
  };

  const getStatusLabel = (status: MonitoringStation['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Maintenance';
      case 'offline': return 'Offline';
    }
  };

  const getAQICategory = (aqi: number | null) => {
    if (!aqi) return { label: 'No Data', color: 'bg-gray-100 text-gray-800' };
    if (aqi <= 50) return { label: 'Good', color: 'bg-green-100 text-green-800' };
    if (aqi <= 100) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800' };
    if (aqi <= 150) return { label: 'Unhealthy', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Hazardous', color: 'bg-red-100 text-red-800' };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.visit('/stations?search=' + encodeURIComponent(searchTerm) +
      '&status=' + (statusFilter !== 'all' ? statusFilter : ''));
  };

  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    post('/stations', {
      onSuccess: () => {
        toast.success('Station created successfully');
        setIsCreateDialogOpen(false);
        reset();
        setIsSubmitting(false);
      },
      onError: (errors) => {
        toast.error('Failed to create station');
        setIsSubmitting(false);
      },
    });
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url);
    }
  };

  return (
    <>
      <Head title="Monitoring Stations | AGEMS" />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title="Monitoring Stations"
            description="Manage air quality monitoring stations across the Albertine Graben region."
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Monitoring Station</DialogTitle>
                <DialogDescription>
                  Enter the details of the new monitoring station.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateStation}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station_name">Station Name *</Label>
                      <Input
                        id="station_name"
                        placeholder="e.g., Buliisa AQI Station"
                        value={data.station_name}
                        onChange={(e) => setData('station_name', e.target.value)}
                        className={errors.station_name ? 'border-red-500' : ''}
                      />
                      {errors.station_name && (
                        <p className="text-sm text-red-500">{errors.station_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Buliisa District"
                        value={data.location}
                        onChange={(e) => setData('location', e.target.value)}
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && (
                        <p className="text-sm text-red-500">{errors.location}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 1.8467"
                        value={data.latitude}
                        onChange={(e) => setData('latitude', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="e.g., 31.4167"
                        value={data.longitude}
                        onChange={(e) => setData('longitude', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(value) => setData('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Station
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active, {stats.maintenance} in maintenance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average AQI (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.average_aqi)}</div>
              <p className="text-xs text-muted-foreground">
                Across all active stations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stations with Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.with_alerts}</div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Stations</CardTitle>
              <WifiOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.offline}</div>
              <p className="text-xs text-muted-foreground">
                Not reporting data
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stations Grid */}
        {!hasStations ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No monitoring stations found</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first station
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStations.map((station) => {
                const aqiCategory = getAQICategory(station.latestReading?.aqi || null);
                return (
                  <Card key={station.id} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg hover:text-primary transition-colors">
                            <Link href={`/stations/${station.id}`}>
                              {station.station_name}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {station.location}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(station.status)}>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(station.status)}
                            <span className="capitalize">{getStatusLabel(station.status)}</span>
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* AQI Status */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current AQI</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {station.latestReading?.aqi ?? 'N/A'}
                            </span>
                            <Badge className={aqiCategory.color}>
                              {aqiCategory.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Readings: {station.telemetry_readings_count || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Alerts: {station.alerts_count || 0}
                            </span>
                          </div>
                        </div>

                        {/* Last Reading */}
                        {station.latestReading && (
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            Last reading: {new Date(station.latestReading.reading_datetime).toLocaleString()}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/stations/${station.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="flex-1">
                            <Link href={`/stations/${station.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No stations found matching your search</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {stations.total > stations.per_page && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {stations.from} to {stations.to} of {stations.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(stations.prev_page_url)}
                    disabled={!stations.prev_page_url}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(stations.next_page_url)}
                    disabled={!stations.next_page_url}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// Preserve layout configuration
(StationsIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Monitoring Stations',
      href: '/stations',
    },
  ],
};

export default StationsIndex;