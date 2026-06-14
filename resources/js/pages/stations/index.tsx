import { MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { PlusIcon, MapPin, Activity, Circle } from 'lucide-react';
import React, { useState } from 'react';
import Heading from '@/components/heading';
import EmptyState from '@/components/shared/EmptyState';
import AppLayout from '@/layouts/app-layout';
import type { MonitoringStation, PaginatedResponse } from '@/types';

interface StationsIndexProps {
  stations: PaginatedResponse<MonitoringStation>;
}

const StationsIndex: React.FC<StationsIndexProps> = ({ stations }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

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

  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url);
    }
  };

  return (
    <>
      <Head title="Monitoring Stations" />

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <Heading
            title="Monitoring Stations"
            description="Manage and monitor air quality stations across the Albertine Graben region."
          />
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Station
          </button>
        </div>

        {!hasStations ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <EmptyState
              icon={MapPin}
              title="No monitoring stations available"
              description="Get started by adding your first monitoring station to track air quality and environmental data."
            // buttonComponent={<CreateStationButton />}
            />
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mt-2">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Search stations by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Total Stations</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{stations.total}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-500">Active Stations</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stations.data.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900/50">
                <div className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-500">Under Maintenance</span>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stations.data.filter(s => s.status === 'maintenance').length}
                </p>
              </div>
            </div>

            {/* Stations Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  statusColor={getStatusColor(station.status)}
                  statusIcon={getStatusIcon(station.status)}
                />
              ))}
            </div>

            {/* No search results */}
            {filteredStations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No stations found matching your search.</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear search
                </button>
              </div>
            )}
          </>
        )}
      </div></>
  );
};

interface StationCardProps {
  station: MonitoringStation;
  statusColor: string;
  statusIcon: React.ReactNode;
}

const StationCard: React.FC<StationCardProps> = ({ station, statusColor, statusIcon }) => {
  return (
    <Link href={`/stations/${station.id}`}>
      <div className="group bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">
                  {station.station_name}
                </h3>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{station.location}</p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {statusIcon}
              <span className="capitalize">{station.status}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs border-t border-gray-100 pt-3 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">
                Alerts: <span className="font-medium text-gray-700 dark:text-gray-300">{station.alerts_count || 0}</span>
              </span>
            </div>
            <span className="text-gray-400 dark:text-gray-500">
              Updated: {new Date(station.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Preserve the layout configuration
(StationsIndex as any).layout = {
  breadcrumbs: [
    {
      title: 'Monitoring Stations',
      href: '/stations',
    },
  ],
};

export default StationsIndex;