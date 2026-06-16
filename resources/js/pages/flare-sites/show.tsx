import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { 
  Flame, 
  ArrowLeft, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  RefreshCw
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
  Area
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
import { toast } from "sonner";
import FormModal from '@/components/shared/FormModal';
import { FormInput } from '@/components/shared/form/FormInput';
import { FormSelect } from '@/components/shared/form/FormSelect';
import type { FlareSite, FlareEmission, Alert } from '@/types';


interface FlareSiteShowProps {
  flareSite: FlareSite & { 
    alerts_count: number; 
    flare_emissions_count: number;
    alerts: Alert[];
  };
  emissions: Array<{
    hour: string;
    avg_methane: number;
    avg_so2: number;
    avg_nox: number;
    max_methane: number;
  }>;
  recentEmissions: FlareEmission[];
}

const FlareSiteShow: React.FC<FlareSiteShowProps> = ({ 
  flareSite, 
  emissions, 
  recentEmissions 
}) => {

  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const getStatusColor = (status: FlareSite['status']) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };
  
  const fetchRealtimeData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/flare-sites/${flareSite.id}/realtime`);
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
    router.delete(`/flare-sites/${flareSite.id}`, {
      onSuccess: () => {
        toast.success("Flare site deleted successfully");
      },
      onError: () => {
        toast.error("Failed to delete flare site");
      }
    });
  };
  
  // Calculate emission statistics
  const avgMethane = recentEmissions.reduce((sum, e) => sum + (e.methane_level || 0), 0) / (recentEmissions.length || 1);
  const maxMethane = Math.max(...recentEmissions.map(e => e.methane_level || 0));
  const latestEmission = recentEmissions[0];
  
  console.log({ Tabs, TabsContent, AlertDialog, Heading });
  return (
    <>
      <Head title={`${flareSite.site_name} | Flare Site`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        {/* Header with navigation */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/flare-sites')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <Heading 
                  title={flareSite.site_name}
                  description={`Flare site in ${flareSite.location}`}
                />
                <Badge className={getStatusColor(flareSite.status)}>
                  {flareSite.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchRealtimeData} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <FormModal
              title="Edit Flare Site"
              description="Update site details."
              trigger={
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              }
              initialData={{
                site_name: flareSite.site_name ?? '',
                location: flareSite.location ?? '',
                latitude: flareSite.latitude ?? '',
                longitude: flareSite.longitude ?? '',
                status: flareSite.status ?? 'active',
              }}
              url={`/flare-sites/${flareSite.id}`}
              method="patch"
              submitLabel="Save Changes"
              resetOnClose={true}
            >
              {(form: any) => (
                <div className="grid grid-cols-1 gap-4">
                  <FormInput
                    form={form}
                    name="site_name"
                    label="Site name"
                    required
                    placeholder="e.g. Kingfisher"
                  />

                  <FormInput
                    form={form}
                    name="location"
                    label="Location"
                    required
                    placeholder="e.g. Kasingira"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormInput
                      form={form}
                      name="latitude"
                      label="Latitude"
                      placeholder="-0.0000"
                      type="number"
                      step="any"
                    />

                    <FormInput
                      form={form}
                      name="longitude"
                      label="Longitude"
                      placeholder="30.0000"
                      type="number"
                      step="any"
                    />
                  </div>

                  <FormSelect
                    form={form}
                    name="status"
                    label="Status"
                    required
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                    ]}
                  />
                </div>
              )}
            </FormModal>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the flare site
                    and all associated emission data.
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
        
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Methane Level</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {latestEmission?.methane_level?.toFixed(1) || 'N/A'} ppm
              </div>
              <p className="text-xs text-muted-foreground">
                24h avg: {avgMethane.toFixed(1)} ppm | Max: {maxMethane.toFixed(1)} ppm
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {realtimeData?.alertCount || flareSite.alerts?.filter(a => !a.acknowledged).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {flareSite.alerts_count} total alerts
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flareSite.flare_emissions_count}</div>
              <p className="text-xs text-muted-foreground">Emission readings recorded</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Reading</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {latestEmission ? new Date(latestEmission.reading_datetime).toLocaleString() : 'No data'}
              </div>
              <p className="text-xs text-muted-foreground">Latest emission recording</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different views */}
        <Tabs defaultValue="emissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="emissions">Emissions Overview</TabsTrigger>
            <TabsTrigger value="alerts">Alert History</TabsTrigger>
            <TabsTrigger value="details">Site Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="emissions" className="space-y-4">
            {/* Emission Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Emission Trends (7 Days)</CardTitle>
                <CardDescription>
                  Hourly average of methane, SO₂, and NOx emissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emissions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avg_methane" 
                        stroke="#ef4444" 
                        name="Methane (ppm)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg_so2" 
                        stroke="#f59e0b" 
                        name="SO₂ (ppm)"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg_nox" 
                        stroke="#8b5cf6" 
                        name="NOx (ppm)"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Emissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Emissions</CardTitle>
                <CardDescription>Latest 20 emission readings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Timestamp</th>
                        <th className="text-left py-3 px-2">Methane (ppm)</th>
                        <th className="text-left py-3 px-2">SO₂ (ppm)</th>
                        <th className="text-left py-3 px-2">NOx (ppm)</th>
                        <th className="text-left py-3 px-2">CO₂ (ppm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEmissions.map((emission) => (
                        <tr key={emission.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">
                            {new Date(emission.reading_datetime).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {emission.methane_level?.toFixed(2) || '-'}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {emission.so2_level?.toFixed(2) || '-'}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {emission.nox_level?.toFixed(2) || '-'}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {emission.co2_level?.toFixed(0) || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>All alerts generated for this flare site</CardDescription>
              </CardHeader>
              <CardContent>
                {flareSite.alerts && flareSite.alerts.length > 0 ? (
                  <div className="space-y-4">
                    {flareSite.alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg border">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityBadge(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1 text-sm">{alert.message}</p>
                          {alert.acknowledged && (
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
                    No alerts recorded for this flare site.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>Detailed information about the flare site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Site Name</label>
                    <p className="mt-1">{flareSite.site_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="mt-1">{flareSite.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="mt-1 capitalize">{flareSite.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                    <p className="mt-1">
                      {flareSite.latitude && flareSite.longitude 
                        ? `${flareSite.latitude}, ${flareSite.longitude}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="mt-1">{new Date(flareSite.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="mt-1">{new Date(flareSite.updated_at).toLocaleString()}</p>
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
(FlareSiteShow as any).layout = {
  breadcrumbs: [
    {
      title: 'Flare Sites',
      href: '/flare-sites',
    },
    {
      title: 'Site Details',
      href: '#',
    },
  ],
};

export default FlareSiteShow;