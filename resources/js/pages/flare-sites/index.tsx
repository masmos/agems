import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import EmptyState from '@/components/shared/EmptyState';
import { 
  Flame, 
  Plus, 
  Search, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Factory,
  Circle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { FlareSite, PaginatedResponse } from '@/types';

interface FlareSitesIndexProps {
  flareSites: PaginatedResponse<FlareSite & { alerts_count: number; flare_emissions_count: number }>;
  stats: {
    total: number;
    active: number;
    critical_alerts: number;
    average_emissions: {
      methane: number;
      so2: number;
      nox: number;
    };
  };
}

const FlareSitesIndex: React.FC<FlareSitesIndexProps> = ({ flareSites, stats }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const filteredSites = flareSites.data.filter(site =>
    site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const hasSites = flareSites.data.length > 0;
  
  const getStatusColor = (status: FlareSite['status']): string => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: FlareSite['status']) => {
    switch(status) {
      case 'active': return <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />;
      case 'inactive': return <Circle className="h-2.5 w-2.5 fill-gray-500 text-gray-500" />;
    }
  };
  
  const getAlertLevel = (alertsCount: number) => {
    if (alertsCount === 0) return { text: 'No Alerts', color: 'bg-green-100 text-green-800' };
    if (alertsCount <= 2) return { text: `${alertsCount} Alert`, color: 'bg-yellow-100 text-yellow-800' };
    return { text: `${alertsCount} Alerts`, color: 'bg-red-100 text-red-800' };
  };
  
  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url);
    }
  };
  
  return (
    <>
      <Head title="Flare Sites | AGEMS" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 overflow-x-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Heading 
            title="Flare Sites" 
            description="Monitor gas flare emissions and environmental impact across the Albertine Graben region." 
          />
          <Button className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Flare Site
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} active, {stats.total - stats.active} inactive
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical_alerts}</div>
              <p className="text-xs text-muted-foreground">Critical alerts requiring attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Methane (24h)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_emissions.methane.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Parts per million (ppm)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg SO₂ (24h)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.average_emissions.so2.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Sulfur dioxide concentration</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by site name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* Flare Sites Grid */}
        {!hasSites ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <EmptyState
              icon={Flame}
              title="No flare sites available"
              description="Get started by adding your first flare site to monitor gas emissions."
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredSites.map((site) => {
                const alertLevel = getAlertLevel(site.alerts_count);
                return (
                  <Link key={site.id} href={`/flare-sites/${site.id}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                              {site.site_name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <span>{site.location}</span>
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(site.status)}>
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(site.status)}
                              <span className="capitalize">{site.status}</span>
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Flame className="h-4 w-4" />
                              <span>Emissions recorded</span>
                            </div>
                            <span className="font-medium">{site.flare_emissions_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <AlertTriangle className="h-4 w-4" />
                              <span>Active alerts</span>
                            </div>
                            <Badge variant="outline" className={alertLevel.color}>
                              {alertLevel.text}
                            </Badge>
                          </div>
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Last updated</span>
                              <span>{new Date(site.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
            
            {/* No search results */}
            {filteredSites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No flare sites found matching your search.</p>
                <Button
                  variant="link"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </div>
            )}
            
            {/* Pagination */}
{/*             {flareSites.total > flareSites.per_page && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {flareSites.from} to {flareSites.to} of {flareSites.total} results
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(flareSites.prev_page_url)}
                    disabled={!flareSites.prev_page_url}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(flareSites.next_page_url)}
                    disabled={!flareSites.next_page_url}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )} */}
          </>
        )}
      </div>
    </>
  );
};

// Preserve layout configuration
(FlareSitesIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Flare Sites',
      href: '/flare-sites',
    },
  ],
};

export default FlareSitesIndex;