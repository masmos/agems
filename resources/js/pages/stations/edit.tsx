import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import {
  ArrowLeft,
  Save,
  MapPin,
  Activity,
  AlertTriangle,
  Circle,
  Wifi,
  WifiOff,
  Signal,
  Loader2,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { MonitoringStation } from '@/types';

interface StationEditProps {
  station: MonitoringStation & {
    alerts_count?: number;
    telemetry_readings_count?: number;
  };
}

const StationEdit: React.FC<StationEditProps> = ({ station }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data, setData, put, processing, errors } = useForm({
    station_name: station.station_name,
    location: station.location || '',
    latitude: station.latitude?.toString() || '',
    longitude: station.longitude?.toString() || '',
    status: station.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    put(`/stations/${station.id}`, {
      onSuccess: () => {
        toast.success('Station updated successfully');
        router.visit(`/stations/${station.id}`);
      },
      onError: (errors) => {
        toast.error('Failed to update station');
      },
    });
  };

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

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'offline': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'active': return <Wifi className="h-4 w-4" />;
      case 'maintenance': return <Signal className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <Signal className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'maintenance': return 'Under Maintenance';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  return (
    <>
      <Head title={`Edit ${station.station_name} | Monitoring Station`} />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit(`/stations/${station.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Heading
                  title={`Edit: ${station.station_name}`}
                  description={`Update monitoring station information`}
                />
                <Badge className={getStatusColor(station.status)}>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(station.status)}
                    <span>{getStatusLabel(station.status)}</span>
                  </div>
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  {station.telemetry_readings_count || 0} Readings
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {station.alerts_count || 0} Alerts
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  ID: #{station.id}
                </Badge>
              </div>
            </div>
          </div>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Station
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Station</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  station <strong>"{station.station_name}"</strong> and all associated
                  telemetry readings and alerts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete Station
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update station details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="station_name">Station Name *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="station_name"
                      className="pl-9"
                      value={data.station_name}
                      onChange={(e) => setData('station_name', e.target.value)}
                      placeholder="e.g., Buliisa AQI Station"
                    />
                  </div>
                  {errors.station_name && (
                    <p className="text-sm text-red-500">{errors.station_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      className="pl-9"
                      value={data.location}
                      onChange={(e) => setData('location', e.target.value)}
                      placeholder="e.g., Buliisa District"
                    />
                  </div>
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={data.latitude}
                    onChange={(e) => setData('latitude', e.target.value)}
                    placeholder="e.g., 1.8467"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter coordinates for map display
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={data.longitude}
                    onChange={(e) => setData('longitude', e.target.value)}
                    placeholder="e.g., 31.4167"
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
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                        Active
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                        Maintenance
                      </div>
                    </SelectItem>
                    <SelectItem value="offline">
                      <div className="flex items-center gap-2">
                        <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
                        Offline
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Review the changes before saving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Station Name</span>
                  <span className="text-sm">{data.station_name || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Location</span>
                  <span className="text-sm">{data.location || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={getStatusColor(data.status)}>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(data.status)}
                      <span>{getStatusLabel(data.status)}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coordinates</span>
                  <span className="text-sm">
                    {data.latitude && data.longitude
                      ? `${data.latitude}, ${data.longitude}`
                      : 'Not set'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-medium">Total Readings</span>
                  <span className="text-sm">{station.telemetry_readings_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Alerts</span>
                  <span className="text-sm">{station.alerts_count || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-2">
            <Button type="submit" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Station
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.visit(`/stations/${station.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

// Preserve layout configuration
(StationEdit as any).layout = {
  breadcrumbs: [
    {
      title: 'Monitoring Stations',
      href: '/stations',
    },
    {
      title: 'Edit',
      href: '#',
    },
  ],
};

export default StationEdit;